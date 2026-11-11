import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.use(authMiddleware);
// 1. List Classification Rules
router.get('/', (req, res) => {
    const rules = db.query('SELECT * FROM reply_rules WHERE organization_id = ? ORDER BY priority ASC, created_at DESC', [req.auth.orgId]);
    res.json(rules.map((r) => ({
        ...r,
        isActive: Boolean(r.is_active),
        isOptout: Boolean(r.is_optout),
        tags: JSON.parse(r.add_tags_json || '[]'),
    })));
});
// 2. Create or Update Reply Classification Rule
router.post('/', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req, res) => {
    const { id, name, triggerKeyword, matchType = 'contains', category = 'Enquiry', tags = [], movePipelineStageId, assignAgentId, isOptout = false, priority = 10, } = req.body;
    const orgId = req.auth.orgId;
    if (!name || !triggerKeyword) {
        res.status(400).json({ error: 'Name and trigger keyword are required' });
        return;
    }
    const ruleId = id || uuidv4();
    const now = new Date().toISOString();
    if (id) {
        db.execute(`UPDATE reply_rules
       SET name = ?,
           trigger_keyword = ?,
           match_type = ?,
           category = ?,
           add_tags_json = ?,
           move_pipeline_stage_id = ?,
           assign_agent_id = ?,
           is_optout = ?,
           priority = ?
       WHERE id = ? AND organization_id = ?`, [
            name.trim(),
            triggerKeyword.toLowerCase().trim(),
            matchType,
            category,
            JSON.stringify(tags),
            movePipelineStageId || null,
            assignAgentId || null,
            isOptout ? 1 : 0,
            priority,
            id,
            orgId,
        ]);
    }
    else {
        db.execute(`INSERT INTO reply_rules
       (id, organization_id, name, trigger_keyword, match_type, category, add_tags_json, move_pipeline_stage_id, assign_agent_id, is_optout, is_active, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
            ruleId,
            orgId,
            name.trim(),
            triggerKeyword.toLowerCase().trim(),
            matchType,
            category,
            JSON.stringify(tags),
            movePipelineStageId || null,
            assignAgentId || null,
            isOptout ? 1 : 0,
            priority,
            now,
        ]);
    }
    res.status(201).json({ id: ruleId, name, triggerKeyword });
});
// 3. Delete Rule
router.delete('/:id', requireRole(['admin', 'sub_admin', 'marketing_manager']), (req, res) => {
    db.execute('DELETE FROM reply_rules WHERE id = ? AND organization_id = ?', [req.params.id, req.auth.orgId]);
    res.json({ success: true });
});
export default router;
