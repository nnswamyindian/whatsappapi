import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePlatformAdmin } from '../middleware/rbac.js';
import { EmailService } from '../services/email.js';
import { NotificationService } from '../services/notifications.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.use(authMiddleware);
router.use(requirePlatformAdmin);
// ==============================================================================
// 1. Platform Overview & System Telemetry
// ==============================================================================
router.get('/overview', (req, res) => {
    const orgCount = db.queryOne(`SELECT COUNT(*) as total,
            SUM(CASE WHEN approval_status = 'APPROVED' AND status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN approval_status = 'PENDING_APPROVAL' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN approval_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
     FROM organizations`);
    const userCount = db.queryOne('SELECT COUNT(*) as count FROM users');
    const msgCount = db.queryOne(`SELECT COUNT(*) as total,
            SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outbound,
            SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
     FROM messages`);
    const activeQueues = db.queryOne(`SELECT COUNT(*) as count FROM campaigns WHERE status = 'processing'`);
    const pendingApps = db.queryOne(`SELECT COUNT(*) as count FROM customer_applications WHERE status = 'PENDING_APPROVAL'`);
    res.json({
        tenants: {
            total: orgCount?.total || 0,
            active: orgCount?.active || 0,
            pending: orgCount?.pending || 0,
            rejected: orgCount?.rejected || 0,
        },
        pendingApplications: pendingApps?.count || 0,
        users: userCount?.count || 0,
        messaging: {
            total: msgCount?.total || 0,
            outbound: msgCount?.outbound || 0,
            delivered: msgCount?.delivered || 0,
            failed: msgCount?.failed || 0,
        },
        systemHealth: {
            database: 'healthy (WAL mode)',
            queueProcessor: 'operational',
            emailEngine: 'active',
            activeCampaignWorkers: activeQueues?.count || 0,
            uptimeSeconds: Math.floor(process.uptime()),
        },
    });
});
// ==============================================================================
// 2. Customer Applications Review Queue
// ==============================================================================
router.get('/applications', (req, res) => {
    const { status, search } = req.query;
    let query = `
    SELECT a.*, u.email_verified, u.full_name as user_full_name, o.name as org_name
    FROM customer_applications a
    JOIN users u ON u.id = a.user_id
    JOIN organizations o ON o.id = a.organization_id
    WHERE 1=1
  `;
    const params = [];
    if (status && status !== 'all') {
        query += ` AND a.status = ?`;
        params.push(status);
    }
    if (search) {
        query += ` AND (a.business_name LIKE ? OR a.email LIKE ? OR a.phone_e164 LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term);
    }
    query += ` ORDER BY a.created_at DESC`;
    const applications = db.query(query, params);
    res.json(applications);
});
router.get('/applications/:id', (req, res) => {
    const application = db.queryOne(`SELECT a.*, u.email_verified, u.full_name as user_full_name, o.name as org_name, o.slug as org_slug
     FROM customer_applications a
     JOIN users u ON u.id = a.user_id
     JOIN organizations o ON o.id = a.organization_id
     WHERE a.id = ?`, [req.params.id]);
    if (!application) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }
    res.json(application);
});
// Approve Customer Application
router.post('/applications/:id/approve', async (req, res) => {
    const app = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [req.params.id]);
    if (!app) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }
    if (app.status === 'APPROVED') {
        res.status(400).json({ error: 'Application is already approved' });
        return;
    }
    const now = new Date().toISOString();
    const reviewerEmail = req.auth.email;
    db.transaction(() => {
        // 1. Update application record
        db.execute(`UPDATE customer_applications
       SET status = 'APPROVED',
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [reviewerEmail, now, now, app.id]);
        // 2. Update organization status
        db.execute(`UPDATE organizations
       SET approval_status = 'APPROVED',
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [reviewerEmail, now, now, app.organization_id]);
        // 3. Mark step 2 (account_review) in onboarding checklist
        db.execute(`UPDATE onboarding_checklists
       SET is_completed = 1, completed_at = ?, completed_by = ?
       WHERE organization_id = ? AND step_key = 'account_review'`, [now, reviewerEmail, app.organization_id]);
        // 4. Create Audit Log
        db.execute(`INSERT INTO audit_logs (id, organization_id, user_id, user_email, action, resource_type, resource_id, details_json, created_at)
       VALUES (?, ?, ?, ?, 'APPLICATION_APPROVED', 'customer_application', ?, ?, ?)`, [
            uuidv4(),
            app.organization_id,
            req.auth.userId,
            reviewerEmail,
            app.id,
            JSON.stringify({ businessName: app.business_name, email: app.email }),
            now,
        ]);
    });
    // 5. Send approval email to customer
    const onboardingUrl = `${process.env.APP_URL || 'http://localhost:5000'}/onboarding`;
    await EmailService.send({
        recipient: app.email,
        templateSlug: 'application_approved',
        variables: {
            fullName: app.owner_name,
            businessName: app.business_name,
            onboardingUrl,
        },
    });
    // 6. In-App Notification
    NotificationService.notify({
        organizationId: app.organization_id,
        userId: app.user_id,
        type: 'approval',
        title: 'Workspace Approved! 🎉',
        message: 'Your GreenWave application is approved! Start guided onboarding to connect your WhatsApp Business Account.',
        link: '/onboarding',
    });
    res.json({ success: true, message: `Application for ${app.business_name} approved successfully.` });
});
// Reject Customer Application
router.post('/applications/:id/reject', async (req, res) => {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
        res.status(400).json({ error: 'Rejection reason is required' });
        return;
    }
    const app = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [req.params.id]);
    if (!app) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }
    const now = new Date().toISOString();
    const reviewerEmail = req.auth.email;
    db.transaction(() => {
        db.execute(`UPDATE customer_applications
       SET status = 'REJECTED',
           rejection_reason = ?,
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [reason.trim(), reviewerEmail, now, now, app.id]);
        db.execute(`UPDATE organizations
       SET approval_status = 'REJECTED',
           rejection_reason = ?,
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [reason.trim(), reviewerEmail, now, now, app.organization_id]);
        db.execute(`INSERT INTO audit_logs (id, organization_id, user_id, user_email, action, resource_type, resource_id, details_json, created_at)
       VALUES (?, ?, ?, ?, 'APPLICATION_REJECTED', 'customer_application', ?, ?, ?)`, [
            uuidv4(),
            app.organization_id,
            req.auth.userId,
            reviewerEmail,
            app.id,
            JSON.stringify({ reason: reason.trim() }),
            now,
        ]);
    });
    await EmailService.send({
        recipient: app.email,
        templateSlug: 'application_rejected',
        variables: {
            fullName: app.owner_name,
            businessName: app.business_name,
            rejectionReason: reason.trim(),
            supportEmail: 'support@greenwave.io',
        },
    });
    NotificationService.notify({
        organizationId: app.organization_id,
        userId: app.user_id,
        type: 'approval',
        title: 'Application Status Update',
        message: `Your application has not been approved: ${reason.trim()}`,
        link: '/application-status',
    });
    res.json({ success: true, message: `Application rejected.` });
});
// Request Additional Information
router.post('/applications/:id/request-info', async (req, res) => {
    const { requestDetails } = req.body;
    if (!requestDetails || !requestDetails.trim()) {
        res.status(400).json({ error: 'Information request details required' });
        return;
    }
    const app = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [req.params.id]);
    if (!app) {
        res.status(404).json({ error: 'Application not found' });
        return;
    }
    const now = new Date().toISOString();
    const reviewerEmail = req.auth.email;
    db.transaction(() => {
        db.execute(`UPDATE customer_applications
       SET status = 'ACTION_REQUIRED',
           info_requested_details = ?,
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [requestDetails.trim(), reviewerEmail, now, now, app.id]);
        db.execute(`UPDATE organizations
       SET approval_status = 'ACTION_REQUIRED',
           info_requested_details = ?,
           reviewed_by = ?,
           reviewed_at = ?,
           updated_at = ?
       WHERE id = ?`, [requestDetails.trim(), reviewerEmail, now, now, app.organization_id]);
    });
    const actionUrl = `${process.env.APP_URL || 'http://localhost:5000'}/application-status`;
    await EmailService.send({
        recipient: app.email,
        templateSlug: 'additional_info_requested',
        variables: {
            fullName: app.owner_name,
            businessName: app.business_name,
            requestDetails: requestDetails.trim(),
            actionUrl,
        },
    });
    NotificationService.notify({
        organizationId: app.organization_id,
        userId: app.user_id,
        type: 'approval',
        title: 'Action Required on Application',
        message: `Additional information requested: ${requestDetails.trim()}`,
        link: '/application-status',
    });
    res.json({ success: true, message: 'Requested additional information from the customer.' });
});
// Add Internal Admin Notes
router.post('/applications/:id/notes', (req, res) => {
    const { notes } = req.body;
    const now = new Date().toISOString();
    db.execute(`UPDATE customer_applications SET admin_notes = ?, updated_at = ? WHERE id = ?`, [notes || '', now, req.params.id]);
    res.json({ success: true, message: 'Internal admin notes updated.' });
});
// ==============================================================================
// 3. Customer & Tenant Management
// ==============================================================================
router.get('/tenants', (req, res) => {
    const tenants = db.query(`SELECT o.*,
            (SELECT COUNT(*) FROM memberships m WHERE m.organization_id = o.id) as member_count,
            (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) as contact_count,
            (SELECT COUNT(*) FROM messages msg WHERE msg.organization_id = o.id) as message_count,
            w.status as whatsapp_status, w.mode as whatsapp_mode, w.display_phone_number, w.verified_name
     FROM organizations o
     LEFT JOIN whatsapp_connections w ON w.organization_id = o.id
     ORDER BY o.created_at DESC`);
    res.json(tenants);
});
router.patch('/tenants/:id', (req, res) => {
    const { status, planTier, contactLimit, teamLimit, campaignLimit } = req.body;
    const now = new Date().toISOString();
    db.execute(`UPDATE organizations
     SET status = COALESCE(?, status),
         plan_tier = COALESCE(?, plan_tier),
         contact_limit = COALESCE(?, contact_limit),
         team_limit = COALESCE(?, team_limit),
         campaign_limit = COALESCE(?, campaign_limit),
         updated_at = ?
     WHERE id = ?`, [status, planTier, contactLimit, teamLimit, campaignLimit, now, req.params.id]);
    res.json({ success: true, message: 'Tenant updated successfully.' });
});
// ==============================================================================
// 4. Centralized Email Templates & Telemetry
// ==============================================================================
router.get('/email-templates', (req, res) => {
    const templates = db.query('SELECT * FROM email_templates ORDER BY category, name');
    res.json(templates);
});
router.put('/email-templates/:id', (req, res) => {
    const { subject, htmlContent, textContent } = req.body;
    const now = new Date().toISOString();
    db.execute(`UPDATE email_templates
     SET subject = ?, html_content = ?, text_content = ?, updated_at = ?
     WHERE id = ?`, [subject, htmlContent, textContent, now, req.params.id]);
    res.json({ success: true, message: 'Template updated successfully.' });
});
router.post('/email-templates/:slug/preview', (req, res) => {
    try {
        const preview = EmailService.preview(String(req.params.slug), req.body.variables || {});
        res.json(preview);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
});
router.post('/email-templates/:slug/test-send', async (req, res) => {
    const { recipientEmail, variables = {} } = req.body;
    const target = recipientEmail || req.auth.email;
    const result = await EmailService.send({
        recipient: target,
        templateSlug: String(req.params.slug),
        variables,
        forceResend: true,
    });
    res.json(result);
});
router.get('/email-logs', (req, res) => {
    const logs = db.query('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 100');
    res.json(logs);
});
// ==============================================================================
// 5. Subscription Plans
// ==============================================================================
router.get('/plans', (req, res) => {
    const plans = db.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
    res.json(plans);
});
router.post('/plans', (req, res) => {
    const { name, slug, description, monthlyPriceUsd, yearlyPriceUsd, contactLimit, teamMemberLimit, campaignLimit, wabaLimit, features, } = req.body;
    const id = `plan_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    db.execute(`INSERT INTO subscription_plans 
     (id, name, slug, description, monthly_price_usd, yearly_price_usd, contact_limit, team_member_limit, campaign_limit, waba_limit, features_json, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 99, ?, ?)`, [
        id,
        name,
        slug,
        description || '',
        monthlyPriceUsd || 0,
        yearlyPriceUsd || 0,
        contactLimit || 1000,
        teamMemberLimit || 3,
        campaignLimit || 50,
        wabaLimit || 1,
        JSON.stringify(features || []),
        now,
        now,
    ]);
    res.status(201).json({ success: true, id });
});
router.put('/plans/:id', (req, res) => {
    const { name, description, monthlyPriceUsd, yearlyPriceUsd, contactLimit, teamMemberLimit, campaignLimit, wabaLimit, features, isActive, } = req.body;
    const now = new Date().toISOString();
    db.execute(`UPDATE subscription_plans
     SET name = COALESCE(?, name),
         description = COALESCE(?, description),
         monthly_price_usd = COALESCE(?, monthly_price_usd),
         yearly_price_usd = COALESCE(?, yearly_price_usd),
         contact_limit = COALESCE(?, contact_limit),
         team_member_limit = COALESCE(?, team_member_limit),
         campaign_limit = COALESCE(?, campaign_limit),
         waba_limit = COALESCE(?, waba_limit),
         features_json = COALESCE(?, features_json),
         is_active = COALESCE(?, is_active),
         updated_at = ?
     WHERE id = ?`, [
        name,
        description,
        monthlyPriceUsd,
        yearlyPriceUsd,
        contactLimit,
        teamMemberLimit,
        campaignLimit,
        wabaLimit,
        features ? JSON.stringify(features) : null,
        isActive !== undefined ? (isActive ? 1 : 0) : null,
        now,
        req.params.id,
    ]);
    res.json({ success: true, message: 'Plan updated.' });
});
// ==============================================================================
// 6. Security Audit Logs
// ==============================================================================
router.get('/audit-logs', (req, res) => {
    const logs = db.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 150');
    res.json(logs);
});
export default router;
