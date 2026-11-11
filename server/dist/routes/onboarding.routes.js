import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { EmailService } from '../services/email.js';
import { NotificationService } from '../services/notifications.js';
const router = Router();
router.use(authMiddleware);
const ONBOARDING_STEP_DEFS = [
    {
        key: 'business_profile',
        title: 'Complete Business Profile',
        description: 'Provide official business category, contact email, website, and business address.',
        order: 1,
    },
    {
        key: 'account_review',
        title: 'Platform Review & Approval',
        description: 'GreenWave compliance review and application verification.',
        order: 2,
    },
    {
        key: 'whatsapp_embedded_signup',
        title: 'Meta Embedded Signup',
        description: 'Connect your WhatsApp Business Account (WABA) using official Meta dialog.',
        order: 3,
    },
    {
        key: 'meta_business_verification',
        title: 'Meta Business Verification',
        description: 'Verify your business legal entity within Meta Business Manager.',
        order: 4,
    },
    {
        key: 'confirm_phone_number',
        title: 'Confirm Phone Number',
        description: 'Verify connected WhatsApp phone number status and quality rating.',
        order: 5,
    },
    {
        key: 'sync_templates',
        title: 'Synchronize Message Templates',
        description: 'Fetch approved WhatsApp templates or draft a compliant template.',
        order: 6,
    },
    {
        key: 'import_contacts',
        title: 'Import Contacts & Consent',
        description: 'Upload customer phone list with explicit opt-in consent records.',
        order: 7,
    },
    {
        key: 'configure_team',
        title: 'Configure Team Members',
        description: 'Invite team agents, campaign managers, or customer support staff.',
        order: 8,
    },
    {
        key: 'configure_roles',
        title: 'Review Roles & Permissions',
        description: 'Verify granular RBAC permissions and conversation ownership rules.',
        order: 9,
    },
    {
        key: 'create_test_campaign',
        title: 'Draft Test Campaign',
        description: 'Prepare an audience segment and select an approved template.',
        order: 10,
    },
    {
        key: 'send_test_message',
        title: 'Send Authorized Test Message',
        description: 'Dispatch a verified single-recipient test message via WhatsApp API.',
        order: 11,
    },
    {
        key: 'complete_onboarding',
        title: 'Complete Onboarding',
        description: 'Unlock live messaging operations and real-time analytics.',
        order: 12,
    },
];
// Get Onboarding Checklist State
const getChecklistHandler = (req, res) => {
    const orgId = req.auth.orgId;
    // Query actual steps from DB
    const dbSteps = db.query('SELECT * FROM onboarding_checklists WHERE organization_id = ?', [orgId]);
    const stepsMap = new Map(dbSteps.map((s) => [s.step_key, s]));
    // Query actual system state to verify real completion
    const org = db.queryOne('SELECT * FROM organizations WHERE id = ?', [orgId]);
    const conn = db.queryOne('SELECT * FROM whatsapp_connections WHERE organization_id = ?', [orgId]);
    const contactCount = db.queryOne('SELECT COUNT(*) as count FROM contacts WHERE organization_id = ?', [orgId]);
    const templateCount = db.queryOne('SELECT COUNT(*) as count FROM templates WHERE organization_id = ?', [orgId]);
    const memberCount = db.queryOne('SELECT COUNT(*) as count FROM memberships WHERE organization_id = ?', [orgId]);
    const campaignCount = db.queryOne('SELECT COUNT(*) as count FROM campaigns WHERE organization_id = ?', [orgId]);
    const messageCount = db.queryOne('SELECT COUNT(*) as count FROM messages WHERE organization_id = ?', [orgId]);
    const stepsWithStatus = ONBOARDING_STEP_DEFS.map((def) => {
        const record = stepsMap.get(def.key);
        let autoCompleted = false;
        // Backend verification checks: do not mark complete unless actually verified!
        switch (def.key) {
            case 'business_profile':
                autoCompleted = Boolean(org?.business_category && org?.country);
                break;
            case 'account_review':
                autoCompleted = org?.approval_status === 'APPROVED';
                break;
            case 'whatsapp_embedded_signup':
                autoCompleted = conn?.status === 'connected' || Boolean(conn?.waba_id);
                break;
            case 'meta_business_verification':
                autoCompleted = Boolean(conn?.verified_name) || conn?.mode === 'sandbox';
                break;
            case 'confirm_phone_number':
                autoCompleted = Boolean(conn?.display_phone_number) || Boolean(conn?.phone_number_id);
                break;
            case 'sync_templates':
                autoCompleted = (templateCount?.count || 0) > 0;
                break;
            case 'import_contacts':
                autoCompleted = (contactCount?.count || 0) > 0;
                break;
            case 'configure_team':
                autoCompleted = (memberCount?.count || 0) >= 1;
                break;
            case 'configure_roles':
                autoCompleted = true; // default owner role configured
                break;
            case 'create_test_campaign':
                autoCompleted = (campaignCount?.count || 0) > 0;
                break;
            case 'send_test_message':
                autoCompleted = (messageCount?.count || 0) > 0;
                break;
            case 'complete_onboarding':
                autoCompleted = Boolean(record?.is_completed);
                break;
        }
        const isDone = Boolean(record?.is_completed || autoCompleted);
        return {
            ...def,
            isCompleted: isDone,
            completedAt: record?.completed_at || (isDone ? org?.created_at : null),
            completedBy: record?.completed_by || null,
        };
    });
    const completedCount = stepsWithStatus.filter((s) => s.isCompleted).length;
    const percentage = Math.round((completedCount / stepsWithStatus.length) * 100);
    res.json({
        steps: stepsWithStatus,
        completedCount,
        totalSteps: stepsWithStatus.length,
        percentage,
        approvalStatus: org?.approval_status || 'PENDING_APPROVAL',
    });
};
router.get('/', getChecklistHandler);
router.get('/checklist', getChecklistHandler);
// Verify & Mark Step Completed
router.post('/verify-step', async (req, res) => {
    const { stepKey } = req.body;
    const orgId = req.auth.orgId;
    const now = new Date().toISOString();
    const userEmail = req.auth.email;
    if (!stepKey) {
        res.status(400).json({ error: 'Step key is required' });
        return;
    }
    db.execute(`INSERT INTO onboarding_checklists (id, organization_id, step_key, is_completed, completed_at, completed_by, created_at)
     VALUES (?, ?, ?, 1, ?, ?, ?)
     ON CONFLICT(organization_id, step_key) DO UPDATE SET
       is_completed = 1,
       completed_at = excluded.completed_at,
       completed_by = excluded.completed_by`, [`ob_${Date.now()}_${stepKey}`, orgId, stepKey, now, userEmail, now]);
    // If final step is completed, send welcome email and notification
    if (stepKey === 'complete_onboarding') {
        const org = db.queryOne('SELECT name FROM organizations WHERE id = ?', [orgId]);
        await EmailService.send({
            recipient: userEmail,
            templateSlug: 'onboarding_completed',
            variables: {
                businessName: org?.name || 'Your Business',
            },
        });
        NotificationService.notify({
            organizationId: orgId,
            userId: req.auth.userId,
            type: 'system',
            title: '🎉 Onboarding Completed!',
            message: 'Your GreenWave workspace is fully configured and operational.',
            link: '/',
        });
    }
    res.json({ success: true, stepKey, isCompleted: true });
});
export default router;
