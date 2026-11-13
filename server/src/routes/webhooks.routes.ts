import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { sseManager } from '../services/sse.js';
import { v4 as uuidv4 } from 'uuid';
import { workflowEngine } from '../services/workflow-engine.js';

const router = Router();

// In-memory set for deduplicating webhook events (capped to prevent memory growth)
const processedEventIds = new Set<string>();
function markAndCheckDuplicate(eventId: string): boolean {
  if (processedEventIds.has(eventId)) return true;
  if (processedEventIds.size > 20000) {
    const firstItems = Array.from(processedEventIds).slice(0, 5000);
    firstItems.forEach((id) => processedEventIds.delete(id));
  }
  processedEventIds.add(eventId);
  return false;
}

// Status hierarchy to prevent out-of-order event regressions
const STATUS_ORDER: Record<string, number> = {
  queued: 1,
  processing: 2,
  accepted: 3,
  sent: 4,
  delivered: 5,
  read: 6,
  failed: 7,
};

function shouldUpdateStatus(currentStatus: string, newStatus: string): boolean {
  // If either status is not in the list, allow update
  if (!STATUS_ORDER[currentStatus] || !STATUS_ORDER[newStatus]) return true;
  // If current is read, do not allow downgrading to delivered or sent
  if (currentStatus === 'read' && (newStatus === 'delivered' || newStatus === 'sent')) return false;
  // If current is delivered, do not allow downgrading to sent
  if (currentStatus === 'delivered' && newStatus === 'sent') return false;
  return true;
}

// 1. Meta Webhook Subscription Verification (GET)
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check against global env or organization-specific webhook verify tokens
  const isGlobalMatch = token === ENV.WEBHOOK_VERIFY_TOKEN;
  let isOrgMatch = false;

  if (!isGlobalMatch && token) {
    const conn = db.queryOne('SELECT 1 FROM whatsapp_connections WHERE webhook_verify_token = ?', [token]);
    if (conn) isOrgMatch = true;
  }

  if (mode === 'subscribe' && (isGlobalMatch || isOrgMatch)) {
    console.log('[Meta Webhook] Verification challenge confirmed successfully');
    res.status(200).send(challenge);
  } else {
    console.warn('[Meta Webhook] Verification challenge failed. Invalid verify token:', token);
    res.status(403).send('Verification token mismatch');
  }
});

// 2. Meta Webhook Event Processing (POST)
router.post('/whatsapp', (req: Request, res: Response) => {
  const body = req.body;
  const signature = req.headers['x-hub-signature-256'] as string;

  // Immediately acknowledge receipt to Meta to prevent timeout/retries
  res.status(200).send('EVENT_RECEIVED');

  if (body.object !== 'whatsapp_business_account') {
    return;
  }

  // HMAC-SHA256 Signature Verification using raw payload buffer if app secret is configured
  if (signature && ENV.META_APP_SECRET) {
    try {
      const rawPayload = (req as any).rawBody || Buffer.from(JSON.stringify(body));
      const expectedSig = `sha256=${crypto
        .createHmac('sha256', ENV.META_APP_SECRET)
        .update(rawPayload)
        .digest('hex')}`;

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSig);
      const isValid = sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      if (!isValid && process.env.NODE_ENV === 'production' && !ENV.IS_SANDBOX) {
        console.warn('[Meta Webhook] Signature verification failed.');
        return;
      }
    } catch (e: any) {
      console.warn('[Meta Webhook] Signature check error:', e.message);
    }
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        // C. Handle Template Status Updates (field: message_template_status_update)
        if (change.field === 'message_template_status_update') {
          const val = change.value;
          const templateName = val?.message_template_name;
          const templateLanguage = val?.message_template_language || 'en_US';
          const newStatus = val?.event; // 'APPROVED', 'REJECTED', 'PENDING', 'PAUSED'
          const rejectionReason = val?.reason || null;

          if (templateName && newStatus) {
            db.execute(
              `UPDATE templates
               SET status = ?,
                   rejection_reason = ?,
                   updated_at = ?
               WHERE name = ? AND language = ?`,
              [newStatus, rejectionReason, new Date().toISOString(), templateName, templateLanguage]
            );
            console.log(`[Meta Webhook] Template '${templateName}' status updated to ${newStatus}`);
          }
          continue;
        }

        if (change.field !== 'messages') continue;
        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;

        // Locate organization linked to this phone number
        const conn = db.queryOne<any>(
          'SELECT organization_id FROM whatsapp_connections WHERE phone_number_id = ?',
          [phoneNumberId]
        );
        const orgId = conn?.organization_id;

        // A. Handle Outbound Message Status Updates (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const wamid = statusObj.id;
            const newStatus = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            const timestamp = statusObj.timestamp
              ? new Date(parseInt(statusObj.timestamp, 10) * 1000).toISOString()
              : new Date().toISOString();

            // Deduplication check
            const dedupeKey = `status_${wamid}_${newStatus}`;
            if (markAndCheckDuplicate(dedupeKey)) continue;

            // Extract error details if message failed
            let errorCode = null;
            let errorMessage = null;
            if (newStatus === 'failed' && Array.isArray(statusObj.errors) && statusObj.errors.length > 0) {
              const err = statusObj.errors[0];
              errorCode = String(err.code || 'UNKNOWN_ERROR');
              errorMessage = err.title ? `${err.title}: ${err.message || ''}` : err.message || 'Delivery failed';
            }

            // Check current status in messages table
            const currentMsg = db.queryOne<{ status: string }>('SELECT status FROM messages WHERE provider_message_id = ?', [wamid]);
            if (currentMsg && !shouldUpdateStatus(currentMsg.status, newStatus)) {
              // Skip out-of-order older status
              continue;
            }

            // Update in messages table
            db.execute(
              `UPDATE messages
               SET status = ?,
                   error_code = COALESCE(?, error_code),
                   error_message = COALESCE(?, error_message),
                   updated_at = ?
               WHERE provider_message_id = ?`,
              [newStatus, errorCode, errorMessage, timestamp, wamid]
            );

            // Update in campaign recipients table
            let updateSql = 'UPDATE campaign_recipients SET status = ?';
            const params: any[] = [newStatus];

            if (errorCode || errorMessage) {
              updateSql += ', error_message = ?';
              params.push(errorMessage || `Code ${errorCode}`);
            }

            if (newStatus === 'delivered') {
              updateSql += ', delivered_at = ?';
              params.push(timestamp);
            } else if (newStatus === 'read') {
              updateSql += ', read_at = ?';
              params.push(timestamp);
            }

            updateSql += ' WHERE provider_message_id = ?';
            params.push(wamid);
            db.execute(updateSql, params);

            // Check if recipient belongs to a campaign and update campaign counters
            const campRecip = db.queryOne<{ campaign_id: string }>(
              'SELECT campaign_id FROM campaign_recipients WHERE provider_message_id = ?',
              [wamid]
            );

            if (campRecip) {
              if (newStatus === 'delivered') {
                db.execute('UPDATE campaigns SET delivered_count = delivered_count + 1 WHERE id = ?', [campRecip.campaign_id]);
              } else if (newStatus === 'read') {
                db.execute('UPDATE campaigns SET read_count = read_count + 1 WHERE id = ?', [campRecip.campaign_id]);
              } else if (newStatus === 'failed') {
                db.execute('UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?', [campRecip.campaign_id]);
              }
            }

            if (orgId) {
              sseManager.broadcastToOrg(orgId, 'message:status', {
                wamid,
                status: newStatus,
                timestamp,
                errorCode,
                errorMessage,
              });
            }
          }
        }

        // B. Handle Inbound Customer Messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const inMsg of value.messages) {
            const wamid = inMsg.id;
            if (markAndCheckDuplicate(`inbound_${wamid}`)) continue;

            const fromPhone = `+${inMsg.from}`;
            let textBody = '';
            let msgType = inMsg.type || 'text';

            if (inMsg.type === 'text') {
              textBody = inMsg.text?.body || '';
            } else if (inMsg.type === 'interactive') {
              textBody = inMsg.interactive?.button_reply?.title || inMsg.interactive?.list_reply?.title || '[Interactive Response]';
            } else if (inMsg.type === 'image') {
              textBody = inMsg.image?.caption || '[Image received]';
            } else if (inMsg.type === 'video') {
              textBody = inMsg.video?.caption || '[Video received]';
            } else if (inMsg.type === 'document') {
              textBody = inMsg.document?.filename || '[Document received]';
            } else if (inMsg.type === 'audio') {
              textBody = '[Voice / Audio note]';
            } else if (inMsg.type === 'location') {
              textBody = `[Location: ${inMsg.location?.name || ''} (${inMsg.location?.latitude}, ${inMsg.location?.longitude})]`;
            } else if (inMsg.type === 'reaction') {
              textBody = `[Reacted with ${inMsg.reaction?.emoji || 'emoji'}]`;
            } else {
              textBody = `[${msgType} message]`;
            }

            const now = new Date();
            const nowIso = now.toISOString();
            const windowExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

            if (!orgId) continue;

            // Check or create contact
            let contact = db.queryOne<any>(
              'SELECT id FROM contacts WHERE organization_id = ? AND phone_e164 = ?',
              [orgId, fromPhone]
            );

            if (!contact) {
              const cId = uuidv4();
              db.execute(
                `INSERT INTO contacts (id, organization_id, phone_e164, first_name, status, created_at, updated_at)
                 VALUES (?, ?, ?, 'WhatsApp Contact', 'active', ?, ?)`,
                [cId, orgId, fromPhone, nowIso, nowIso]
              );
              contact = { id: cId };
            }

            // Check or create conversation
            let conv = db.queryOne<any>(
              'SELECT id FROM conversations WHERE organization_id = ? AND contact_id = ?',
              [orgId, contact.id]
            );

            let convId = conv?.id;
            if (!convId) {
              convId = uuidv4();
              db.execute(
                `INSERT INTO conversations
                 (id, organization_id, contact_id, phone_e164, status, priority, last_message_at, last_inbound_at, window_expires_at, unread_count, created_at, updated_at)
                 VALUES (?, ?, ?, ?, 'open', 'medium', ?, ?, ?, 1, ?, ?)`,
                [convId, orgId, contact.id, fromPhone, nowIso, nowIso, windowExpiry, nowIso, nowIso]
              );
            } else {
              db.execute(
                `UPDATE conversations
                 SET last_message_at = ?,
                     last_inbound_at = ?,
                     window_expires_at = ?,
                     unread_count = unread_count + 1,
                     status = 'open',
                     updated_at = ?
                 WHERE id = ?`,
                [nowIso, nowIso, windowExpiry, nowIso, convId]
              );
            }

            const inboundMessageId = uuidv4();
            // Record message in ledger
            db.execute(
              `INSERT INTO messages
               (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, provider_message_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'inbound', ?, ?, 'delivered', ?, ?, ?)`,
              [inboundMessageId, orgId, convId, contact.id, fromPhone, msgType, textBody, wamid, nowIso, nowIso]
            );

            sseManager.broadcastToOrg(orgId, 'inbox:inbound_message', {
              conversationId: convId,
              phone_e164: fromPhone,
              body: textBody,
              timestamp: nowIso,
            });

            // Trigger workflow engine (chatbots, automations, reply rules) asynchronously
            workflowEngine.processInboundMessage({
              orgId,
              conversationId: convId,
              contactId: contact.id,
              phoneE164: fromPhone,
              messageText: textBody,
            }).catch((err) => console.error('[Workflow Engine Error on Webhook]:', err));
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Meta Webhook Ingest Error]:', err.message);
  }
});

export default router;
