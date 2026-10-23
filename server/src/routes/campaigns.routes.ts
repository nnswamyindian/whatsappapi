import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { messageQueue } from '../services/queue.js';
import { getWhatsAppProviderForOrg } from '../providers/whatsapp/factory.js';
import { normalizePhone } from '../utils/phone.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// List Campaigns with Metrics
router.get('/', (req: Request, res: Response) => {
  const campaigns = db.query<any>(
    `SELECT c.*, t.name as template_name, t.category as template_category
     FROM campaigns c
     LEFT JOIN templates t ON t.id = c.template_id
     WHERE c.organization_id = ?
     ORDER BY c.created_at DESC`,
    [req.auth!.orgId]
  );

  res.json(campaigns);
});

// Single Campaign Details & Recipient Logs
router.get('/:id', (req: Request, res: Response) => {
  const campaign = db.queryOne<any>(
    `SELECT c.*, t.name as template_name, t.category as template_category, t.body_text
     FROM campaigns c
     LEFT JOIN templates t ON t.id = c.template_id
     WHERE c.id = ? AND c.organization_id = ?`,
    [req.params.id, req.auth!.orgId]
  );

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  // Fetch recent recipients for audit
  const recipients = db.query<any>(
    'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY sent_at DESC LIMIT 100',
    [campaign.id]
  );

  res.json({
    ...campaign,
    variableMappings: JSON.parse(campaign.variable_mappings_json || '{}'),
    audienceFilter: JSON.parse(campaign.audience_filter_json || '{}'),
    recipients,
  });
});

// Step 3 Pre-Flight: Calculate Audience Eligibility & Transparent Cost Estimate
router.post('/estimate', (req: Request, res: Response) => {
  const { templateId, audienceType = 'all_contacts', audienceFilter = {} } = req.body;
  const orgId = req.auth!.orgId;

  const template = db.queryOne<any>('SELECT * FROM templates WHERE id = ? AND organization_id = ?', [
    templateId,
    orgId,
  ]);

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  // 1. Fetch total active contacts
  let query = "SELECT c.id, c.phone_e164, c.tags, c.custom_fields FROM contacts c WHERE c.organization_id = ? AND c.status = 'active'";
  const params: any[] = [orgId];

  if (audienceType === 'tag' && audienceFilter.tag) {
    query += ' AND c.tags LIKE ?';
    params.push(`%"${audienceFilter.tag}"%`);
  }

  const allContacts = db.query<any>(query, params);

  // 2. Fetch suppressed numbers
  const suppressedList = db.query<{ phone_e164: string }>(
    'SELECT phone_e164 FROM suppression_list WHERE organization_id = ?',
    [orgId]
  );
  const suppressedSet = new Set(suppressedList.map((s) => s.phone_e164));

  // 3. Filter eligible contacts
  let eligibleCount = 0;
  let excludedCount = 0;

  for (const c of allContacts) {
    if (suppressedSet.has(c.phone_e164)) {
      excludedCount++;
    } else {
      eligibleCount++;
    }
  }

  // 4. Rate calculation based on category
  const rateCard = db.queryOne<any>(
    "SELECT provider_rate_usd, platform_fee_usd FROM rate_card WHERE category = ? AND country_code = 'IN'",
    [template.category]
  ) || { provider_rate_usd: 0.0099, platform_fee_usd: 0.0020 };

  const providerCostPerMsg = rateCard.provider_rate_usd;
  const platformFeePerMsg = rateCard.platform_fee_usd;
  const totalCostPerMsg = providerCostPerMsg + platformFeePerMsg;

  const totalEstimatedCost = Number((eligibleCount * totalCostPerMsg).toFixed(4));
  const estimatedProviderCharges = Number((eligibleCount * providerCostPerMsg).toFixed(4));
  const estimatedPlatformCharges = Number((eligibleCount * platformFeePerMsg).toFixed(4));

  // 5. Check wallet balance
  const org = db.queryOne<{ wallet_balance: number }>('SELECT wallet_balance FROM organizations WHERE id = ?', [
    orgId,
  ]);
  const currentBalance = org?.wallet_balance || 0;
  const hasSufficientBalance = currentBalance >= totalEstimatedCost;

  res.json({
    template: {
      id: template.id,
      name: template.name,
      category: template.category,
      status: template.status,
    },
    totalRecipients: allContacts.length,
    eligibleRecipients: eligibleCount,
    excludedRecipients: excludedCount,
    costBreakdown: {
      providerRatePerMsg: providerCostPerMsg,
      platformFeePerMsg: platformFeePerMsg,
      totalRatePerMsg: totalCostPerMsg,
      estimatedProviderCharges,
      estimatedPlatformCharges,
      totalEstimatedCost,
    },
    wallet: {
      currentBalance,
      hasSufficientBalance,
      shortfall: hasSufficientBalance ? 0 : Number((totalEstimatedCost - currentBalance).toFixed(2)),
    },
    isReadyToLaunch: eligibleCount > 0 && template.status === 'APPROVED' && hasSufficientBalance,
  });
});

// Step 4: Launch Campaign (Immediate or Scheduled)
router.post('/', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const {
    name,
    templateId,
    audienceType = 'all_contacts',
    audienceFilter = {},
    variableMappings = {},
    scheduledAt,
  } = req.body;

  const orgId = req.auth!.orgId;

  if (!name || !templateId) {
    res.status(400).json({ error: 'Campaign name and template ID are required' });
    return;
  }

  const template = db.queryOne<any>('SELECT * FROM templates WHERE id = ? AND organization_id = ?', [
    templateId,
    orgId,
  ]);

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  if (template.status !== 'APPROVED') {
    res.status(400).json({
      error: 'Unapproved template',
      message: 'WhatsApp Business API requires templates to be APPROVED by Meta before launching campaigns',
    });
    return;
  }

  // 1. Gather audience
  let query = "SELECT c.id, c.phone_e164, c.first_name, c.last_name, c.custom_fields FROM contacts c WHERE c.organization_id = ? AND c.status = 'active'";
  const params: any[] = [orgId];

  if (audienceType === 'tag' && audienceFilter.tag) {
    query += ' AND c.tags LIKE ?';
    params.push(`%"${audienceFilter.tag}"%`);
  }

  const allContacts = db.query<any>(query, params);

  // 2. Suppression check
  const suppressedList = db.query<{ phone_e164: string }>(
    'SELECT phone_e164 FROM suppression_list WHERE organization_id = ?',
    [orgId]
  );
  const suppressedSet = new Set(suppressedList.map((s) => s.phone_e164));

  const eligibleContacts = allContacts.filter((c) => !suppressedSet.has(c.phone_e164));
  const excludedCount = allContacts.length - eligibleContacts.length;

  if (eligibleContacts.length === 0) {
    res.status(400).json({ error: 'Audience has 0 eligible contacts after suppression checks' });
    return;
  }

  // 3. Cost verification & wallet deduction
  const rateCard = db.queryOne<any>(
    "SELECT provider_rate_usd, platform_fee_usd FROM rate_card WHERE category = ? AND country_code = 'IN'",
    [template.category]
  ) || { provider_rate_usd: 0.0099, platform_fee_usd: 0.0020 };

  const totalCost = Number((eligibleContacts.length * (rateCard.provider_rate_usd + rateCard.platform_fee_usd)).toFixed(4));
  const org = db.queryOne<any>('SELECT wallet_balance FROM organizations WHERE id = ?', [orgId]);

  if ((org?.wallet_balance || 0) < totalCost) {
    res.status(402).json({
      error: 'Insufficient wallet balance',
      required: totalCost,
      currentBalance: org?.wallet_balance || 0,
    });
    return;
  }

  const campaignId = uuidv4();
  const now = new Date().toISOString();
  const isScheduled = !!scheduledAt && new Date(scheduledAt) > new Date();
  const initialStatus = isScheduled ? 'scheduled' : 'processing';

  db.transaction(() => {
    // Deduct wallet balance
    const newBalance = Number((org.wallet_balance - totalCost).toFixed(4));
    db.execute('UPDATE organizations SET wallet_balance = ?, updated_at = ? WHERE id = ?', [newBalance, now, orgId]);

    // Record ledger entry
    db.execute(
      `INSERT INTO wallet_ledger (id, organization_id, amount, balance_after, transaction_type, reference_id, description, created_at)
       VALUES (?, ?, ?, ?, 'campaign_deduction', ?, ?, ?)`,
      [uuidv4(), orgId, -totalCost, newBalance, campaignId, `Campaign launch reserve: ${name}`, now]
    );

    // Create Campaign Record
    db.execute(
      `INSERT INTO campaigns
       (id, organization_id, name, template_id, audience_type, audience_filter_json, variable_mappings_json, status, scheduled_at, total_recipients, eligible_recipients, excluded_recipients, estimated_cost, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaignId,
        orgId,
        name,
        templateId,
        audienceType,
        JSON.stringify(audienceFilter),
        JSON.stringify(variableMappings),
        initialStatus,
        scheduledAt || null,
        allContacts.length,
        eligibleContacts.length,
        excludedCount,
        totalCost,
        now,
        now,
      ]
    );

    // Create Campaign Recipients
    for (const c of eligibleContacts) {
      // Resolve mapped variables
      const resolvedVars: Record<string, string> = {};
      const custom = JSON.parse(c.custom_fields || '{}');

      for (const [varIdx, fieldName] of Object.entries(variableMappings)) {
        if (fieldName === 'first_name') resolvedVars[varIdx] = c.first_name || 'Customer';
        else if (fieldName === 'last_name') resolvedVars[varIdx] = c.last_name || '';
        else if (fieldName === 'phone') resolvedVars[varIdx] = c.phone_e164;
        else if (custom[fieldName as string]) resolvedVars[varIdx] = custom[fieldName as string];
        else resolvedVars[varIdx] = String(fieldName);
      }

      db.execute(
        `INSERT INTO campaign_recipients
         (id, campaign_id, organization_id, contact_id, phone_e164, variables_applied_json, status)
         VALUES (?, ?, ?, ?, ?, ?, 'queued')`,
        [uuidv4(), campaignId, orgId, c.id, c.phone_e164, JSON.stringify(resolvedVars)]
      );
    }
  });

  // If immediate, enqueue to message queue
  if (!isScheduled) {
    messageQueue.enqueue({
      type: 'CAMPAIGN_BATCH',
      orgId,
      data: { campaignId, orgId, batchSize: 15 },
    });
  }

  res.status(201).json({
    id: campaignId,
    name,
    status: initialStatus,
    totalRecipients: allContacts.length,
    eligibleRecipients: eligibleContacts.length,
    excludedRecipients: excludedCount,
    estimatedCost: totalCost,
  });
});

// Test Send Single Template Message
router.post('/test-send', requireRole(['campaign_manager']), async (req: Request, res: Response) => {
  const { templateId, testPhone, sampleVariables = [] } = req.body;
  const orgId = req.auth!.orgId;

  const normalized = normalizePhone(testPhone);
  if (!normalized.isValid) {
    res.status(400).json({ error: 'Invalid test phone format' });
    return;
  }

  const template = db.queryOne<any>('SELECT * FROM templates WHERE id = ? AND organization_id = ?', [
    templateId,
    orgId,
  ]);

  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }

  const { provider, isSandbox } = getWhatsAppProviderForOrg(orgId);

  const result = await provider.sendMessage({
    toPhoneE164: normalized.e164,
    type: 'template',
    template: {
      name: template.name,
      language: template.language || 'en_US',
      components: sampleVariables.length > 0 ? [
        {
          type: 'body',
          parameters: sampleVariables.map((v: string) => ({ type: 'text', text: String(v) })),
        },
      ] : [],
    },
  });

  if (result.success) {
    const now = new Date().toISOString();
    db.execute(
      `INSERT INTO messages (id, organization_id, phone_e164, direction, message_type, template_name, status, provider_message_id, cost, created_at, updated_at)
       VALUES (?, ?, ?, 'outbound', 'template', ?, 'delivered', ?, 0.0119, ?, ?)`,
      [uuidv4(), orgId, normalized.e164, template.name, result.providerMessageId || `wamid.${Date.now()}`, now, now]
    );
  }

  res.json({
    ...result,
    isSandbox,
    recipient: normalized.e164,
  });
});

// Pause Campaign
router.post('/:id/pause', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const campaignId = String(req.params.id);
  messageQueue.pauseCampaign(campaignId);
  db.execute("UPDATE campaigns SET status = 'paused', updated_at = ? WHERE id = ? AND organization_id = ?", [
    new Date().toISOString(),
    campaignId,
    req.auth!.orgId,
  ]);
  res.json({ success: true, status: 'paused' });
});

// Resume Campaign
router.post('/:id/resume', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const campaignId = String(req.params.id);
  messageQueue.resumeCampaign(campaignId);
  db.execute("UPDATE campaigns SET status = 'processing', updated_at = ? WHERE id = ? AND organization_id = ?", [
    new Date().toISOString(),
    campaignId,
    req.auth!.orgId,
  ]);

  messageQueue.enqueue({
    type: 'CAMPAIGN_BATCH',
    orgId: req.auth!.orgId,
    data: { campaignId, orgId: req.auth!.orgId, batchSize: 15 },
  });

  res.json({ success: true, status: 'processing' });
});

// Cancel Campaign
router.post('/:id/cancel', requireRole(['campaign_manager']), (req: Request, res: Response) => {
  const campaignId = String(req.params.id);
  messageQueue.cancelCampaign(campaignId);
  res.json({ success: true, status: 'cancelled' });
});

export default router;
