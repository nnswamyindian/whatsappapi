import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { normalizePhone } from '../utils/phone.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// List Contacts with Search, Tag Filter, and Pagination
router.get('/', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const search = (req.query.search as string) || '';
  const tag = (req.query.tag as string) || '';
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM contacts WHERE organization_id = ? AND status = 'active'";
  const params: any[] = [orgId];

  if (search) {
    query += ' AND (phone_e164 LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  if (tag) {
    query += ' AND tags LIKE ?';
    params.push(`%"${tag}"%`);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const contacts = db.query<any>(query, params);

  const total = db.queryOne<{ count: number }>(
    "SELECT COUNT(*) as count FROM contacts WHERE organization_id = ? AND status = 'active'",
    [orgId]
  )?.count || 0;

  res.json({
    contacts: contacts.map((c) => ({
      ...c,
      tags: JSON.parse(c.tags || '[]'),
      customFields: JSON.parse(c.custom_fields || '{}'),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Single Contact Creation
router.post('/', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { phone, firstName, lastName, email, tags, customFields, consentSource = 'manual_entry', consentPurpose = 'marketing' } = req.body;
  const orgId = req.auth!.orgId;

  const normalized = normalizePhone(phone);
  if (!normalized.isValid) {
    res.status(400).json({ error: 'Invalid phone number', details: normalized.error });
    return;
  }

  const existing = db.queryOne('SELECT id FROM contacts WHERE organization_id = ? AND phone_e164 = ?', [
    orgId,
    normalized.e164,
  ]);

  if (existing) {
    res.status(409).json({ error: 'Contact with this phone number already exists in workspace' });
    return;
  }

  const contactId = uuidv4();
  const now = new Date().toISOString();

  db.transaction(() => {
    db.execute(
      `INSERT INTO contacts
       (id, organization_id, phone_e164, first_name, last_name, email, tags, custom_fields, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        contactId,
        orgId,
        normalized.e164,
        firstName || null,
        lastName || null,
        email || null,
        JSON.stringify(tags || []),
        JSON.stringify(customFields || {}),
        now,
        now,
      ]
    );

    // Record explicit consent
    db.execute(
      `INSERT INTO consent_ledger
       (id, organization_id, contact_id, phone_e164, status, purpose, source, evidence, timestamp)
       VALUES (?, ?, ?, ?, 'opted_in', ?, ?, 'Manual entry by workspace agent', ?)`,
      [uuidv4(), orgId, contactId, normalized.e164, consentPurpose, consentSource, now]
    );
  });

  res.status(201).json({ id: contactId, phoneE164: normalized.e164, firstName, lastName });
});

// Batch Contact Import Wizard Endpoint
router.post('/import', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { rows, columnMap, consentSource = 'csv_import', consentPurpose = 'marketing' } = req.body;
  const orgId = req.auth!.orgId;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'No data rows provided for import' });
    return;
  }

  const phoneKey = columnMap?.phone || 'phone';
  const firstNameKey = columnMap?.firstName || 'firstName';
  const lastNameKey = columnMap?.lastName || 'lastName';
  const emailKey = columnMap?.email || 'email';
  const tagKey = columnMap?.tags || 'tags';

  let createdCount = 0;
  let updatedCount = 0;
  let duplicateCount = 0;
  let suppressedCount = 0;
  let invalidCount = 0;
  const failedRecords: Array<{ row: number; phone: string; reason: string }> = [];

  const now = new Date().toISOString();
  const batchId = uuidv4();

  db.transaction(() => {
    rows.forEach((r: any, idx: number) => {
      const rawPhone = r[phoneKey] || r['Phone'] || r['Mobile'] || r['whatsapp'] || '';
      const normalized = normalizePhone(String(rawPhone));

      if (!normalized.isValid) {
        invalidCount++;
        failedRecords.push({ row: idx + 1, phone: String(rawPhone), reason: normalized.error || 'Invalid phone format' });
        return;
      }

      // Check suppression list
      const isSuppressed = db.queryOne(
        'SELECT 1 FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?',
        [orgId, normalized.e164]
      );
      if (isSuppressed) {
        suppressedCount++;
        failedRecords.push({ row: idx + 1, phone: normalized.e164, reason: 'Phone is currently on suppression/opt-out list' });
        return;
      }

      // Parse tags
      let parsedTags: string[] = [];
      const rawTags = r[tagKey] || r['Tags'] || '';
      if (typeof rawTags === 'string' && rawTags.trim()) {
        parsedTags = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(rawTags)) {
        parsedTags = rawTags;
      }

      // Check if contact already exists
      const existing = db.queryOne<{ id: string; tags: string }>(
        'SELECT id, tags FROM contacts WHERE organization_id = ? AND phone_e164 = ?',
        [orgId, normalized.e164]
      );

      if (existing) {
        duplicateCount++;
        // Merge tags
        try {
          const oldTags = JSON.parse(existing.tags || '[]');
          const merged = Array.from(new Set([...oldTags, ...parsedTags]));
          db.execute('UPDATE contacts SET tags = ?, updated_at = ? WHERE id = ?', [
            JSON.stringify(merged),
            now,
            existing.id,
          ]);
          updatedCount++;
        } catch (e) {}
      } else {
        const contactId = uuidv4();
        db.execute(
          `INSERT INTO contacts
           (id, organization_id, phone_e164, first_name, last_name, email, tags, custom_fields, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, '{}', 'active', ?, ?)`,
          [
            contactId,
            orgId,
            normalized.e164,
            r[firstNameKey] || r['First Name'] || null,
            r[lastNameKey] || r['Last Name'] || null,
            r[emailKey] || r['Email'] || null,
            JSON.stringify(parsedTags),
            now,
            now,
          ]
        );

        // Record consent
        db.execute(
          `INSERT INTO consent_ledger
           (id, organization_id, contact_id, phone_e164, status, purpose, source, evidence, timestamp)
           VALUES (?, ?, ?, ?, 'opted_in', ?, ?, 'Batch import consent declaration', ?)`,
          [uuidv4(), orgId, contactId, normalized.e164, consentPurpose, consentSource, now]
        );

        createdCount++;
      }
    });

    // Record import batch
    db.execute(
      `INSERT INTO contact_imports
       (id, organization_id, filename, total_rows, valid_rows, duplicate_rows, invalid_rows, suppressed_rows, status, failed_records_json, created_at)
       VALUES (?, ?, 'import_upload.csv', ?, ?, ?, ?, ?, 'completed', ?, ?)`,
      [
        batchId,
        orgId,
        rows.length,
        createdCount,
        duplicateCount,
        invalidCount,
        suppressedCount,
        JSON.stringify(failedRecords),
        now,
      ]
    );
  });

  res.json({
    batchId,
    totalRows: rows.length,
    createdCount,
    updatedCount,
    duplicateCount,
    invalidCount,
    suppressedCount,
    failedRecords,
  });
});

// Consent Ledger Audit Trail
router.get('/consent-ledger', (req: Request, res: Response) => {
  const records = db.query<any>(
    'SELECT * FROM consent_ledger WHERE organization_id = ? ORDER BY timestamp DESC LIMIT 100',
    [req.auth!.orgId]
  );
  res.json(records);
});

// Suppression List
router.get('/suppression-list', (req: Request, res: Response) => {
  const list = db.query<any>(
    'SELECT * FROM suppression_list WHERE organization_id = ? ORDER BY created_at DESC',
    [req.auth!.orgId]
  );
  res.json(list);
});

// Add to Suppression List
router.post('/suppression-list', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { phone, reason = 'manual_optout' } = req.body;
  const normalized = normalizePhone(phone);
  if (!normalized.isValid) {
    res.status(400).json({ error: 'Invalid phone format' });
    return;
  }

  const now = new Date().toISOString();
  db.execute(
    `INSERT OR REPLACE INTO suppression_list (id, organization_id, phone_e164, reason, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), req.auth!.orgId, normalized.e164, reason, now]
  );

  // Update consent ledger to opted_out
  db.execute(
    `INSERT INTO consent_ledger (id, organization_id, contact_id, phone_e164, status, purpose, source, evidence, timestamp)
     VALUES (?, ?, 'suppressed', ?, 'opted_out', 'all', 'manual_suppression', 'Added to suppression list', ?)`,
    [uuidv4(), req.auth!.orgId, normalized.e164, now]
  );

  res.json({ success: true, phoneE164: normalized.e164 });
});

// Remove from Suppression List
router.delete('/suppression-list/:phone', requireRole(['admin']), (req: Request, res: Response) => {
  const normalized = normalizePhone(String(req.params.phone));
  db.execute(
    'DELETE FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?',
    [req.auth!.orgId, normalized.e164]
  );
  res.json({ success: true, phoneE164: normalized.e164 });
});

// Delete/Archive Contact
router.delete('/:id', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  db.execute('DELETE FROM contacts WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

export default router;
