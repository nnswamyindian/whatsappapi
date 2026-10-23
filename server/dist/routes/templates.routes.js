import { Router } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
router.use(authMiddleware);
// List Templates
router.get('/', (req, res) => {
    const orgId = req.auth.orgId;
    const status = req.query.status;
    const category = req.query.category;
    let query = 'SELECT * FROM templates WHERE organization_id = ?';
    const params = [orgId];
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    const templates = db.query(query, params);
    res.json(templates.map((t) => ({
        ...t,
        buttons: JSON.parse(t.buttons_json || '[]'),
        variables: JSON.parse(t.variables_json || '[]'),
    })));
});
// Get Single Template Details
router.get('/:id', (req, res) => {
    const template = db.queryOne('SELECT * FROM templates WHERE id = ? AND organization_id = ?', [req.params.id, req.auth.orgId]);
    if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
    }
    res.json({
        ...template,
        buttons: JSON.parse(template.buttons_json || '[]'),
        variables: JSON.parse(template.variables_json || '[]'),
    });
});
// Create & Submit Template
router.post('/', requireRole(['campaign_manager']), async (req, res) => {
    const { name, category, language = 'en_US', headerType = 'NONE', headerContent, bodyText, footerText, buttons = [], variables = [], action = 'SUBMIT', // 'DRAFT' or 'SUBMIT'
     } = req.body;
    const orgId = req.auth.orgId;
    if (!name || !category || !bodyText) {
        res.status(400).json({ error: 'Name, category, and body text are required' });
        return;
    }
    // Validate template name format (Meta requires lowercase letters, numbers, and underscores)
    const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const existing = db.queryOne('SELECT id FROM templates WHERE organization_id = ? AND name = ? AND language = ?', [orgId, cleanName, language]);
    if (existing) {
        res.status(409).json({ error: 'A template with this name and language already exists' });
        return;
    }
    const templateId = uuidv4();
    const now = new Date().toISOString();
    let status = action === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
    let metaTemplateId = null;
    if (action === 'SUBMIT') {
        try {
            const { provider } = getWhatsAppProviderForOrg(orgId);
            const submission = await provider.createTemplate({
                name: cleanName,
                category,
                language,
                components: [
                    headerType !== 'NONE'
                        ? {
                            type: 'HEADER',
                            format: headerType,
                            text: headerType === 'TEXT' ? headerContent : undefined,
                        }
                        : null,
                    {
                        type: 'BODY',
                        text: bodyText,
                    },
                    footerText ? { type: 'FOOTER', text: footerText } : null,
                    buttons.length > 0
                        ? {
                            type: 'BUTTONS',
                            buttons: buttons.map((b, idx) => ({
                                type: b.type,
                                text: b.text,
                                url: b.url,
                                phone_number: b.phoneNumber,
                            })),
                        }
                        : null,
                ].filter(Boolean),
            });
            metaTemplateId = submission.id;
            status = submission.status || 'APPROVED'; // Mock auto-approves, Meta marks PENDING
        }
        catch (err) {
            status = 'REJECTED';
        }
    }
    db.execute(`INSERT INTO templates
     (id, organization_id, name, category, language, header_type, header_content, body_text, footer_text, buttons_json, variables_json, status, meta_template_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        templateId,
        orgId,
        cleanName,
        category,
        language,
        headerType,
        headerContent || null,
        bodyText,
        footerText || null,
        JSON.stringify(buttons),
        JSON.stringify(variables),
        status,
        metaTemplateId,
        now,
        now,
    ]);
    res.status(201).json({
        id: templateId,
        name: cleanName,
        category,
        status,
        metaTemplateId,
    });
});
// Delete Template
router.delete('/:id', requireRole(['campaign_manager']), (req, res) => {
    db.execute('DELETE FROM templates WHERE id = ? AND organization_id = ?', [req.params.id, req.auth.orgId]);
    res.json({ success: true });
});
export default router;
