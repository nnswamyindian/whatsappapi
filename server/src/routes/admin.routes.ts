import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/rbac.js';

const router = Router();
router.use(authMiddleware);
router.use(requirePlatformAdmin);

// Platform Overview Metrics
router.get('/overview', (req: Request, res: Response) => {
  const orgCount = db.queryOne<{ total: number; active: number }>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active FROM organizations`
  );

  const userCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');

  const msgCount = db.queryOne<{ total: number; outbound: number; failed: number }>(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outbound,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
     FROM messages`
  );

  const activeQueues = db.queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM campaigns WHERE status = 'processing'`
  );

  res.json({
    tenants: {
      total: orgCount?.total || 0,
      active: orgCount?.active || 0,
    },
    users: userCount?.count || 0,
    messaging: {
      total: msgCount?.total || 0,
      outbound: msgCount?.outbound || 0,
      failed: msgCount?.failed || 0,
    },
    systemHealth: {
      database: 'healthy',
      queueProcessor: 'running',
      activeCampaignWorkers: activeQueues?.count || 0,
      uptimeSeconds: process.uptime(),
    },
  });
});

// List All Organizations
router.get('/organizations', (req: Request, res: Response) => {
  const orgs = db.query<any>(
    `SELECT o.*,
            (SELECT COUNT(*) FROM memberships m WHERE m.organization_id = o.id) as member_count,
            (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) as contact_count,
            (SELECT COUNT(*) FROM messages msg WHERE msg.organization_id = o.id) as message_count,
            w.status as whatsapp_status, w.mode as whatsapp_mode
     FROM organizations o
     LEFT JOIN whatsapp_connections w ON w.organization_id = o.id
     ORDER BY o.created_at DESC`
  );

  res.json(orgs);
});

// Suspend or Reactivate Organization
router.patch('/organizations/:id/status', (req: Request, res: Response) => {
  const { status } = req.body; // 'active' or 'suspended'
  if (!['active', 'suspended'].includes(status)) {
    res.status(400).json({ error: 'Status must be active or suspended' });
    return;
  }

  db.execute('UPDATE organizations SET status = ?, updated_at = ? WHERE id = ?', [
    status,
    new Date().toISOString(),
    req.params.id,
  ]);

  res.json({ id: req.params.id, status });
});

export default router;
