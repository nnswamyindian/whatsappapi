import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { normalizePhone } from '../utils/phone.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.use(authMiddleware);
// 1. Get Pipeline Stages
router.get('/stages', (req, res) => {
    const orgId = req.auth.orgId;
    const stages = db.query('SELECT * FROM pipeline_stages WHERE organization_id = ? ORDER BY order_index ASC', [orgId]);
    res.json(stages);
});
// 2. Create or Reorder Pipeline Stages
router.post('/stages', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req, res) => {
    const { name, color = '#16A34A', orderIndex = 0 } = req.body;
    const orgId = req.auth.orgId;
    if (!name || !name.trim()) {
        res.status(400).json({ error: 'Stage name is required' });
        return;
    }
    const id = uuidv4();
    db.execute(`INSERT INTO pipeline_stages (id, organization_id, name, order_index, color, is_default, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`, [id, orgId, name.trim(), orderIndex, color, new Date().toISOString()]);
    res.status(201).json({ id, name, color, orderIndex });
});
// 3. List CRM Leads (Contacts with Pipeline Stage and Value)
router.get('/leads', (req, res) => {
    const orgId = req.auth.orgId;
    const stageId = req.query.stageId;
    const search = req.query.search;
    let query = `
    SELECT c.*, ps.name as stage_name, ps.color as stage_color
    FROM contacts c
    LEFT JOIN pipeline_stages ps ON c.pipeline_stage_id = ps.id
    WHERE c.organization_id = ? AND c.status = 'active'
  `;
    const params = [orgId];
    if (stageId) {
        query += ' AND c.pipeline_stage_id = ?';
        params.push(stageId);
    }
    if (search) {
        query += ' AND (c.phone_e164 LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
    }
    query += ' ORDER BY c.created_at DESC';
    const leads = db.query(query, params);
    res.json(leads.map((l) => ({
        ...l,
        tags: JSON.parse(l.tags || '[]'),
        customFields: JSON.parse(l.custom_fields || '{}'),
    })));
});
// 4. Create CRM Lead
router.post('/leads', requireRole(['admin', 'sub_admin', 'marketing_manager', 'sales_agent']), (req, res) => {
    const { phone, firstName, lastName, email, stageId, leadValue = 0, assignedAgentId, assignedAgentName, tags = [], leadSource = 'manual' } = req.body;
    const orgId = req.auth.orgId;
    const normalized = normalizePhone(phone);
    if (!normalized.isValid) {
        res.status(400).json({ error: 'Invalid phone number format', details: normalized.error });
        return;
    }
    const existing = db.queryOne('SELECT id FROM contacts WHERE organization_id = ? AND phone_e164 = ?', [
        orgId,
        normalized.e164,
    ]);
    if (existing) {
        res.status(409).json({ error: 'A lead with this phone number already exists in workspace' });
        return;
    }
    const leadId = uuidv4();
    const now = new Date().toISOString();
    // Find default stage if not supplied
    let finalStageId = stageId;
    if (!finalStageId) {
        const defaultStage = db.queryOne('SELECT id FROM pipeline_stages WHERE organization_id = ? ORDER BY order_index ASC LIMIT 1', [orgId]);
        finalStageId = defaultStage?.id || null;
    }
    db.transaction(() => {
        db.execute(`INSERT INTO contacts
       (id, organization_id, phone_e164, first_name, last_name, email, tags, custom_fields, pipeline_stage_id, lead_value, assigned_agent_id, assigned_agent_name, lead_source, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, '{}', ?, ?, ?, ?, ?, 'active', ?, ?)`, [
            leadId,
            orgId,
            normalized.e164,
            firstName || null,
            lastName || null,
            email || null,
            JSON.stringify(tags),
            finalStageId,
            Number(leadValue) || 0,
            assignedAgentId || null,
            assignedAgentName || null,
            leadSource,
            now,
            now,
        ]);
        // Record initial creation activity
        db.execute(`INSERT INTO crm_activities (id, organization_id, contact_id, user_id, user_name, activity_type, title, description, created_at)
       VALUES (?, ?, ?, ?, ?, 'status_change', 'Lead Created', 'Lead entered sales pipeline', ?)`, [uuidv4(), orgId, leadId, req.auth.userId, req.auth.email, now]);
    });
    res.status(201).json({ id: leadId, phoneE164: normalized.e164, stageId: finalStageId });
});
// 5. Move Lead to New Pipeline Stage (Drag-and-Drop or Dropdown)
router.patch('/leads/:id/stage', requireRole(['admin', 'sub_admin', 'marketing_manager', 'sales_agent']), (req, res) => {
    const { stageId } = req.body;
    const orgId = req.auth.orgId;
    const lead = db.queryOne('SELECT * FROM contacts WHERE id = ? AND organization_id = ?', [req.params.id, orgId]);
    if (!lead) {
        res.status(404).json({ error: 'Lead not found' });
        return;
    }
    const stage = db.queryOne('SELECT * FROM pipeline_stages WHERE id = ? AND organization_id = ?', [stageId, orgId]);
    if (!stage) {
        res.status(400).json({ error: 'Target pipeline stage not found' });
        return;
    }
    const now = new Date().toISOString();
    db.transaction(() => {
        db.execute('UPDATE contacts SET pipeline_stage_id = ?, updated_at = ? WHERE id = ? AND organization_id = ?', [
            stageId,
            now,
            req.params.id,
            orgId,
        ]);
        // Record timeline activity
        db.execute(`INSERT INTO crm_activities (id, organization_id, contact_id, user_id, user_name, activity_type, title, description, created_at)
       VALUES (?, ?, ?, ?, ?, 'status_change', 'Stage Updated', ?, ?)`, [uuidv4(), orgId, req.params.id, req.auth.userId, req.auth.email, `Moved to stage: ${stage.name}`, now]);
        // If moved to 'Converted', record attribution outcome if campaign linked
        if (stage.name.toLowerCase().includes('convert') && lead.campaign_id) {
            db.execute(`UPDATE campaign_attributions
         SET replied = 1,
             conversion_value = ?,
             conversion_recorded_at = ?
         WHERE organization_id = ? AND campaign_id = ? AND contact_id = ?`, [lead.lead_value || 1000.0, now, orgId, lead.campaign_id, req.params.id]);
        }
    });
    res.json({ success: true, newStage: stage.name });
});
// 6. Lead Interaction Timeline Activities
router.get('/leads/:id/activities', (req, res) => {
    const activities = db.query('SELECT * FROM crm_activities WHERE contact_id = ? AND organization_id = ? ORDER BY created_at DESC', [req.params.id, req.auth.orgId]);
    res.json(activities);
});
// 7. Add Activity (Call, Meeting, Follow-up Note)
router.post('/leads/:id/activities', requireRole(['admin', 'sub_admin', 'marketing_manager', 'sales_agent']), (req, res) => {
    const { activityType = 'note', title, description } = req.body;
    const orgId = req.auth.orgId;
    if (!title || !title.trim()) {
        res.status(400).json({ error: 'Activity title is required' });
        return;
    }
    const id = uuidv4();
    const now = new Date().toISOString();
    db.execute(`INSERT INTO crm_activities (id, organization_id, contact_id, user_id, user_name, activity_type, title, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, orgId, req.params.id, req.auth.userId, req.auth.email, activityType, title.trim(), description || '', now]);
    res.status(201).json({ id, activityType, title, createdAt: now });
});
// 8. Campaign-to-CRM Attribution Analytics
router.get('/attribution', (req, res) => {
    const orgId = req.auth.orgId;
    const campaignStats = db.query(`SELECT
       c.id as campaign_id,
       c.name as campaign_name,
       c.sent_count,
       c.delivered_count,
       c.read_count,
       c.replied_count,
       COUNT(DISTINCT ct.id) as leads_generated,
       COALESCE(SUM(ct.lead_value), 0.0) as pipeline_value
     FROM campaigns c
     LEFT JOIN contacts ct ON ct.campaign_id = c.id AND ct.organization_id = c.organization_id
     WHERE c.organization_id = ?
     GROUP BY c.id
     ORDER BY c.created_at DESC`, [orgId]);
    res.json({
        attributionModel: 'Last Touch Campaign Attribution',
        campaigns: campaignStats,
    });
});
export default router;
