import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';
import fs from 'node:fs';

const router = Router();
router.use(authMiddleware);

// List Templates
router.get('/', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const status = req.query.status as string;
  const category = req.query.category as string;

  let query = 'SELECT * FROM templates WHERE organization_id = ?';
  const params: any[] = [orgId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  const templates = db.query<any>(query, params);

  res.json(
    templates.map((t) => ({
      ...t,
      buttons: JSON.parse(t.buttons_json || '[]'),
      variables: JSON.parse(t.variables_json || '[]'),
      isCarousel: Boolean(t.is_carousel),
      cards: JSON.parse(t.cards_json || '[]'),
    }))
  );
});

// Get Single Template Details
router.get('/:id', (req: Request, res: Response) => {
  const template = db.queryOne<any>(
    'SELECT * FROM templates WHERE id = ? AND organization_id = ?',
    [req.params.id, req.auth!.orgId]
  );

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  res.json({
    ...template,
    buttons: JSON.parse(template.buttons_json || '[]'),
    variables: JSON.parse(template.variables_json || '[]'),
    isCarousel: Boolean(template.is_carousel),
    cards: JSON.parse(template.cards_json || '[]'),
  });
});

// Create & Submit Template (supports standard, media-header, and carousel templates)
router.post('/', requireRole(['campaign_manager']), async (req: Request, res: Response) => {
  const {
    name,
    category,
    language = 'en_US',
    headerType = 'NONE',
    headerContent,
    bodyText,
    footerText,
    buttons = [],
    variables = [],
    isCarousel = false,
    cards = [],
    action = 'SUBMIT', // 'DRAFT' or 'SUBMIT'
  } = req.body;

  const orgId = req.auth!.orgId;

  if (!name || !category) {
    res.status(400).json({ error: 'Template name and category are required' });
    return;
  }

  // Meta character limit validation:
  if (!isCarousel) {
    if (!bodyText || !bodyText.trim()) {
      res.status(400).json({ error: 'Body text is required for standard templates' });
      return;
    }
    if (bodyText.length > 1024) {
      res.status(400).json({ error: `Body text exceeds Meta limit of 1024 characters (current: ${bodyText.length})` });
      return;
    }
  }

  if (headerType === 'TEXT' && headerContent && headerContent.length > 60) {
    res.status(400).json({ error: `Header text exceeds Meta limit of 60 characters (current: ${headerContent.length})` });
    return;
  }

  if (footerText && footerText.length > 60) {
    res.status(400).json({ error: `Footer text exceeds Meta limit of 60 characters (current: ${footerText.length})` });
    return;
  }

  // Button validations
  for (const b of buttons) {
    if (b.text && b.text.length > 25) {
      res.status(400).json({ error: `Button label '${b.text}' exceeds Meta limit of 25 characters` });
      return;
    }
  }

  // Carousel validation according to official Meta specifications:
  if (isCarousel) {
    if (!Array.isArray(cards) || cards.length < 2 || cards.length > 10) {
      res.status(400).json({
        error: 'Carousel Validation Error',
        message: 'Meta requires carousel templates to have between 2 and 10 cards.',
      });
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card.bodyText || !card.bodyText.trim()) {
        res.status(400).json({ error: `Carousel Card #${i + 1} must have body text` });
        return;
      }
      if (card.bodyText.length > 160) {
        res.status(400).json({ error: `Carousel Card #${i + 1} body text exceeds Meta limit of 160 characters (current: ${card.bodyText.length})` });
        return;
      }
      if (card.buttons && card.buttons.length > 2) {
        res.status(400).json({ error: `Carousel Card #${i + 1} cannot have more than 2 buttons` });
        return;
      }
    }
  }

  // Validate template name format (Meta requires lowercase letters, numbers, and underscores)
  const cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  const existing = db.queryOne(
    'SELECT id FROM templates WHERE organization_id = ? AND name = ? AND language = ?',
    [orgId, cleanName, language]
  );
  if (existing) {
    res.status(409).json({ error: 'A template with this name and language already exists' });
    return;
  }

  const templateId = uuidv4();
  const now = new Date().toISOString();
  let status = action === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';
  let metaTemplateId: string | null = null;

  if (action === 'SUBMIT') {
    try {
      const { provider } = getWhatsAppProviderForOrg(orgId);

      // Build components payload according to Meta specifications
      const components: any[] = [];

      if (!isCarousel) {
        if (headerType !== 'NONE') {
          components.push({
            type: 'HEADER',
            format: headerType,
            text: headerType === 'TEXT' ? headerContent : undefined,
          });
        }
        components.push({
          type: 'BODY',
          text: bodyText,
        });
        if (footerText) {
          components.push({ type: 'FOOTER', text: footerText });
        }
        if (buttons.length > 0) {
          components.push({
            type: 'BUTTONS',
            buttons: buttons.map((b: any) => ({
              type: b.type,
              text: b.text,
              url: b.url,
              phone_number: b.phoneNumber,
            })),
          });
        }
      } else {
        // Carousel components specification
        if (bodyText) {
          components.push({ type: 'BODY', text: bodyText });
        }
        components.push({
          type: 'CAROUSEL',
          cards: cards.map((c: any) => ({
            components: [
              {
                type: 'HEADER',
                format: c.headerType || 'IMAGE',
                example: c.headerUrl ? { header_handle: [c.headerUrl] } : undefined,
              },
              {
                type: 'BODY',
                text: c.bodyText,
              },
              c.buttons && c.buttons.length > 0
                ? {
                    type: 'BUTTONS',
                    buttons: c.buttons.map((b: any) => ({
                      type: b.type || 'QUICK_REPLY',
                      text: b.text,
                      url: b.url,
                    })),
                  }
                : null,
            ].filter(Boolean),
          })),
        });
      }

      const submission = await provider.createTemplate({
        name: cleanName,
        category,
        language,
        components,
      });

      metaTemplateId = submission.id;
      status = submission.status || 'APPROVED';
    } catch (err: any) {
      status = 'REJECTED';
    }
  }

  db.execute(
    `INSERT INTO templates
     (id, organization_id, name, category, language, header_type, header_content, body_text, footer_text, buttons_json, variables_json, is_carousel, cards_json, status, meta_template_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      templateId,
      orgId,
      cleanName,
      category,
      language,
      headerType,
      headerContent || null,
      bodyText || 'Carousel Template',
      footerText || null,
      JSON.stringify(buttons),
      JSON.stringify(variables),
      isCarousel ? 1 : 0,
      JSON.stringify(cards),
      status,
      metaTemplateId,
      now,
      now,
    ]
  );

  res.status(201).json({
    id: templateId,
    name: cleanName,
    category,
    status,
    isCarousel,
    metaTemplateId,
  });
});

// Upload Media (Image, Video, Document) for Template Headers
router.post('/upload-media', requireRole(['campaign_manager']), async (req: Request, res: Response) => {
  const { fileName, fileType, fileBase64, mediaType } = req.body;

  if (!fileName || !fileBase64) {
    res.status(400).json({ error: 'File name and file content (base64) are required' });
    return;
  }

  // Strip possible data URI prefix (e.g., "data:image/png;base64,")
  const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // File size validation according to WhatsApp Cloud API limits:
  // Images: Max 5MB, Videos: Max 16MB, Documents: Max 100MB
  const sizeMB = buffer.length / (1024 * 1024);
  if (mediaType === 'IMAGE' && sizeMB > 5) {
    res.status(400).json({ error: `Image file exceeds Meta limit of 5MB (current: ${sizeMB.toFixed(2)}MB)` });
    return;
  }
  if (mediaType === 'VIDEO' && sizeMB > 16) {
    res.status(400).json({ error: `Video file exceeds Meta limit of 16MB (current: ${sizeMB.toFixed(2)}MB)` });
    return;
  }
  if (mediaType === 'DOCUMENT' && sizeMB > 100) {
    res.status(400).json({ error: `Document file exceeds Meta limit of 100MB (current: ${sizeMB.toFixed(2)}MB)` });
    return;
  }

  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `tpl_${Date.now()}_${uuidv4().substring(0, 8)}_${cleanName}`;
  const targetDir = path.resolve(process.cwd(), 'uploads', 'templates');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, uniqueName);
  fs.writeFileSync(filePath, buffer);

  const appUrl = process.env.APP_URL || 'http://localhost:5000';
  const publicUrl = `${appUrl}/uploads/templates/${uniqueName}`;

  res.status(201).json({
    success: true,
    url: publicUrl,
    fileName: cleanName,
    fileSize: buffer.length,
    fileType: fileType || 'application/octet-stream',
    mediaType: mediaType || 'IMAGE',
  });
});

// Delete Template
router.delete('/:id', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  db.execute('DELETE FROM templates WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

export default router;
