import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { v4 as uuidv4 } from 'uuid';
import { encryptSecret, maskSecret } from '../utils/crypto.js';
import { ENV } from '../config/env.js';
const router = Router();
router.use(authMiddleware);
// Get WhatsApp Connection Status
router.get('/status', (req, res) => {
    const conn = db.queryOne(`SELECT id, provider, mode, waba_id, phone_number_id, display_phone_number,
            verified_name, quality_rating, messaging_limit_tier, status, last_sync_at,
            access_token, webhook_verify_token
     FROM whatsapp_connections
     WHERE organization_id = ?`, [req.auth.orgId]);
    if (!conn) {
        res.json({
            status: 'disconnected',
            mode: 'sandbox',
            metaAppId: ENV.META_APP_ID,
            metaConfigId: ENV.META_CONFIG_ID,
            graphApiVersion: ENV.META_API_VERSION,
        });
        return;
    }
    // Sanitize: Never expose raw plaintext tokens to frontend
    res.json({
        id: conn.id,
        provider: conn.provider,
        mode: conn.mode,
        waba_id: conn.waba_id,
        phone_number_id: conn.phone_number_id,
        display_phone_number: conn.display_phone_number,
        verified_name: conn.verified_name,
        quality_rating: conn.quality_rating,
        messaging_limit_tier: conn.messaging_limit_tier,
        status: conn.status,
        last_sync_at: conn.last_sync_at,
        accessTokenMasked: conn.access_token ? maskSecret(conn.access_token) : null,
        hasToken: Boolean(conn.access_token),
        metaAppId: ENV.META_APP_ID,
        metaConfigId: ENV.META_CONFIG_ID,
        graphApiVersion: ENV.META_API_VERSION,
    });
});
// Meta WhatsApp Embedded Signup v4 Onboarding Exchange
router.post('/embedded-signup/exchange', requireRole(['admin']), async (req, res) => {
    const { code, wabaId, phoneNumberId } = req.body;
    const orgId = req.auth.orgId;
    const now = new Date().toISOString();
    if (!code && (!wabaId || !phoneNumberId)) {
        res.status(400).json({
            error: 'Missing Embedded Signup details',
            message: 'Authorization code or verified WABA & Phone Number IDs are required.',
        });
        return;
    }
    try {
        let accessToken = '';
        let displayPhoneNumber = '';
        let verifiedName = 'Connected WhatsApp Business';
        if (code && ENV.META_APP_SECRET && ENV.META_APP_ID) {
            // 1. Exchange OAuth code for Meta System User / Access Token
            const tokenUrl = `https://graph.facebook.com/${ENV.META_API_VERSION}/oauth/access_token?client_id=${ENV.META_APP_ID}&client_secret=${ENV.META_APP_SECRET}&code=${code}`;
            const tokenRes = await fetch(tokenUrl);
            const tokenData = await tokenRes.json();
            if (tokenData.access_token) {
                accessToken = tokenData.access_token;
            }
        }
        // Fallback to configured environment access token if running in assisted sandbox/partner setup
        if (!accessToken && ENV.META_ACCESS_TOKEN) {
            accessToken = ENV.META_ACCESS_TOKEN;
        }
        // 2. Fetch phone details and verified name if live access token available
        if (accessToken && phoneNumberId) {
            try {
                const phoneUrl = `https://graph.facebook.com/${ENV.META_API_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating`;
                const phoneRes = await fetch(phoneUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (phoneRes.ok) {
                    const pData = await phoneRes.json();
                    displayPhoneNumber = pData.display_phone_number || '';
                    verifiedName = pData.verified_name || verifiedName;
                }
                // 3. Automatically subscribe application to WABA webhooks
                if (wabaId) {
                    await fetch(`https://graph.facebook.com/${ENV.META_API_VERSION}/${wabaId}/subscribed_apps`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                }
            }
            catch (e) {
                console.warn('[Embedded Signup Setup Warning]:', e);
            }
        }
        // 4. Encrypt credentials at rest
        const encryptedToken = accessToken ? encryptSecret(accessToken) : null;
        const existing = db.queryOne('SELECT id FROM whatsapp_connections WHERE organization_id = ?', [orgId]);
        if (existing) {
            db.execute(`UPDATE whatsapp_connections
         SET mode = 'live',
             waba_id = ?,
             phone_number_id = ?,
             access_token = COALESCE(?, access_token),
             display_phone_number = COALESCE(?, display_phone_number),
             verified_name = COALESCE(?, verified_name),
             status = 'connected',
             last_sync_at = ?,
             updated_at = ?
         WHERE organization_id = ?`, [wabaId, phoneNumberId, encryptedToken, displayPhoneNumber, verifiedName, now, now, orgId]);
        }
        else {
            db.execute(`INSERT INTO whatsapp_connections
         (id, organization_id, provider, mode, waba_id, phone_number_id, access_token, display_phone_number, verified_name, status, last_sync_at, created_at, updated_at)
         VALUES (?, ?, 'meta_cloud', 'live', ?, ?, ?, ?, ?, 'connected', ?, ?, ?)`, [uuidv4(), orgId, wabaId, phoneNumberId, encryptedToken, displayPhoneNumber, verifiedName, now, now, now]);
        }
        res.json({
            success: true,
            message: 'Meta WhatsApp Embedded Signup completed successfully! Connected and subscribed to webhooks.',
            wabaId,
            phoneNumberId,
            displayPhoneNumber,
            verifiedName,
        });
    }
    catch (err) {
        console.error('[Embedded Signup Error]:', err);
        res.status(500).json({ error: 'Embedded Signup Exchange Failed', message: err.message });
    }
});
// Disconnect WhatsApp Connection
router.post('/disconnect', requireRole(['admin']), (req, res) => {
    const orgId = req.auth.orgId;
    const now = new Date().toISOString();
    db.execute(`UPDATE whatsapp_connections
     SET mode = 'sandbox',
         access_token = NULL,
         status = 'disconnected',
         updated_at = ?
     WHERE organization_id = ?`, [now, orgId]);
    res.json({ success: true, message: 'WhatsApp connection disconnected. Workspace reverted to Sandbox mode.' });
});
// Configure WhatsApp Connection (Live Meta Cloud API or Sandbox Manual Fallback)
router.post('/configure', requireRole(['admin']), (req, res) => {
    const { mode, wabaId, phoneNumberId, accessToken, webhookVerifyToken, appSecret, displayPhoneNumber, verifiedName } = req.body;
    const now = new Date().toISOString();
    const orgId = req.auth.orgId;
    if (mode === 'live') {
        if (!wabaId || !phoneNumberId) {
            res.status(400).json({
                error: 'Missing live credentials',
                message: 'WABA ID and Phone Number ID are required for Live mode',
            });
            return;
        }
    }
    // Encrypt secrets at rest before persisting
    const encryptedToken = accessToken ? encryptSecret(accessToken) : null;
    const encryptedAppSecret = appSecret ? encryptSecret(appSecret) : null;
    const existing = db.queryOne('SELECT id FROM whatsapp_connections WHERE organization_id = ?', [orgId]);
    if (existing) {
        db.execute(`UPDATE whatsapp_connections
       SET mode = ?,
           waba_id = ?,
           phone_number_id = ?,
           access_token = COALESCE(?, access_token),
           webhook_verify_token = COALESCE(?, webhook_verify_token),
           app_secret = COALESCE(?, app_secret),
           display_phone_number = COALESCE(?, display_phone_number),
           verified_name = COALESCE(?, verified_name),
           status = 'connected',
           updated_at = ?
       WHERE organization_id = ?`, [mode || 'sandbox', wabaId, phoneNumberId, encryptedToken, webhookVerifyToken, encryptedAppSecret, displayPhoneNumber, verifiedName, now, orgId]);
    }
    else {
        db.execute(`INSERT INTO whatsapp_connections
       (id, organization_id, provider, mode, waba_id, phone_number_id, access_token, webhook_verify_token, app_secret, display_phone_number, verified_name, status, created_at, updated_at)
       VALUES (?, ?, 'meta_cloud', ?, ?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?)`, [uuidv4(), orgId, mode || 'sandbox', wabaId, phoneNumberId, encryptedToken, webhookVerifyToken, encryptedAppSecret, displayPhoneNumber, verifiedName, now, now]);
    }
    res.json({ success: true, message: `WhatsApp connection updated to ${mode || 'sandbox'} mode with encrypted credentials.` });
});
// Test Connection
router.post('/test-connection', async (req, res) => {
    try {
        const { provider, isSandbox } = getWhatsAppProviderForOrg(req.auth.orgId);
        const result = await provider.testConnection();
        if (result.ok) {
            // Update quality rating if available
            if (result.details?.qualityRating) {
                db.execute("UPDATE whatsapp_connections SET quality_rating = ?, status = 'connected', last_sync_at = ? WHERE organization_id = ?", [result.details.qualityRating, new Date().toISOString(), req.auth.orgId]);
            }
        }
        res.json({
            ...result,
            isSandbox,
        });
    }
    catch (err) {
        res.status(500).json({ ok: false, message: err.message });
    }
});
// Synchronize Templates from Provider
router.post('/sync-templates', requireRole(['campaign_manager']), async (req, res) => {
    try {
        const { provider } = getWhatsAppProviderForOrg(req.auth.orgId);
        const remoteTemplates = await provider.fetchTemplates();
        const orgId = req.auth.orgId;
        const now = new Date().toISOString();
        let createdCount = 0;
        let updatedCount = 0;
        for (const t of remoteTemplates) {
            const existing = db.queryOne('SELECT id FROM templates WHERE organization_id = ? AND name = ? AND language = ?', [orgId, t.name, t.language || 'en_US']);
            if (existing) {
                db.execute(`UPDATE templates
           SET status = ?,
               body_text = ?,
               header_type = ?,
               header_content = ?,
               footer_text = ?,
               buttons_json = ?,
               is_carousel = ?,
               cards_json = ?,
               rejection_reason = ?,
               updated_at = ?
           WHERE id = ?`, [
                    t.status,
                    t.bodyText,
                    t.headerType,
                    t.headerContent || null,
                    t.footerText || null,
                    JSON.stringify(t.buttons || []),
                    t.isCarousel ? 1 : 0,
                    JSON.stringify(t.cards || []),
                    t.rejectionReason || null,
                    now,
                    existing.id,
                ]);
                updatedCount++;
            }
            else {
                db.execute(`INSERT INTO templates
           (id, organization_id, name, category, language, header_type, header_content, body_text, footer_text, buttons_json, is_carousel, cards_json, status, rejection_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                    uuidv4(),
                    orgId,
                    t.name,
                    t.category,
                    t.language || 'en_US',
                    t.headerType,
                    t.headerContent || null,
                    t.bodyText,
                    t.footerText || null,
                    JSON.stringify(t.buttons || []),
                    t.isCarousel ? 1 : 0,
                    JSON.stringify(t.cards || []),
                    t.status,
                    t.rejectionReason || null,
                    now,
                    now,
                ]);
                createdCount++;
            }
        }
        // Update connection last_sync_at
        db.execute('UPDATE whatsapp_connections SET last_sync_at = ? WHERE organization_id = ?', [now, orgId]);
        res.json({
            success: true,
            syncedTotal: remoteTemplates.length,
            createdCount,
            updatedCount,
            message: `Synchronized ${remoteTemplates.length} templates successfully`,
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Template sync failed', message: err.message });
    }
});
export default router;
