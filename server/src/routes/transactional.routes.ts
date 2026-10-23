import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { normalizePhone } from '../utils/phone.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// --- Scoped Developer API Keys Management (Protected by Session Auth) ---
router.get('/api-keys', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  const keys = db.query<any>(
    'SELECT id, name, key_prefix, permissions, last_used_at, status, created_at FROM api_keys WHERE organization_id = ? ORDER BY created_at DESC',
    [req.auth!.orgId]
  );

  res.json(
    keys.map((k) => ({
      ...k,
      permissions: JSON.parse(k.permissions || '[]'),
    }))
  );
});

router.post('/api-keys', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  const { name, permissions = ['messages:send', 'otp:verify', 'reports:read'] } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Key name required' });
    return;
  }

  const rawSecret = `gw_live_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawSecret.substring(0, 12);
  const keyHash = bcrypt.hashSync(rawSecret, 10);
  const id = uuidv4();
  const now = new Date().toISOString();

  db.execute(
    `INSERT INTO api_keys (id, organization_id, name, key_hash, key_prefix, permissions, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
    [id, req.auth!.orgId, name, keyHash, `${keyPrefix}...`, JSON.stringify(permissions), now]
  );

  res.status(201).json({
    id,
    name,
    apiKey: rawSecret, // Displayed once at creation
    keyPrefix,
    permissions,
    message: 'Store this API Key securely. For security, it will never be displayed again.',
  });
});

router.delete('/api-keys/:id', authMiddleware, requireRole(['admin']), (req: Request, res: Response) => {
  db.execute('DELETE FROM api_keys WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

// --- Server-to-Server Transactional Messaging API (Supports both JWT & API Key) ---
router.post('/messages', authMiddleware, async (req: Request, res: Response) => {
  const { to, type = 'template', template, text } = req.body;
  const orgId = req.auth!.orgId;

  const normalized = normalizePhone(to);
  if (!normalized.isValid) {
    res.status(400).json({ error: 'Invalid recipient phone', details: normalized.error });
    return;
  }

  // Pre-flight compliance: Check suppression list
  const isSuppressed = db.queryOne('SELECT 1 FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?', [
    orgId,
    normalized.e164,
  ]);
  if (isSuppressed) {
    res.status(403).json({
      error: 'Recipient Suppressed',
      message: 'This phone number has opted out or is on the suppression compliance blocklist.',
    });
    return;
  }

  const { provider, isSandbox } = getWhatsAppProviderForOrg(orgId);

  const sendResult = await provider.sendMessage({
    toPhoneE164: normalized.e164,
    type,
    template,
    text,
  });

  const now = new Date().toISOString();
  const wamid = sendResult.providerMessageId || `wamid.${Date.now()}`;
  const msgId = uuidv4();

  db.execute(
    `INSERT INTO messages
     (id, organization_id, phone_e164, direction, message_type, template_name, status, provider_message_id, cost, created_at, updated_at)
     VALUES (?, ?, ?, 'outbound', ?, ?, ?, ?, 0.0018, ?, ?)`,
    [
      msgId,
      orgId,
      normalized.e164,
      type,
      template?.name || null,
      sendResult.success ? 'sent' : 'failed',
      wamid,
      now,
      now,
    ]
  );

  res.status(sendResult.success ? 200 : 502).json({
    id: msgId,
    providerMessageId: wamid,
    status: sendResult.success ? 'accepted' : 'failed',
    isSandbox,
  });
});

// --- Secure WhatsApp OTP Request Engine ---
router.post('/auth/otp/request', authMiddleware, async (req: Request, res: Response) => {
  const { phone, ttlMinutes = 5 } = req.body;
  const orgId = req.auth!.orgId;

  const normalized = normalizePhone(phone);
  if (!normalized.isValid) {
    res.status(400).json({ error: 'Invalid phone format for OTP', details: normalized.error });
    return;
  }

  const now = Date.now();

  // Anti-abuse: Check cooldown (must wait at least 45 seconds between OTP requests)
  const recentOtp = db.queryOne<any>(
    "SELECT resend_available_at FROM otp_verifications WHERE organization_id = ? AND phone_e164 = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
    [orgId, normalized.e164]
  );

  if (recentOtp && new Date(recentOtp.resend_available_at).getTime() > now) {
    const waitSeconds = Math.ceil((new Date(recentOtp.resend_available_at).getTime() - now) / 1000);
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Please wait ${waitSeconds} seconds before requesting a new OTP code.`,
    });
    return;
  }

  // Generate 6-digit cryptographic random OTP code
  const otpCode = crypto.randomInt(100000, 999999).toString();
  // Hash code using SHA256 verifier (never store raw OTP)
  const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');

  const expiryDate = new Date(now + ttlMinutes * 60 * 1000).toISOString();
  const resendDate = new Date(now + 45 * 1000).toISOString();
  const otpId = uuidv4();
  const nowIso = new Date(now).toISOString();

  db.execute(
    `INSERT INTO otp_verifications
     (id, organization_id, phone_e164, otp_hash, expires_at, attempts_remaining, status, resend_available_at, created_at)
     VALUES (?, ?, ?, ?, ?, 3, 'pending', ?, ?)`,
    [otpId, orgId, normalized.e164, otpHash, expiryDate, resendDate, nowIso]
  );

  // Dispatch OTP message via WhatsApp provider using secure authentication template
  const { provider, isSandbox } = getWhatsAppProviderForOrg(orgId);

  await provider.sendMessage({
    toPhoneE164: normalized.e164,
    type: 'template',
    template: {
      name: 'secure_login_otp_v1',
      language: 'en_US',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: otpCode },
            { type: 'text', text: String(ttlMinutes) },
          ],
        },
      ],
    },
  });

  // Note: In live production, raw OTP is NEVER returned.
  // In sandbox testing mode, we provide a test hint so developers can easily test the verification UI.
  res.json({
    success: true,
    otpId,
    phoneE164: normalized.e164,
    expiresInMinutes: ttlMinutes,
    resendAvailableInSeconds: 45,
    isSandbox,
    sandboxHint: isSandbox ? `[Sandbox Test Mode] Verification code: ${otpCode}` : undefined,
  });
});

// --- Secure WhatsApp OTP Verification Engine ---
router.post('/auth/otp/verify', authMiddleware, (req: Request, res: Response) => {
  const { phone, code, otpId } = req.body;
  const orgId = req.auth!.orgId;

  if (!code || (!phone && !otpId)) {
    res.status(400).json({ error: 'Code and phone/otpId required' });
    return;
  }

  const normalized = phone ? normalizePhone(phone) : null;
  const now = Date.now();

  let otpRecord = null;
  if (otpId) {
    otpRecord = db.queryOne<any>('SELECT * FROM otp_verifications WHERE id = ? AND organization_id = ?', [
      otpId,
      orgId,
    ]);
  } else if (normalized) {
    otpRecord = db.queryOne<any>(
      "SELECT * FROM otp_verifications WHERE organization_id = ? AND phone_e164 = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [orgId, normalized.e164]
    );
  }

  if (!otpRecord) {
    res.status(404).json({ error: 'No active OTP verification session found' });
    return;
  }

  if (otpRecord.status !== 'pending') {
    res.status(400).json({ error: `OTP session is already ${otpRecord.status}` });
    return;
  }

  if (new Date(otpRecord.expires_at).getTime() < now) {
    db.execute("UPDATE otp_verifications SET status = 'expired' WHERE id = ?", [otpRecord.id]);
    res.status(400).json({ error: 'OTP code has expired. Please request a new one.' });
    return;
  }

  // Hash submitted code and compare
  const submittedHash = crypto.createHash('sha256').update(String(code).trim()).digest('hex');

  if (submittedHash !== otpRecord.otp_hash) {
    const remaining = otpRecord.attempts_remaining - 1;
    if (remaining <= 0) {
      db.execute("UPDATE otp_verifications SET status = 'locked', attempts_remaining = 0 WHERE id = ?", [
        otpRecord.id,
      ]);
      res.status(403).json({ error: 'Maximum verification attempts exceeded. Session locked.' });
    } else {
      db.execute('UPDATE otp_verifications SET attempts_remaining = ? WHERE id = ?', [remaining, otpRecord.id]);
      res.status(400).json({
        error: 'Invalid verification code',
        attemptsRemaining: remaining,
      });
    }
    return;
  }

  // Single-use: Mark verified immediately to prevent replay
  db.execute("UPDATE otp_verifications SET status = 'verified', attempts_remaining = 0 WHERE id = ?", [
    otpRecord.id,
  ]);

  res.json({
    verified: true,
    phoneE164: otpRecord.phone_e164,
    verifiedAt: new Date().toISOString(),
    message: 'OTP verification succeeded',
  });
});

export default router;
