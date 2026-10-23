import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.use(authMiddleware);
// List Organization Members & Roles
router.get('/members', (req, res) => {
    const members = db.query(`SELECT m.id as membership_id, m.role, m.created_at as joined_at,
            u.id as user_id, u.email, u.full_name, u.avatar_url, u.status
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.organization_id = ?
     ORDER BY m.created_at ASC`, [req.auth.orgId]);
    res.json(members);
});
// Invite New Member
router.post('/invite', requireRole(['admin']), (req, res) => {
    const { email, role = 'support_agent' } = req.body;
    if (!email) {
        res.status(400).json({ error: 'Email required' });
        return;
    }
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const id = uuidv4();
    const now = new Date().toISOString();
    db.execute(`INSERT INTO invitations (id, organization_id, email, role, token, expires_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`, [id, req.auth.orgId, email.toLowerCase().trim(), role, token, expiresAt, now]);
    res.status(201).json({
        id,
        email,
        role,
        inviteLink: `http://localhost:3000/invite/accept?token=${token}`,
        expiresAt,
    });
});
// Update Member Role
router.patch('/members/:id/role', requireRole(['admin']), (req, res) => {
    const { role } = req.body;
    if (!role) {
        res.status(400).json({ error: 'Role is required' });
        return;
    }
    // Prevent modifying own owner role
    const target = db.queryOne('SELECT user_id, role FROM memberships WHERE id = ? AND organization_id = ?', [
        req.params.id,
        req.auth.orgId,
    ]);
    if (!target) {
        res.status(404).json({ error: 'Membership not found' });
        return;
    }
    if (target.user_id === req.auth.userId && target.role === 'owner') {
        res.status(403).json({ error: 'Cannot downgrade your own owner role' });
        return;
    }
    db.execute('UPDATE memberships SET role = ? WHERE id = ? AND organization_id = ?', [
        role,
        req.params.id,
        req.auth.orgId,
    ]);
    res.json({ success: true, role });
});
// Remove Member
router.delete('/members/:id', requireRole(['admin']), (req, res) => {
    const target = db.queryOne('SELECT user_id, role FROM memberships WHERE id = ? AND organization_id = ?', [
        req.params.id,
        req.auth.orgId,
    ]);
    if (!target) {
        res.status(404).json({ error: 'Membership not found' });
        return;
    }
    if (target.role === 'owner') {
        res.status(403).json({ error: 'Cannot remove organization owner' });
        return;
    }
    db.execute('DELETE FROM memberships WHERE id = ? AND organization_id = ?', [req.params.id, req.auth.orgId]);
    res.json({ success: true });
});
// Security & Activity Audit Log
router.get('/audit-logs', requireRole(['admin']), (req, res) => {
    const logs = db.query('SELECT * FROM audit_logs WHERE organization_id = ? ORDER BY created_at DESC LIMIT 100', [req.auth.orgId]);
    res.json(logs);
});
export default router;
