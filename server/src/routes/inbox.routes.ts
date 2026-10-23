import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { sseManager } from '../services/sse.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// List Conversations with Status, 24h Window Timer, and Agent Assignment
router.get('/conversations', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const status = req.query.status as string; // 'open', 'pending', 'resolved'

  let query = `
    SELECT conv.*,
           c.first_name, c.last_name, c.email, c.tags, c.custom_fields,
           u.full_name as assigned_agent_name
    FROM conversations conv
    JOIN contacts c ON c.id = conv.contact_id
    LEFT JOIN users u ON u.id = conv.assigned_agent_id
    WHERE conv.organization_id = ?
  `;
  const params: any[] = [orgId];

  if (status) {
    query += ' AND conv.status = ?';
    params.push(status);
  }

  query += ' ORDER BY conv.last_message_at DESC';

  const conversations = db.query<any>(query, params);

  const now = Date.now();
  const enriched = conversations.map((conv) => {
    let windowActive = false;
    let windowExpiresInMs = 0;

    if (conv.window_expires_at) {
      const exp = new Date(conv.window_expires_at).getTime();
      if (exp > now) {
        windowActive = true;
        windowExpiresInMs = exp - now;
      }
    }

    return {
      ...conv,
      labels: JSON.parse(conv.labels || '[]'),
      contactTags: JSON.parse(conv.tags || '[]'),
      customFields: JSON.parse(conv.custom_fields || '{}'),
      is24HourWindowActive: windowActive,
      windowExpiresInMinutes: Math.max(0, Math.round(windowExpiresInMs / 60000)),
    };
  });

  res.json(enriched);
});

// Get Single Conversation Thread Messages, Notes, and Contact Profile
router.get('/conversations/:id', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const convId = req.params.id;

  const conv = db.queryOne<any>(
    `SELECT conv.*,
            c.first_name, c.last_name, c.email, c.tags, c.custom_fields,
            u.full_name as assigned_agent_name
     FROM conversations conv
     JOIN contacts c ON c.id = conv.contact_id
     LEFT JOIN users u ON u.id = conv.assigned_agent_id
     WHERE conv.id = ? AND conv.organization_id = ?`,
    [convId, orgId]
  );

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  // Clear unread count
  db.execute('UPDATE conversations SET unread_count = 0 WHERE id = ?', [convId]);

  // Fetch conversation messages
  const messages = db.query<any>(
    'SELECT * FROM messages WHERE organization_id = ? AND phone_e164 = ? ORDER BY created_at ASC',
    [orgId, conv.phone_e164]
  );

  // Fetch internal notes
  const notes = db.query<any>(
    'SELECT * FROM internal_notes WHERE conversation_id = ? ORDER BY created_at ASC',
    [convId]
  );

  const now = Date.now();
  let windowActive = false;
  let windowExpiresInMs = 0;
  if (conv.window_expires_at) {
    const exp = new Date(conv.window_expires_at).getTime();
    if (exp > now) {
      windowActive = true;
      windowExpiresInMs = exp - now;
    }
  }

  res.json({
    conversation: {
      ...conv,
      labels: JSON.parse(conv.labels || '[]'),
      contactTags: JSON.parse(conv.tags || '[]'),
      customFields: JSON.parse(conv.custom_fields || '{}'),
      is24HourWindowActive: windowActive,
      windowExpiresInMinutes: Math.max(0, Math.round(windowExpiresInMs / 60000)),
    },
    messages,
    internalNotes: notes,
  });
});

// Send Outbound Message from Agent (Respects 24h Customer Service Window)
router.post('/conversations/:id/messages', requireRole(['support_agent']), async (req: Request, res: Response) => {
  const { body, templateName, mediaUrl } = req.body;
  const orgId = req.auth!.orgId;
  const convId = req.params.id;

  const conv = db.queryOne<any>('SELECT * FROM conversations WHERE id = ? AND organization_id = ?', [
    convId,
    orgId,
  ]);

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const now = Date.now();
  let windowActive = false;
  if (conv.window_expires_at) {
    windowActive = new Date(conv.window_expires_at).getTime() > now;
  }

  // If 24-hour window has expired and agent tries to send freeform text, WhatsApp rules block it
  if (!windowActive && !templateName) {
    res.status(400).json({
      error: 'WhatsApp 24-Hour Window Expired',
      message: 'The 24-hour customer service window has expired. You must send an approved WhatsApp Template to initiate contact.',
    });
    return;
  }

  const { provider } = getWhatsAppProviderForOrg(orgId);
  const nowIso = new Date().toISOString();

  let sendResult;
  if (templateName) {
    const template = db.queryOne<any>('SELECT * FROM templates WHERE organization_id = ? AND name = ?', [
      orgId,
      templateName,
    ]);
    sendResult = await provider.sendMessage({
      toPhoneE164: conv.phone_e164,
      type: 'template',
      template: {
        name: templateName,
        language: template?.language || 'en_US',
      },
    });
  } else {
    sendResult = await provider.sendMessage({
      toPhoneE164: conv.phone_e164,
      type: 'text',
      text: { body },
    });
  }

  const wamid = sendResult.providerMessageId || `wamid.${Date.now()}`;
  const msgId = uuidv4();

  db.transaction(() => {
    db.execute(
      `INSERT INTO messages
       (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, media_url, template_name, status, provider_message_id, cost, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'outbound', ?, ?, ?, ?, ?, ?, 0.0018, ?, ?)`,
      [
        msgId,
        orgId,
        convId,
        conv.contact_id,
        conv.phone_e164,
        templateName ? 'template' : 'text',
        body || null,
        mediaUrl || null,
        templateName || null,
        sendResult.success ? 'sent' : 'failed',
        wamid,
        nowIso,
        nowIso,
      ]
    );

    db.execute(
      'UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?',
      [nowIso, nowIso, convId]
    );
  });

  // Broadcast real-time message event via SSE
  sseManager.broadcastToOrg(orgId, 'inbox:message_sent', {
    conversationId: convId,
    message: {
      id: msgId,
      phone_e164: conv.phone_e164,
      direction: 'outbound',
      body,
      template_name: templateName,
      status: sendResult.success ? 'sent' : 'failed',
      created_at: nowIso,
    },
  });

  res.json({
    id: msgId,
    status: sendResult.success ? 'sent' : 'failed',
    providerMessageId: wamid,
  });
});

// Add Internal Note (Strictly Private to Team)
router.post('/conversations/:id/notes', requireRole(['support_agent']), (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Note content is required' });
    return;
  }

  const user = db.queryOne<any>('SELECT full_name FROM users WHERE id = ?', [req.auth!.userId]);
  const noteId = uuidv4();
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO internal_notes (id, conversation_id, user_id, user_name, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [noteId, req.params.id, req.auth!.userId, user?.full_name || 'Agent', content, now]
  );

  res.status(201).json({ id: noteId, userName: user?.full_name || 'Agent', content, created_at: now });
});

// Assign Conversation to Agent or Team
router.patch('/conversations/:id/assign', requireRole(['support_agent']), (req: Request, res: Response) => {
  const { agentId, team } = req.body;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE conversations
     SET assigned_agent_id = COALESCE(?, assigned_agent_id),
         assigned_team = COALESCE(?, assigned_team),
         updated_at = ?
     WHERE id = ? AND organization_id = ?`,
    [agentId, team, now, req.params.id, req.auth!.orgId]
  );

  res.json({ success: true });
});

// Update Conversation Status (Open, Pending, Resolved)
router.patch('/conversations/:id/status', requireRole(['support_agent']), (req: Request, res: Response) => {
  const { status, priority } = req.body;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE conversations
     SET status = COALESCE(?, status),
         priority = COALESCE(?, priority),
         updated_at = ?
     WHERE id = ? AND organization_id = ?`,
    [status, priority, now, req.params.id, req.auth!.orgId]
  );

  res.json({ success: true });
});

// Canned Quick Replies List & Creation
router.get('/canned-replies', (req: Request, res: Response) => {
  const replies = db.query<any>('SELECT * FROM canned_replies WHERE organization_id = ?', [req.auth!.orgId]);
  res.json(replies);
});

router.post('/canned-replies', requireRole(['support_agent']), (req: Request, res: Response) => {
  const { shortcut, title, content } = req.body;
  if (!shortcut || !title || !content) {
    res.status(400).json({ error: 'Shortcut, title, and content required' });
    return;
  }

  const id = uuidv4();
  const cleanShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
  db.execute(
    'INSERT INTO canned_replies (id, organization_id, shortcut, title, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.auth!.orgId, cleanShortcut, title, content, new Date().toISOString()]
  );

  res.status(201).json({ id, shortcut: cleanShortcut, title, content });
});

// Simulate Inbound Customer WhatsApp Message (Sandbox / Testing tool)
router.post('/simulate-inbound', (req: Request, res: Response) => {
  const { phone, body = 'Hi, I received your message. Can you help me?' } = req.body;
  const orgId = req.auth!.orgId;

  const contact = db.queryOne<any>('SELECT id, phone_e164 FROM contacts WHERE organization_id = ? AND (phone_e164 = ? OR id = ?)', [
    orgId,
    phone,
    phone,
  ]) || db.queryOne<any>('SELECT id, phone_e164 FROM contacts WHERE organization_id = ? LIMIT 1', [orgId]);

  if (!contact) {
    res.status(404).json({ error: 'No contact available to simulate inbound message' });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();
  // 24 hour window expires in 24h
  const windowExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const wamid = `wamid.SIM_INBOUND_${Date.now()}`;
  const msgId = uuidv4();

  let conv = db.queryOne<any>('SELECT id FROM conversations WHERE organization_id = ? AND contact_id = ?', [
    orgId,
    contact.id,
  ]);

  db.transaction(() => {
    let convId = conv?.id;
    if (!convId) {
      convId = uuidv4();
      db.execute(
        `INSERT INTO conversations
         (id, organization_id, contact_id, phone_e164, status, priority, last_message_at, last_inbound_at, window_expires_at, unread_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'open', 'medium', ?, ?, ?, 1, ?, ?)`,
        [convId, orgId, contact.id, contact.phone_e164, nowIso, nowIso, windowExpiry, nowIso, nowIso]
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

    db.execute(
      `INSERT INTO messages
       (id, organization_id, conversation_id, contact_id, phone_e164, direction, message_type, body, status, provider_message_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'inbound', 'text', ?, 'delivered', ?, ?, ?)`,
      [msgId, orgId, convId, contact.id, contact.phone_e164, body, wamid, nowIso, nowIso]
    );
  });

  // Broadcast real-time event
  sseManager.broadcastToOrg(orgId, 'inbox:inbound_message', {
    phone_e164: contact.phone_e164,
    body,
    timestamp: nowIso,
  });

  res.json({
    success: true,
    message: 'Inbound message simulated successfully. 24h customer service window activated.',
    wamid,
  });
});

export default router;
