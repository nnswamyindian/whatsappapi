import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
// Register new user and organization
router.post('/register', (req, res) => {
    const { email, password, fullName, organizationName } = req.body;
    if (!email || !password || !fullName || !organizationName) {
        res.status(400).json({ error: 'Missing required registration fields' });
        return;
    }
    const existing = db.queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
    }
    const now = new Date().toISOString();
    const userId = uuidv4();
    const orgId = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 10);
    const orgSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 32);
    try {
        db.transaction(() => {
            // 1. Create User
            db.execute(`INSERT INTO users (id, email, password_hash, full_name, is_platform_admin, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, ?)`, [userId, email.toLowerCase().trim(), passwordHash, fullName.trim(), now, now]);
            // 2. Create Organization
            db.execute(`INSERT INTO organizations (id, name, slug, timezone, status, plan_tier, wallet_balance, low_balance_threshold, created_at, updated_at)
         VALUES (?, ?, ?, 'UTC', 'active', 'starter', 15.00, 5.00, ?, ?)`, [orgId, organizationName.trim(), `${orgSlug}-${Date.now().toString(36)}`, now, now]);
            // 3. Create Owner Membership
            db.execute(`INSERT INTO memberships (id, organization_id, user_id, role, created_at)
         VALUES (?, ?, ?, 'owner', ?)`, [uuidv4(), orgId, userId, now]);
            // 4. Initial Credit Ledger
            db.execute(`INSERT INTO wallet_ledger (id, organization_id, amount, balance_after, transaction_type, description, created_at)
         VALUES (?, ?, 15.00, 15.00, 'topup', 'Welcome trial credit', ?)`, [uuidv4(), orgId, now]);
            // 5. Default Sandbox WhatsApp connection
            db.execute(`INSERT INTO whatsapp_connections (id, organization_id, provider, mode, quality_rating, messaging_limit_tier, status, created_at, updated_at)
         VALUES (?, ?, 'meta_cloud', 'sandbox', 'GREEN', 'TIER_1K', 'connected', ?, ?)`, [uuidv4(), orgId, now, now]);
        });
        const token = jwt.sign({ userId, email: email.toLowerCase().trim(), isPlatformAdmin: false }, ENV.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: userId, email, fullName, isPlatformAdmin: false },
            organization: { id: orgId, name: organizationName, role: 'owner' },
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to complete registration', details: err.message });
    }
});
// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password required' });
        return;
    }
    const user = db.queryOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
    }
    // Fetch user organizations
    const memberships = db.query(`SELECT m.role, o.id, o.name, o.slug, o.plan_tier, o.wallet_balance
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ? AND o.status = 'active'`, [user.id]);
    const token = jwt.sign({ userId: user.id, email: user.email, isPlatformAdmin: !!user.is_platform_admin }, ENV.JWT_SECRET, { expiresIn: '7d' });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            isPlatformAdmin: !!user.is_platform_admin,
        },
        organizations: memberships,
        activeOrganization: memberships[0] || null,
    });
});
// Get Current User Profile & Memberships
router.get('/me', authMiddleware, (req, res) => {
    const user = db.queryOne('SELECT id, email, full_name, is_platform_admin, created_at FROM users WHERE id = ?', [
        req.auth.userId,
    ]);
    if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
    }
    const memberships = db.query(`SELECT m.role, o.id, o.name, o.slug, o.timezone, o.plan_tier, o.wallet_balance
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ? AND o.status = 'active'`, [user.id]);
    const activeOrg = memberships.find((m) => m.id === req.auth.orgId) || memberships[0] || null;
    res.json({
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            isPlatformAdmin: !!user.is_platform_admin,
        },
        organizations: memberships,
        activeOrganization: activeOrg,
    });
});
export default router;
