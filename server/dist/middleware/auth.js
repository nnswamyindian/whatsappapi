import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { db } from '../db/index.js';
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    // 1. Check for API Key Authentication
    if (apiKeyHeader || (authHeader && authHeader.startsWith('Bearer gw_'))) {
        const rawApiKey = apiKeyHeader || authHeader.replace('Bearer ', '').trim();
        const keyPrefix = rawApiKey.substring(0, 12);
        // Look up key by prefix
        const keys = db.query("SELECT * FROM api_keys WHERE status = 'active' AND key_prefix LIKE ?", [`${keyPrefix}%`]);
        let matchedKey = null;
        for (const k of keys) {
            if (bcrypt.compareSync(rawApiKey, k.key_hash)) {
                matchedKey = k;
                break;
            }
        }
        if (!matchedKey) {
            res.status(401).json({ error: 'Unauthorized', message: 'Invalid or revoked API key' });
            return;
        }
        // Update last used timestamp
        db.execute('UPDATE api_keys SET last_used_at = ? WHERE id = ?', [new Date().toISOString(), matchedKey.id]);
        req.auth = {
            userId: 'system_api_key',
            email: 'api@system.internal',
            orgId: matchedKey.organization_id,
            role: 'admin',
            isPlatformAdmin: false,
            isApiKey: true,
        };
        return next();
    }
    // 2. Check for Standard JWT Bearer Token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized', message: 'Missing authentication token' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        // Determine target organization:
        // If requested via X-Organization-Id header, verify user is a member
        let orgId = req.headers['x-organization-id'];
        let membership = null;
        if (orgId) {
            membership = db.queryOne('SELECT organization_id, role FROM memberships WHERE user_id = ? AND organization_id = ?', [decoded.userId, orgId]);
        }
        if (!membership) {
            // Pick first active membership
            membership = db.queryOne('SELECT organization_id, role FROM memberships WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', [decoded.userId]);
        }
        if (!membership && !decoded.isPlatformAdmin) {
            res.status(403).json({ error: 'Forbidden', message: 'No active organization membership found' });
            return;
        }
        req.auth = {
            userId: decoded.userId,
            email: decoded.email,
            orgId: membership ? membership.organization_id : (orgId || ''),
            role: membership ? membership.role : (decoded.isPlatformAdmin ? 'owner' : 'support_agent'),
            isPlatformAdmin: !!decoded.isPlatformAdmin,
        };
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session token' });
    }
}
