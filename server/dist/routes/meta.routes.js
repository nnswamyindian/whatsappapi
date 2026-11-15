import { Router } from 'express';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
const router = Router();
/**
 * Validates and decodes Meta signed_request using HMAC-SHA256 and constant-time comparison
 */
function parseSignedRequest(signedRequest, appSecret) {
    if (!signedRequest || !signedRequest.includes('.')) {
        throw new Error('Invalid signed_request format');
    }
    const [encodedSig, payload] = signedRequest.split('.', 2);
    // Normalize base64url to base64
    const normalizedSig = encodedSig.replace(/-/g, '+').replace(/_/g, '/');
    const sigBuffer = Buffer.from(normalizedSig, 'base64');
    const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
    if (sigBuffer.length !== expectedSig.length || !crypto.timingSafeEqual(sigBuffer, expectedSig)) {
        throw new Error('Signature verification failed for signed_request');
    }
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = Buffer.from(normalizedPayload, 'base64').toString('utf8');
    return JSON.parse(payloadJson);
}
// 1. Meta Official Data Deletion Callback (POST)
router.post('/data-deletion', (req, res) => {
    const signedRequest = req.body.signed_request;
    if (!signedRequest) {
        res.status(400).json({ error: 'Missing signed_request parameter' });
        return;
    }
    if (!ENV.META_APP_SECRET) {
        console.warn('[Meta Data Deletion] META_APP_SECRET is not configured.');
        res.status(500).json({ error: 'Meta App Secret not configured on platform' });
        return;
    }
    try {
        const data = parseSignedRequest(signedRequest, ENV.META_APP_SECRET);
        const metaUserId = data.user_id;
        const confirmationCode = `DEL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const requestId = uuidv4();
        const now = new Date().toISOString();
        // Persist deletion request
        db.execute(`INSERT INTO data_deletion_requests 
       (id, confirmation_code, request_type, meta_user_id, requester_email, status, request_details, created_at)
       VALUES (?, ?, 'meta_callback', ?, 'meta-deletion@system.internal', 'PROCESSING', ?, ?)`, [
            requestId,
            confirmationCode,
            metaUserId || null,
            `Automated Meta Platform Data Deletion Callback for Meta User ID: ${metaUserId || 'unknown'}`,
            now,
        ]);
        // Audit log
        db.execute(`INSERT INTO audit_logs (id, action, resource_type, resource_id, details_json, created_at)
       VALUES (?, 'META_DATA_DELETION_RECEIVED', 'data_deletion', ?, ?, ?)`, [uuidv4(), confirmationCode, JSON.stringify({ metaUserId, confirmationCode }), now]);
        // If matching Meta user ID exists in users or whatsapp_connections, disconnect
        if (metaUserId) {
            db.execute(`UPDATE whatsapp_connections 
         SET status = 'disconnected', access_token = NULL, updated_at = ? 
         WHERE access_token LIKE ?`, [now, `%${metaUserId}%`]);
        }
        const host = req.get('host') || 'app.metagreenwave.com';
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const statusUrl = `${protocol}://${host}/data-deletion/status?code=${confirmationCode}`;
        // Meta official response contract
        res.json({
            url: statusUrl,
            confirmation_code: confirmationCode,
        });
    }
    catch (err) {
        console.error('[Meta Data Deletion Callback Error]:', err.message);
        res.status(400).json({ error: 'Invalid signed_request', message: err.message });
    }
});
// 2. Public User Portal Data Deletion Request (POST)
router.post('/data-deletion/request', (req, res) => {
    const requesterEmail = (req.body.requesterEmail || req.body.email || '').toLowerCase().trim();
    const requesterName = req.body.requesterName || req.body.name || 'Website Requester';
    const organizationName = req.body.organizationName || req.body.company || null;
    const accountIdentifier = req.body.accountIdentifier || req.body.phone || null;
    const requestDetails = req.body.requestDetails || req.body.reason || 'User requested complete account & personal data deletion.';
    if (!requesterEmail || !requesterEmail.includes('@')) {
        res.status(400).json({ error: 'Valid email address is required' });
        return;
    }
    const confirmationCode = `DEL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const requestId = uuidv4();
    const now = new Date().toISOString();
    // Find matching user or organization if exists
    const existingUser = db.queryOne('SELECT id FROM users WHERE email = ?', [requesterEmail]);
    db.execute(`INSERT INTO data_deletion_requests
     (id, confirmation_code, request_type, requester_name, requester_email, organization_name, account_identifier, user_id, request_details, status, created_at)
     VALUES (?, ?, 'user_portal', ?, ?, ?, ?, ?, ?, 'PENDING', ?)`, [
        requestId,
        confirmationCode,
        requesterName,
        requesterEmail,
        organizationName,
        accountIdentifier,
        existingUser?.id || null,
        requestDetails,
        now,
    ]);
    // Record audit log
    db.execute(`INSERT INTO audit_logs (id, action, resource_type, resource_id, details_json, created_at)
     VALUES (?, 'DATA_DELETION_REQUESTED', 'data_deletion', ?, ?, ?)`, [uuidv4(), confirmationCode, JSON.stringify({ requesterEmail, confirmationCode }), now]);
    res.json({
        success: true,
        confirmationCode,
        confirmation_code: confirmationCode,
        status: 'PENDING',
        url: `${req.protocol}://${req.get('host')}/data-deletion`,
        message: 'Your data deletion request has been recorded. Our Data Protection Officer will review and process your request within 30 days as mandated by applicable privacy regulations.',
    });
});
// 3. Public Data Deletion Status Lookup (GET)
router.get('/data-deletion/status/:code', (req, res) => {
    const code = String(req.params.code || '').trim();
    const record = db.queryOne(`SELECT confirmation_code, request_type, status, created_at, completed_at
     FROM data_deletion_requests
     WHERE confirmation_code = ?`, [code]);
    if (!record) {
        res.status(404).json({
            error: 'Not Found',
            message: 'No data deletion request found for this confirmation code.',
        });
        return;
    }
    res.json({
        confirmationCode: record.confirmation_code,
        confirmation_code: record.confirmation_code,
        requestType: record.request_type,
        status: record.status,
        createdAt: record.created_at,
        completedAt: record.completed_at || null,
    });
});
// 4. Meta App Deauthorization Callback (POST)
router.post('/deauthorize', (req, res) => {
    const signedRequest = req.body.signed_request;
    if (!signedRequest || !ENV.META_APP_SECRET) {
        res.status(400).json({ error: 'Invalid deauthorization request' });
        return;
    }
    try {
        const data = parseSignedRequest(signedRequest, ENV.META_APP_SECRET);
        const metaUserId = data.user_id;
        const now = new Date().toISOString();
        console.log(`[Meta Deauthorization] Received deauthorization notice for Meta User: ${metaUserId}`);
        db.execute(`INSERT INTO audit_logs (id, action, resource_type, resource_id, details_json, created_at)
       VALUES (?, 'META_APP_DEAUTHORIZED', 'meta_account', ?, ?, ?)`, [uuidv4(), metaUserId || 'unknown', JSON.stringify(data), now]);
        res.json({ success: true, message: 'Deauthorization recorded' });
    }
    catch (err) {
        console.error('[Meta Deauthorization Error]:', err.message);
        res.status(400).json({ error: 'Failed to process deauthorization' });
    }
});
export default router;
