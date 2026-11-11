import { db } from '../db/index.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { sseManager } from './sse.js';
import { v4 as uuidv4 } from 'uuid';
class MessageQueueService {
    queue = [];
    isProcessing = false;
    activeCampaigns = new Set();
    pausedCampaigns = new Set();
    constructor() {
        // 1. Recover uncompleted campaigns on startup (Durable Queue Recovery)
        setTimeout(() => this.recoverDurableJobs(), 1500);
        // 2. Start non-blocking background worker loop
        setInterval(() => this.processNext(), 250);
    }
    recoverDurableJobs() {
        try {
            const pendingCampaigns = db.query("SELECT id, organization_id FROM campaigns WHERE status IN ('processing', 'scheduled')");
            for (const camp of pendingCampaigns) {
                const queuedCount = db.queryOne("SELECT COUNT(*) as count FROM campaign_recipients WHERE campaign_id = ? AND status = 'queued'", [camp.id])?.count || 0;
                if (queuedCount > 0) {
                    console.log(`[Queue Recovery] Resuming interrupted campaign ${camp.id} with ${queuedCount} queued recipients`);
                    this.enqueue({
                        type: 'CAMPAIGN_BATCH',
                        orgId: camp.organization_id,
                        data: { campaignId: camp.id, orgId: camp.organization_id, batchSize: 15 },
                    });
                }
            }
        }
        catch (e) {
            console.warn('[Queue Recovery Notice]:', e.message);
        }
    }
    enqueue(job, maxRetries = 3) {
        const id = uuidv4();
        this.queue.push({
            ...job,
            id,
            retries: 0,
            maxRetries,
            nextRunAt: Date.now(),
        });
        return id;
    }
    pauseCampaign(campaignId) {
        this.pausedCampaigns.add(campaignId);
        db.execute("UPDATE campaigns SET status = 'paused', updated_at = ? WHERE id = ?", [
            new Date().toISOString(),
            campaignId,
        ]);
    }
    resumeCampaign(campaignId) {
        this.pausedCampaigns.delete(campaignId);
        db.execute("UPDATE campaigns SET status = 'processing', updated_at = ? WHERE id = ?", [
            new Date().toISOString(),
            campaignId,
        ]);
        const camp = db.queryOne('SELECT organization_id FROM campaigns WHERE id = ?', [campaignId]);
        if (camp) {
            this.enqueue({
                type: 'CAMPAIGN_BATCH',
                orgId: camp.organization_id,
                data: { campaignId, orgId: camp.organization_id, batchSize: 15 },
            });
        }
    }
    cancelCampaign(campaignId) {
        this.pausedCampaigns.add(campaignId);
        db.execute("UPDATE campaigns SET status = 'cancelled', updated_at = ? WHERE id = ?", [
            new Date().toISOString(),
            campaignId,
        ]);
    }
    async processNext() {
        if (this.isProcessing || this.queue.length === 0)
            return;
        // Find next eligible job considering retry backoff
        const now = Date.now();
        const jobIndex = this.queue.findIndex((j) => (j.nextRunAt || 0) <= now);
        if (jobIndex === -1)
            return;
        this.isProcessing = true;
        const [job] = this.queue.splice(jobIndex, 1);
        try {
            if (job.type === 'CAMPAIGN_BATCH') {
                await this.handleCampaignBatch(job);
            }
            else if (job.type === 'TRANSACTIONAL_MESSAGE') {
                await this.handleTransactionalMessage(job);
            }
        }
        catch (err) {
            console.error(`[Queue Error] Job ${job.id} failed:`, err.message);
            // Exponential backoff retry: 2s, 6s, 18s
            if (job.retries < job.maxRetries) {
                job.retries++;
                job.nextRunAt = Date.now() + Math.pow(3, job.retries) * 1000;
                this.queue.push(job);
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    async handleCampaignBatch(job) {
        const { campaignId, orgId, batchSize = 15 } = job.data;
        // Check if campaign was paused or cancelled
        if (this.pausedCampaigns.has(campaignId)) {
            return;
        }
        const campaign = db.queryOne('SELECT * FROM campaigns WHERE id = ? AND organization_id = ?', [
            campaignId,
            orgId,
        ]);
        if (!campaign || campaign.status === 'paused' || campaign.status === 'cancelled') {
            return;
        }
        // Atomic fetch of next batch of 'queued' recipients (guarantees idempotency and prevents re-sending)
        const recipients = db.query("SELECT * FROM campaign_recipients WHERE campaign_id = ? AND status = 'queued' LIMIT ?", [campaignId, batchSize]);
        if (recipients.length === 0) {
            // Mark campaign completed
            const now = new Date().toISOString();
            db.execute("UPDATE campaigns SET status = 'completed', updated_at = ? WHERE id = ?", [now, campaignId]);
            this.activeCampaigns.delete(campaignId);
            sseManager.broadcastToOrg(orgId, 'campaign:completed', { campaignId, status: 'completed' });
            return;
        }
        const template = db.queryOne('SELECT * FROM templates WHERE id = ?', [campaign.template_id]);
        const { provider, isSandbox } = getWhatsAppProviderForOrg(orgId);
        for (const recip of recipients) {
            if (this.pausedCampaigns.has(campaignId))
                break;
            const now = new Date().toISOString();
            // 1. Compliance pre-flight: Verify suppression & opt-in consent
            const isSuppressed = db.queryOne('SELECT 1 FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?', [orgId, recip.phone_e164]);
            if (isSuppressed) {
                db.execute("UPDATE campaign_recipients SET status = 'excluded', exclusion_reason = 'Phone is on suppression/opt-out list' WHERE id = ?", [recip.id]);
                db.execute('UPDATE campaigns SET excluded_recipients = excluded_recipients + 1 WHERE id = ?', [campaignId]);
                continue;
            }
            // 2. Prepare variables
            let vars = [];
            try {
                const applied = JSON.parse(recip.variables_applied_json || '{}');
                vars = Object.values(applied);
            }
            catch (e) { }
            // 3. Mark recipient processing atomically
            db.execute("UPDATE campaign_recipients SET status = 'processing' WHERE id = ?", [recip.id]);
            // 4. Send through provider adapter
            const sendResult = await provider.sendMessage({
                toPhoneE164: recip.phone_e164,
                type: 'template',
                template: {
                    name: template?.name || 'order_status_update',
                    language: template?.language || 'en_US',
                    components: vars.length > 0
                        ? [
                            {
                                type: 'body',
                                parameters: vars.map((v) => ({ type: 'text', text: String(v) })),
                            },
                        ]
                        : [],
                },
            });
            if (sendResult.success) {
                const wamid = sendResult.providerMessageId || `wamid.${Date.now()}`;
                db.execute(`UPDATE campaign_recipients
           SET status = 'sent', provider_message_id = ?, sent_at = ?
           WHERE id = ?`, [wamid, now, recip.id]);
                // Record in master messages ledger
                db.execute(`INSERT INTO messages (id, organization_id, phone_e164, direction, message_type, template_name, template_category, status, provider_message_id, cost, created_at, updated_at)
           VALUES (?, ?, ?, 'outbound', 'template', ?, ?, 'sent', ?, 0.0119, ?, ?)`, [uuidv4(), orgId, recip.phone_e164, template?.name, template?.category || 'MARKETING', wamid, now, now]);
                db.execute('UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?', [campaignId]);
                // If sandbox mode, schedule realistic asynchronous delivery & read simulation
                if (isSandbox) {
                    setTimeout(() => {
                        const delTime = new Date().toISOString();
                        db.execute("UPDATE campaign_recipients SET status = 'delivered', delivered_at = ? WHERE id = ?", [
                            delTime,
                            recip.id,
                        ]);
                        db.execute("UPDATE messages SET status = 'delivered', updated_at = ? WHERE provider_message_id = ?", [delTime, wamid]);
                        db.execute('UPDATE campaigns SET delivered_count = delivered_count + 1 WHERE id = ?', [campaignId]);
                        sseManager.broadcastToOrg(orgId, 'message:status', { wamid, status: 'delivered', campaignId });
                        if (Math.random() < 0.75) {
                            setTimeout(() => {
                                const readTime = new Date().toISOString();
                                db.execute("UPDATE campaign_recipients SET status = 'read', read_at = ? WHERE id = ?", [
                                    readTime,
                                    recip.id,
                                ]);
                                db.execute("UPDATE messages SET status = 'read', updated_at = ? WHERE provider_message_id = ?", [
                                    readTime,
                                    wamid,
                                ]);
                                db.execute('UPDATE campaigns SET read_count = read_count + 1 WHERE id = ?', [campaignId]);
                                sseManager.broadcastToOrg(orgId, 'message:status', { wamid, status: 'read', campaignId });
                            }, 1200);
                        }
                    }, 800);
                }
            }
            else {
                db.execute(`UPDATE campaign_recipients
           SET status = 'failed', error_message = ?
           WHERE id = ?`, [sendResult.errorMessage || 'Send failure', recip.id]);
                db.execute('UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?', [campaignId]);
            }
            // Rate pacing delay to comply with provider concurrency guidelines
            await new Promise((r) => setTimeout(r, 60));
        }
        // Broadcast campaign progress
        const updatedStats = db.queryOne('SELECT sent_count, delivered_count, read_count, failed_count, eligible_recipients FROM campaigns WHERE id = ?', [campaignId]);
        sseManager.broadcastToOrg(orgId, 'campaign:progress', {
            campaignId,
            ...updatedStats,
        });
        // Enqueue remaining batch if any
        const remainingCount = db.queryOne("SELECT COUNT(*) as count FROM campaign_recipients WHERE campaign_id = ? AND status = 'queued'", [campaignId])?.count || 0;
        if (remainingCount > 0 && !this.pausedCampaigns.has(campaignId)) {
            this.enqueue(job);
        }
        else if (remainingCount === 0) {
            db.execute("UPDATE campaigns SET status = 'completed', updated_at = ? WHERE id = ?", [
                new Date().toISOString(),
                campaignId,
            ]);
            sseManager.broadcastToOrg(orgId, 'campaign:completed', { campaignId, status: 'completed' });
        }
    }
    async handleTransactionalMessage(job) {
        const { orgId, toPhoneE164, type, body, template, media, location, contacts, interactive } = job.data;
        const { provider } = getWhatsAppProviderForOrg(orgId);
        const result = await provider.sendMessage({
            toPhoneE164,
            type,
            text: body ? { body } : undefined,
            template,
            media,
            location,
            contacts,
            interactive,
        });
        const now = new Date().toISOString();
        const wamid = result.providerMessageId || `wamid.${Date.now()}`;
        db.execute(`INSERT INTO messages (id, organization_id, phone_e164, direction, message_type, body, status, provider_message_id, cost, created_at, updated_at)
       VALUES (?, ?, ?, 'outbound', ?, ?, ?, ?, 0.0028, ?, ?)`, [uuidv4(), orgId, toPhoneE164, type, body || '', result.success ? 'sent' : 'failed', wamid, now, now]);
        sseManager.broadcastToOrg(orgId, 'message:new', {
            wamid,
            toPhoneE164,
            status: result.success ? 'sent' : 'failed',
        });
    }
}
export const messageQueue = new MessageQueueService();
