import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// Get WhatsApp Connection Status
router.get('/status', (req: Request, res: Response) => {
  const conn = db.queryOne<any>(
    `SELECT id, provider, mode, waba_id, phone_number_id, display_phone_number,
            verified_name, quality_rating, messaging_limit_tier, status, last_sync_at
     FROM whatsapp_connections
     WHERE organization_id = ?`,
    [req.auth!.orgId]
  );

  res.json(conn || { status: 'disconnected', mode: 'sandbox' });
});

// Configure WhatsApp Connection (Live Meta Cloud API or Sandbox)
router.post('/configure', requireRole(['admin']), (req: Request, res: Response) => {
  const { mode, wabaId, phoneNumberId, accessToken, webhookVerifyToken, appSecret, displayPhoneNumber, verifiedName } = req.body;
  const now = new Date().toISOString();
  const orgId = req.auth!.orgId;

  if (mode === 'live') {
    if (!wabaId || !phoneNumberId || !accessToken) {
      res.status(400).json({
        error: 'Missing live credentials',
        message: 'WABA ID, Phone Number ID, and Meta System User Access Token are required for Live mode',
      });
      return;
    }
  }

  const existing = db.queryOne('SELECT id FROM whatsapp_connections WHERE organization_id = ?', [orgId]);

  if (existing) {
    db.execute(
      `UPDATE whatsapp_connections
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
       WHERE organization_id = ?`,
      [mode || 'sandbox', wabaId, phoneNumberId, accessToken, webhookVerifyToken, appSecret, displayPhoneNumber, verifiedName, now, orgId]
    );
  } else {
    db.execute(
      `INSERT INTO whatsapp_connections
       (id, organization_id, provider, mode, waba_id, phone_number_id, access_token, webhook_verify_token, app_secret, display_phone_number, verified_name, status, created_at, updated_at)
       VALUES (?, ?, 'meta_cloud', ?, ?, ?, ?, ?, ?, ?, ?, 'connected', ?, ?)`,
      [uuidv4(), orgId, mode || 'sandbox', wabaId, phoneNumberId, accessToken, webhookVerifyToken, appSecret, displayPhoneNumber, verifiedName, now, now]
    );
  }

  res.json({ success: true, message: `WhatsApp connection updated to ${mode || 'sandbox'} mode` });
});

// Test Connection
router.post('/test-connection', async (req: Request, res: Response) => {
  try {
    const { provider, isSandbox } = getWhatsAppProviderForOrg(req.auth!.orgId);
    const result = await provider.testConnection();

    if (result.ok) {
      // Update quality rating if available
      if (result.details?.qualityRating) {
        db.execute(
          "UPDATE whatsapp_connections SET quality_rating = ?, status = 'connected', last_sync_at = ? WHERE organization_id = ?",
          [result.details.qualityRating, new Date().toISOString(), req.auth!.orgId]
        );
      }
    }

    res.json({
      ...result,
      isSandbox,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// Synchronize Templates from Provider
router.post('/sync-templates', requireRole(['campaign_manager']), async (req: Request, res: Response) => {
  try {
    const { provider } = getWhatsAppProviderForOrg(req.auth!.orgId);
    const remoteTemplates = await provider.fetchTemplates();
    const orgId = req.auth!.orgId;
    const now = new Date().toISOString();

    let createdCount = 0;
    let updatedCount = 0;

    for (const t of remoteTemplates) {
      const existing = db.queryOne<{ id: string }>(
        'SELECT id FROM templates WHERE organization_id = ? AND name = ? AND language = ?',
        [orgId, t.name, t.language || 'en_US']
      );

      if (existing) {
        db.execute(
          `UPDATE templates
           SET status = ?,
               body_text = ?,
               header_type = ?,
               header_content = ?,
               footer_text = ?,
               rejection_reason = ?,
               updated_at = ?
           WHERE id = ?`,
          [t.status, t.bodyText, t.headerType, t.headerContent || null, t.footerText || null, t.rejectionReason || null, now, existing.id]
        );
        updatedCount++;
      } else {
        db.execute(
          `INSERT INTO templates
           (id, organization_id, name, category, language, header_type, header_content, body_text, footer_text, status, rejection_reason, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), orgId, t.name, t.category, t.language || 'en_US', t.headerType, t.headerContent || null, t.bodyText, t.footerText || null, t.status, t.rejectionReason || null, now, now]
        );
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
  } catch (err: any) {
    res.status(500).json({ error: 'Template sync failed', message: err.message });
  }
});

export default router;
