import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);

// Get Current Organization Profile & Status
router.get('/current', (req: Request, res: Response) => {
  const org = db.queryOne<any>('SELECT * FROM organizations WHERE id = ?', [req.auth!.orgId]);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const conn = db.queryOne<any>(
    'SELECT mode, provider, status, quality_rating, messaging_limit_tier, display_phone_number, verified_name, last_sync_at FROM whatsapp_connections WHERE organization_id = ?',
    [org.id]
  );

  res.json({
    organization: org,
    whatsappConnection: conn || { status: 'disconnected', mode: 'sandbox' },
    role: req.auth!.role,
  });
});

// Calculate Guided Onboarding Checklist Progress (10 Steps)
router.get('/onboarding-status', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;

  // 1. Workspace configured
  const org = db.queryOne<any>('SELECT name, timezone FROM organizations WHERE id = ?', [orgId]);
  const step1 = !!org;

  // 2. WhatsApp connection verified
  const conn = db.queryOne<any>(
    'SELECT status, mode FROM whatsapp_connections WHERE organization_id = ?',
    [orgId]
  );
  const step2 = conn && conn.status === 'connected';

  // 3. Synchronize available templates
  const templateCount = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM templates WHERE organization_id = ?',
    [orgId]
  )?.count || 0;
  const step3 = templateCount > 0;

  // 4. Import contacts
  const contactCount = db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM contacts WHERE organization_id = ? AND status = 'active'",
    [orgId]
  )?.count || 0;
  const step4 = contactCount > 0;

  // 5. Consent and audience verified
  const consentCount = db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM consent_ledger WHERE organization_id = ? AND status = 'opted_in'",
    [orgId]
  )?.count || 0;
  const step5 = consentCount > 0;

  // 6. Template approved
  const approvedTemplateCount = db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM templates WHERE organization_id = ? AND status = 'APPROVED'",
    [orgId]
  )?.count || 0;
  const step6 = approvedTemplateCount > 0;

  // 7. Test message sent
  const testMessageSent = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM messages WHERE organization_id = ?',
    [orgId]
  )?.count || 0;
  const step7 = testMessageSent > 0;

  // 8. Campaign created
  const campaignCreated = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM campaigns WHERE organization_id = ?',
    [orgId]
  )?.count || 0;
  const step8 = campaignCreated > 0;

  // 9. Campaign launched
  const campaignLaunched = db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM campaigns WHERE organization_id = ? AND status IN ('completed', 'processing')",
    [orgId]
  )?.count || 0;
  const step9 = campaignLaunched > 0;

  // 10. Delivery report viewed
  const step10 = step9;

  const steps = [
    { id: 1, title: 'Create or configure workspace', completed: step1, path: '/settings' },
    { id: 2, title: 'Connect WhatsApp Business API', completed: !!step2, path: '/integrations' },
    { id: 3, title: 'Synchronize available templates', completed: step3, path: '/templates' },
    { id: 4, title: 'Import audience contacts', completed: step4, path: '/contacts' },
    { id: 5, title: 'Verify consent ledger & compliance', completed: step5, path: '/audiences' },
    { id: 6, title: 'Review approved WhatsApp template', completed: step6, path: '/templates' },
    { id: 7, title: 'Send test message to authorized number', completed: step7, path: '/campaigns' },
    { id: 8, title: 'Review transparent campaign cost estimate', completed: step8, path: '/campaigns/new' },
    { id: 9, title: 'Launch eligible campaign', completed: step9, path: '/campaigns' },
    { id: 10, title: 'Inspect real-time delivery report', completed: step10, path: '/reports' },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  res.json({
    steps,
    totalSteps: 10,
    completedCount,
    percentComplete: Math.round((completedCount / 10) * 100),
  });
});

// Update Organization Settings
router.patch('/current', requireRole(['admin']), (req: Request, res: Response) => {
  const { name, timezone, lowBalanceThreshold } = req.body;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE organizations
     SET name = COALESCE(?, name),
         timezone = COALESCE(?, timezone),
         low_balance_threshold = COALESCE(?, low_balance_threshold),
         updated_at = ?
     WHERE id = ?`,
    [name, timezone, lowBalanceThreshold, now, req.auth!.orgId]
  );

  const updated = db.queryOne('SELECT * FROM organizations WHERE id = ?', [req.auth!.orgId]);
  res.json(updated);
});

// Create Additional Organization
router.post('/', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Organization name required' });
    return;
  }

  const orgId = uuidv4();
  const now = new Date().toISOString();
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 32);

  db.transaction(() => {
    db.execute(
      `INSERT INTO organizations (id, name, slug, timezone, status, plan_tier, wallet_balance, low_balance_threshold, created_at, updated_at)
       VALUES (?, ?, ?, 'UTC', 'active', 'starter', 15.00, 5.00, ?, ?)`,
      [orgId, name, `${slug}-${Date.now().toString(36)}`, now, now]
    );

    db.execute(
      `INSERT INTO memberships (id, organization_id, user_id, role, created_at)
       VALUES (?, ?, ?, 'owner', ?)`,
      [uuidv4(), orgId, req.auth!.userId, now]
    );

    db.execute(
      `INSERT INTO whatsapp_connections (id, organization_id, provider, mode, quality_rating, messaging_limit_tier, status, created_at, updated_at)
       VALUES (?, ?, 'meta_cloud', 'sandbox', 'GREEN', 'TIER_1K', 'connected', ?, ?)`,
      [uuidv4(), orgId, now, now]
    );
  });

  res.status(201).json({ id: orgId, name });
});

export default router;
