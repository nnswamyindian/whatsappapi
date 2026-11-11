import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { normalizePhone } from '../utils/phone.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// 1. Download Sample CSV Formats for different campaign & messaging use cases
router.get('/samples/:type', (req: Request, res: Response) => {
  const type = req.params.type;

  let csvContent = '';
  let filename = `greenwave_${type}_sample.csv`;

  switch (type) {
    case 'general':
      csvContent =
        'Phone,First Name,Last Name,Email,Tags\n' +
        '+919876543210,Rahul,Sharma,rahul@example.com,"VIP,Delhi"\n' +
        '+14155552671,Michael,Chen,michael@example.com,"Wholesale,California"\n' +
        '+447911123456,Emma,Watson,emma@example.com,"Retail,London"';
      break;

    case 'marketing':
      csvContent =
        'Phone,First Name,Promo Code,Discount Percent,Expiry Date\n' +
        '+919876543210,Rahul,FESTIVAL50,50,Sunday Midnight\n' +
        '+14155552671,Michael,SAVE20,20,31-Dec-2025\n' +
        '+447911123456,Emma,VIPOFFER,35,Tomorrow 6 PM';
      break;

    case 'utility':
      csvContent =
        'Phone,Customer Name,Order ID,Courier Name,Tracking Link\n' +
        '+919876543210,Rahul,ORD-8921,BlueDart,https://track.example.com/8921\n' +
        '+14155552671,Michael,ORD-4412,FedEx,https://track.example.com/4412\n' +
        '+447911123456,Emma,ORD-9023,DHL Express,https://track.example.com/9023';
      break;

    case 'media':
      csvContent =
        'Phone,Recipient Name,Media URL,Document Filename,Caption Text\n' +
        '+919876543210,Rahul,https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800,festival_banner.jpg,Exclusive Deal for you\n' +
        '+14155552671,Michael,https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf,invoice_4412.pdf,Your Official Tax Invoice';
      break;

    case 'carousel':
      csvContent =
        'Phone,Customer Name,Card 1 Image URL,Card 1 Title,Card 2 Image URL,Card 2 Title\n' +
        '+919876543210,Rahul,https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600,Chrono Luxury Watch,https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600,ANC Wireless Headphones\n' +
        '+14155552671,Michael,https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600,Red Sport Sneakers,https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600,Designer Sunglasses';
      break;

    case 'custom_variables':
      csvContent =
        'Phone,First Name,var_1,var_2,var_3,Custom City,Account Balance\n' +
        '+919876543210,Rahul,Gold Tier,2500 Points,Active,Mumbai,5200\n' +
        '+14155552671,Michael,Platinum,12000 Points,Renewing,San Francisco,14500';
      break;

    default:
      csvContent =
        'Phone,First Name,Last Name,Email,Tags\n' +
        '+919876543210,Rahul,Sharma,rahul@example.com,VIP\n' +
        '+14155552671,Michael,Chen,michael@example.com,Lead';
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// 2. Generate Template-Specific Sample CSV Headers from Selected Template
router.get('/samples/template/:templateId', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const template = db.queryOne<any>('SELECT * FROM templates WHERE id = ? AND organization_id = ?', [
    req.params.templateId,
    orgId,
  ]);

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const variables: string[] = JSON.parse(template.variables_json || '[]');
  const headers = ['Phone', 'First Name', 'Last Name'];

  // Add template variable columns
  if (variables.length > 0) {
    variables.forEach((_, idx) => {
      headers.push(`var_${idx + 1}`);
    });
  } else {
    // Check if body has {{1}}, {{2}}
    const bodyMatches = (template.body_text || '').match(/\{\{(\d+)\}\}/g);
    if (bodyMatches) {
      const uniqueVars = Array.from(new Set(bodyMatches));
      uniqueVars.forEach((v: any) => {
        headers.push(`variable_${String(v).replace(/[{}]/g, '')}`);
      });
    }
  }

  if (template.header_type === 'IMAGE' || template.header_type === 'DOCUMENT' || template.header_type === 'VIDEO') {
    headers.push('header_media_url');
  }

  const sampleRow1 = ['+919876543210', 'Alex', 'Vance'];
  const sampleRow2 = ['+14155552671', 'Sarah', 'Connor'];

  for (let i = 3; i < headers.length; i++) {
    if (headers[i].includes('media_url')) {
      sampleRow1.push('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800');
      sampleRow2.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600');
    } else {
      sampleRow1.push(`Value_${i - 2}`);
      sampleRow2.push(`Value_${i - 2}`);
    }
  }

  const csvContent = `${headers.join(',')}\n${sampleRow1.join(',')}\n${sampleRow2.join(',')}`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${template.name}_sample.csv"`);
  res.send(csvContent);
});

// 3. Pre-Flight Contact Import Validation Preview
router.post('/import-preview', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { rows, columnMap } = req.body;
  const orgId = req.auth!.orgId;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'No data rows provided for preview' });
    return;
  }

  const phoneKey = columnMap?.phone || 'Phone';
  const firstNameKey = columnMap?.firstName || 'First Name';
  const lastNameKey = columnMap?.lastName || 'Last Name';
  const mediaUrlKey = columnMap?.mediaUrl || 'Media URL';

  let validCount = 0;
  let duplicateCount = 0;
  let suppressedCount = 0;
  let invalidCount = 0;
  const invalidRows: Array<{ row: number; phone: string; reason: string }> = [];
  const previewNormalized: any[] = [];
  const seenInFile = new Set<string>();

  // Fetch all existing phones and suppressed phones for fast in-memory validation
  const existingContacts = new Set(
    db.query<{ phone_e164: string }>('SELECT phone_e164 FROM contacts WHERE organization_id = ?', [orgId]).map((c) => c.phone_e164)
  );

  const suppressedPhones = new Set(
    db.query<{ phone_e164: string }>('SELECT phone_e164 FROM suppression_list WHERE organization_id = ?', [orgId]).map((s) => s.phone_e164)
  );

  rows.forEach((r: any, idx: number) => {
    const rawPhone = r[phoneKey] || r['phone'] || r['Mobile'] || r['whatsapp'] || '';
    const normalized = normalizePhone(String(rawPhone));

    if (!normalized.isValid) {
      invalidCount++;
      invalidRows.push({ row: idx + 1, phone: String(rawPhone), reason: normalized.error || 'Invalid phone format' });
      return;
    }

    // Media URL validation if mapped
    if (r[mediaUrlKey]) {
      const urlStr = String(r[mediaUrlKey]).trim();
      if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
        invalidCount++;
        invalidRows.push({ row: idx + 1, phone: normalized.e164, reason: 'Invalid media URL (must begin with http:// or https://)' });
        return;
      }
    }

    if (suppressedPhones.has(normalized.e164)) {
      suppressedCount++;
      invalidRows.push({ row: idx + 1, phone: normalized.e164, reason: 'Phone is currently on compliance suppression/opt-out list' });
      return;
    }

    if (seenInFile.has(normalized.e164) || existingContacts.has(normalized.e164)) {
      duplicateCount++;
    } else {
      validCount++;
      seenInFile.add(normalized.e164);
    }

    if (previewNormalized.length < 5) {
      previewNormalized.push({
        row: idx + 1,
        phoneE164: normalized.e164,
        country: normalized.countryCode,
        firstName: r[firstNameKey] || '',
        lastName: r[lastNameKey] || '',
        status: existingContacts.has(normalized.e164) ? 'Existing (Merge)' : 'New Contact',
      });
    }
  });

  res.json({
    totalRows: rows.length,
    validCount,
    duplicateCount,
    suppressedCount,
    invalidCount,
    eligibleCount: validCount + duplicateCount,
    samplePreview: previewNormalized,
    invalidRows: invalidRows.slice(0, 50),
  });
});

// 4. Download Failed Import Records as CSV
router.post('/export-failed-csv', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { failedRecords } = req.body;
  if (!Array.isArray(failedRecords) || failedRecords.length === 0) {
    res.status(400).json({ error: 'No failed records provided' });
    return;
  }

  let csvContent = 'Row Number,Phone Number,Failure Reason\n';
  failedRecords.forEach((item: any) => {
    const row = item.row || '';
    const phone = item.phone || '';
    const reason = (item.reason || '').replace(/"/g, '""');
    csvContent += `${row},"${phone}","${reason}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="greenwave_failed_rows.csv"');
  res.send(csvContent);
});

// 5. Import History
router.get('/import-history', (req: Request, res: Response) => {
  const imports = db.query<any>(
    'SELECT * FROM contact_imports WHERE organization_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.auth!.orgId]
  );

  res.json(
    imports.map((item) => ({
      ...item,
      failedRecords: JSON.parse(item.failed_records_json || '[]'),
    }))
  );
});

// 6. List Contacts with Search, Tag Filter, and Pagination
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

  const total =
    db.queryOne<{ count: number }>(
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

// 7. Single Contact Creation
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

// 8. Batch Contact Import Wizard Execution
router.post('/import', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const { rows, columnMap, consentSource = 'csv_import', consentPurpose = 'marketing', presetName } = req.body;
  const orgId = req.auth!.orgId;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'No data rows provided for import' });
    return;
  }

  const phoneKey = columnMap?.phone || 'Phone';
  const firstNameKey = columnMap?.firstName || 'First Name';
  const lastNameKey = columnMap?.lastName || 'Last Name';
  const emailKey = columnMap?.email || 'Email';
  const tagKey = columnMap?.tags || 'Tags';

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
      const rawPhone = r[phoneKey] || r['phone'] || r['Mobile'] || r['whatsapp'] || '';
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
      const rawTags = r[tagKey] || r['tags'] || '';
      if (typeof rawTags === 'string' && rawTags.trim()) {
        parsedTags = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
      } else if (Array.isArray(rawTags)) {
        parsedTags = rawTags;
      }

      // Extract custom fields from other columns
      const standardKeys = new Set([phoneKey, firstNameKey, lastNameKey, emailKey, tagKey, 'Phone', 'phone', 'First Name', 'firstName', 'Last Name', 'lastName', 'Email', 'email', 'Tags', 'tags']);
      const customData: Record<string, any> = {};
      Object.keys(r).forEach((k) => {
        if (!standardKeys.has(k) && r[k] !== undefined && r[k] !== '') {
          customData[k] = r[k];
        }
      });

      // Check if contact already exists
      const existing = db.queryOne<{ id: string; tags: string; custom_fields: string }>(
        'SELECT id, tags, custom_fields FROM contacts WHERE organization_id = ? AND phone_e164 = ?',
        [orgId, normalized.e164]
      );

      if (existing) {
        duplicateCount++;
        try {
          const oldTags = JSON.parse(existing.tags || '[]');
          const mergedTags = Array.from(new Set([...oldTags, ...parsedTags]));
          const oldCustom = JSON.parse(existing.custom_fields || '{}');
          const mergedCustom = { ...oldCustom, ...customData };

          db.execute('UPDATE contacts SET tags = ?, custom_fields = ?, updated_at = ? WHERE id = ?', [
            JSON.stringify(mergedTags),
            JSON.stringify(mergedCustom),
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
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
          [
            contactId,
            orgId,
            normalized.e164,
            r[firstNameKey] || null,
            r[lastNameKey] || null,
            r[emailKey] || null,
            JSON.stringify(parsedTags),
            JSON.stringify(customData),
            now,
            now,
          ]
        );

        // Record explicit consent
        db.execute(
          `INSERT INTO consent_ledger
           (id, organization_id, contact_id, phone_e164, status, purpose, source, evidence, timestamp)
           VALUES (?, ?, ?, ?, 'opted_in', ?, ?, 'Batch import consent declaration', ?)`,
          [uuidv4(), orgId, contactId, normalized.e164, consentPurpose, consentSource, now]
        );

        createdCount++;
      }
    });

    // Record import batch with optional preset name
    db.execute(
      `INSERT INTO contact_imports
       (id, organization_id, filename, total_rows, valid_rows, duplicate_rows, invalid_rows, suppressed_rows, status, failed_records_json, preset_name, created_at)
       VALUES (?, ?, 'import_upload.csv', ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
      [
        batchId,
        orgId,
        rows.length,
        createdCount,
        duplicateCount,
        invalidCount,
        suppressedCount,
        JSON.stringify(failedRecords),
        presetName || null,
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

// 9. Consent Ledger Audit Trail
router.get('/consent-ledger', (req: Request, res: Response) => {
  const records = db.query<any>(
    'SELECT * FROM consent_ledger WHERE organization_id = ? ORDER BY timestamp DESC LIMIT 100',
    [req.auth!.orgId]
  );
  res.json(records);
});

// 10. Suppression List
router.get('/suppression-list', (req: Request, res: Response) => {
  const list = db.query<any>(
    'SELECT * FROM suppression_list WHERE organization_id = ? ORDER BY created_at DESC',
    [req.auth!.orgId]
  );
  res.json(list);
});

// 11. Add to Suppression List
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

// 12. Remove from Suppression List
router.delete('/suppression-list/:phone', requireRole(['admin']), (req: Request, res: Response) => {
  const normalized = normalizePhone(String(req.params.phone));
  db.execute(
    'DELETE FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?',
    [req.auth!.orgId, normalized.e164]
  );
  res.json({ success: true, phoneE164: normalized.e164 });
});

// 13. Delete/Archive Contact
router.delete('/:id', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  db.execute('DELETE FROM contacts WHERE id = ? AND organization_id = ?', [req.params.id, req.auth!.orgId]);
  res.json({ success: true });
});

export default router;
