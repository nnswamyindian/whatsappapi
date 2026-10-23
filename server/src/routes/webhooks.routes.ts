import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { sseManager } from '../services/sse.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 1. Meta Webhook Subscription Verification (GET)
router.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === ENV.WEBHOOK_VERIFY_TOKEN) {
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

  // Immediately acknowledge receipt to Meta to prevent timeout/retries
  res.status(200).send('EVENT_RECEIVED');

  if (body.object !== 'whatsapp_business_account') {
    return;
  }

  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
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
            const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            const timestamp = statusObj.timestamp
              ? new Date(parseInt(statusObj.timestamp, 10) * 1000).toISOString()
              : new Date().toISOString();

            // Update in messages table
            db.execute(
              `UPDATE messages
               SET status = ?,
                   updated_at = ?
               WHERE provider_message_id = ?`,
              [status, timestamp, wamid]
            );

            // Update in campaign recipients table
            let updateSql = 'UPDATE campaign_recipients SET status = ?';
            const params: any[] = [status];

            if (status === 'delivered') {
              updateSql += ', delivered_at = ?';
              params.push(timestamp);
            } else if (status === 'read') {
              updateSql += ', read_at = ?';
              params.push(timestamp);
            }

            updateSql += ' WHERE provider_message_id = ?';
            params.push(wamid);
            db.execute(updateSql, params);

            if (orgId) {
              sseManager.broadcastToOrg(orgId, 'message:status', {
                wamid,
                status,
                timestamp,
              });
            }
          }
        }

        // B. Handle Inbound Customer Messages
        if (value.messages && Array.isArray(value.messages)) {
          for (const inMsg of value.messages) {
            const fromPhone = `+${inMsg.from}`;
            const textBody = inMsg.text?.body || (inMsg.type ? `[${inMsg.type} message]` : '');
            const wamid = inMsg.id;
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

            // Record message in ledger
            db.execute(
              `INSERT INTO messages
               (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, provider_message_id, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'inbound', 'text', ?, 'delivered', ?, ?, ?)`,
              [uuidv4(), orgId, convId, contact.id, fromPhone, textBody, wamid, nowIso, nowIso]
            );

            sseManager.broadcastToOrg(orgId, 'inbox:inbound_message', {
              conversationId: convId,
              phone_e164: fromPhone,
              body: textBody,
              timestamp: nowIso,
            });
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Meta Webhook Ingest Error]:', err.message);
  }
});

export default router;
