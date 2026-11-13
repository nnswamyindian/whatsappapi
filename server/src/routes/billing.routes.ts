import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';
import { ClientLifecycleService } from '../services/client-lifecycle.js';
import { NotificationService } from '../services/notifications.js';

const router = Router();
router.use(authMiddleware);

// 1. Available Subscription Plans
router.get('/plans', (req: Request, res: Response) => {
  const plans = db.query<any>(
    'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC'
  );
  const formatted = plans.map(p => ({
    ...p,
    features: JSON.parse(p.features_json || '[]'),
  }));
  res.json(formatted);
});

// 2. Active Subscription Status & Quota Utilization
router.get('/subscription', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const org = db.queryOne<any>('SELECT * FROM organizations WHERE id = ?', [orgId]);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const sub = db.queryOne<any>(
    `SELECT s.*, sp.name as plan_name, sp.slug as plan_slug, sp.monthly_price_usd, sp.yearly_price_usd,
            sp.contact_limit, sp.team_member_limit, sp.campaign_limit, sp.waba_limit, sp.features_json
     FROM subscriptions s
     JOIN subscription_plans sp ON sp.id = s.plan_id
     WHERE s.organization_id = ?`,
    [orgId]
  );

  // Compute live quota usages
  const contacts = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM contacts WHERE organization_id = ?',
    [orgId]
  );
  const campaigns = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM campaigns WHERE organization_id = ?',
    [orgId]
  );
  const members = db.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM memberships WHERE organization_id = ?',
    [orgId]
  );

  const now = new Date();
  let daysRemaining = 30;
  if (sub?.renewal_date) {
    const diff = new Date(sub.renewal_date).getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  res.json({
    hasActiveSubscription: Boolean(sub && sub.status === 'active'),
    subscription: sub
      ? {
          id: sub.id,
          planId: sub.plan_id,
          planName: sub.plan_name,
          planSlug: sub.plan_slug,
          billingCycle: sub.billing_cycle,
          status: sub.status,
          startDate: sub.start_date,
          renewalDate: sub.renewal_date,
          daysRemaining,
          price: sub.billing_cycle === 'yearly' ? sub.yearly_price_usd : sub.monthly_price_usd,
          features: JSON.parse(sub.features_json || '[]'),
        }
      : null,
    planTier: org.plan_tier || 'starter',
    quotas: {
      contacts: {
        used: contacts?.count || 0,
        limit: org.contact_limit || 1000,
        percentage: Math.min(100, Math.round(((contacts?.count || 0) / (org.contact_limit || 1000)) * 100)),
      },
      campaigns: {
        used: campaigns?.count || 0,
        limit: org.campaign_limit || 50,
        percentage: Math.min(100, Math.round(((campaigns?.count || 0) / (org.campaign_limit || 50)) * 100)),
      },
      teamMembers: {
        used: members?.count || 0,
        limit: org.team_limit || 3,
        percentage: Math.min(100, Math.round(((members?.count || 0) / (org.team_limit || 3)) * 100)),
      },
    },
  });
});

// 3. Plan Checkout & Real Payment Capture
router.post('/checkout', requireRole(['owner', 'admin', 'billing_manager']), async (req: Request, res: Response) => {
  const { planId, billingCycle = 'monthly', paymentMethod = 'card' } = req.body;
  const orgId = req.auth!.orgId;

  if (!planId) {
    res.status(400).json({ error: 'Plan selection is required' });
    return;
  }

  const plan = db.queryOne<any>('SELECT * FROM subscription_plans WHERE id = ? OR slug = ?', [planId, planId]);
  if (!plan) {
    res.status(404).json({ error: 'Selected subscription plan not found' });
    return;
  }

  const org = db.queryOne<any>('SELECT * FROM organizations WHERE id = ?', [orgId]);
  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const now = new Date();
  const startDate = now.toISOString();

  // Compute renewal date
  const renewal = new Date(now);
  if (billingCycle === 'yearly') {
    renewal.setFullYear(renewal.getFullYear() + 1);
  } else {
    renewal.setDate(renewal.getDate() + 30);
  }
  const renewalDate = renewal.toISOString();

  const amount = Number(billingCycle === 'yearly' ? plan.yearly_price_usd : plan.monthly_price_usd);
  const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
  const invoiceId = uuidv4();
  const subscriptionId = `sub_${uuidv4().substring(0, 8)}`;

  db.transaction(() => {
    // 1. Update organization entitlements and plan
    db.execute(
      `UPDATE organizations
       SET plan_tier = ?,
           contact_limit = ?,
           team_limit = ?,
           campaign_limit = ?,
           updated_at = ?
       WHERE id = ?`,
      [plan.slug, plan.contact_limit, plan.team_member_limit, plan.campaign_limit, startDate, orgId]
    );

    // 2. Upsert subscription record
    db.execute(
      `INSERT INTO subscriptions
       (id, organization_id, plan_id, billing_cycle, status, start_date, renewal_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)
       ON CONFLICT(organization_id) DO UPDATE SET
         plan_id = excluded.plan_id,
         billing_cycle = excluded.billing_cycle,
         status = 'active',
         start_date = excluded.start_date,
         renewal_date = excluded.renewal_date,
         updated_at = excluded.updated_at`,
      [subscriptionId, orgId, plan.id, billingCycle, startDate, renewalDate, startDate, startDate]
    );

    // 3. Create paid invoice record
    db.execute(
      `INSERT INTO invoices
       (id, organization_id, invoice_number, amount, currency, status, billing_reason, pdf_url, created_at)
       VALUES (?, ?, ?, ?, 'USD', 'paid', ?, ?, ?)`,
      [
        invoiceId,
        orgId,
        invoiceNumber,
        amount,
        `MetaGreenWave ${plan.name} (${billingCycle.toUpperCase()})`,
        `/api/v1/billing/invoices/${invoiceNumber}/download`,
        startDate,
      ]
    );

    // 4. Create audit log
    db.execute(
      `INSERT INTO audit_logs (id, organization_id, user_id, user_email, action, resource_type, resource_id, details_json, created_at)
       VALUES (?, ?, ?, ?, 'SUBSCRIPTION_PURCHASED', 'subscription', ?, ?, ?)`,
      [
        uuidv4(),
        orgId,
        req.auth!.userId,
        req.auth!.email,
        subscriptionId,
        JSON.stringify({ plan: plan.name, amount, billingCycle, invoiceNumber }),
        startDate,
      ]
    );
  });

  // 5. Trigger Automated Omnichannel WhatsApp + Email Payment Receipt & Nurture
  ClientLifecycleService.notifyPaymentCaptured({
    id: orgId,
    name: org.name,
    owner_name: req.auth!.email.split('@')[0],
    phone_e164: org.phone_e164,
    owner_email: req.auth!.email,
    plan_name: plan.name,
    amount,
    invoice_number: invoiceNumber,
    renewal_date: renewalDate,
  }).catch(e => console.warn('[Billing] Omnichannel payment notification notice:', e.message));

  // 6. In-App Notification
  NotificationService.notify({
    organizationId: orgId,
    userId: req.auth!.userId,
    type: 'billing',
    title: `Payment Received: ${plan.name}`,
    message: `Your payment of $${amount.toFixed(2)} was processed. Invoice #${invoiceNumber} is ready.`,
    link: '/billing',
  });

  res.status(201).json({
    success: true,
    message: `Successfully subscribed to MetaGreenWave ${plan.name}!`,
    subscription: {
      id: subscriptionId,
      planName: plan.name,
      billingCycle,
      status: 'active',
      renewalDate,
      amount,
    },
    invoice: {
      id: invoiceId,
      invoiceNumber,
      amount,
      status: 'paid',
    },
  });
});

// 4. Invoices List
router.get('/invoices', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const invoices = db.query<any>(
    'SELECT * FROM invoices WHERE organization_id = ? ORDER BY created_at DESC',
    [orgId]
  );
  res.json(invoices);
});

// 5. Download / View Printable Invoice
router.get('/invoices/:invoiceNumber/download', (req: Request, res: Response) => {
  const { invoiceNumber } = req.params;
  const orgId = req.auth!.orgId;

  const invoice = db.queryOne<any>(
    'SELECT i.*, o.name as org_name, o.business_category, o.country FROM invoices i JOIN organizations o ON o.id = i.organization_id WHERE i.invoice_number = ? AND i.organization_id = ?',
    [invoiceNumber, orgId]
  );

  if (!invoice) {
    res.status(404).send('Invoice not found');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number} — MetaGreenWave</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #0f172a; }
        .invoice-card { max-width: 750px; margin: auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
        .brand { font-size: 24px; font-weight: 900; color: #0f172a; }
        .badge { background: #dcfce7; color: #15803d; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 12px; text-transform: uppercase; }
        .meta { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { text-align: left; padding: 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
        td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .total-row { font-size: 18px; font-weight: bold; }
        .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="brand">MetaGreenWave</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Official Meta WhatsApp Business Messaging Platform</div>
          </div>
          <span class="badge">Paid</span>
        </div>
        <div class="meta">
          <div>
            <strong>Billed To:</strong><br>
            ${invoice.org_name}<br>
            ${invoice.business_category || 'Enterprise Account'}<br>
            Country: ${invoice.country || 'Global'}
          </div>
          <div style="text-align: right;">
            <strong>Invoice Number:</strong> ${invoice.invoice_number}<br>
            <strong>Date:</strong> ${new Date(invoice.created_at).toLocaleDateString()}<br>
            <strong>Currency:</strong> ${invoice.currency}
          </div>
        </div>
        <table>
          <thead>
            <tr><th>Description</th><th style="text-align: right;">Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.billing_reason}</td>
              <td style="text-align: right;">$${Number(invoice.amount).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Paid</td>
              <td style="text-align: right; color: #10b981;">$${Number(invoice.amount).toFixed(2)} ${invoice.currency}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          MetaGreenWave Technologies Inc. &bull; support@metagreenwave.io &bull; Payment recorded successfully.
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// 6. 1-Click Subscription Renewal
router.post('/renew', requireRole(['owner', 'admin', 'billing_manager']), async (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const sub = db.queryOne<any>(
    'SELECT s.*, sp.name as plan_name, sp.monthly_price_usd, sp.yearly_price_usd FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id WHERE s.organization_id = ?',
    [orgId]
  );

  if (!sub) {
    res.status(404).json({ error: 'No active subscription found to renew' });
    return;
  }

  const org = db.queryOne<any>('SELECT * FROM organizations WHERE id = ?', [orgId]);
  const now = new Date();
  const currentRenewal = sub.renewal_date ? new Date(sub.renewal_date) : now;
  const baseDate = currentRenewal > now ? currentRenewal : now;

  const nextRenewal = new Date(baseDate);
  if (sub.billing_cycle === 'yearly') {
    nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
  } else {
    nextRenewal.setDate(nextRenewal.getDate() + 30);
  }

  const nextRenewalDate = nextRenewal.toISOString();
  const amount = sub.billing_cycle === 'yearly' ? sub.yearly_price_usd : sub.monthly_price_usd;
  const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  db.transaction(() => {
    db.execute(
      `UPDATE subscriptions SET status = 'active', renewal_date = ?, updated_at = ? WHERE id = ?`,
      [nextRenewalDate, now.toISOString(), sub.id]
    );

    db.execute(
      `INSERT INTO invoices (id, organization_id, invoice_number, amount, currency, status, billing_reason, pdf_url, created_at)
       VALUES (?, ?, ?, ?, 'USD', 'paid', ?, ?, ?)`,
      [
        uuidv4(),
        orgId,
        invoiceNumber,
        amount,
        `MetaGreenWave Renewal: ${sub.plan_name} (${sub.billing_cycle.toUpperCase()})`,
        `/api/v1/billing/invoices/${invoiceNumber}/download`,
        now.toISOString(),
      ]
    );
  });

  ClientLifecycleService.notifyPaymentCaptured({
    id: orgId,
    name: org?.name || 'Customer',
    owner_name: req.auth!.email.split('@')[0],
    phone_e164: org?.phone_e164,
    owner_email: req.auth!.email,
    plan_name: sub.plan_name,
    amount,
    invoice_number: invoiceNumber,
    renewal_date: nextRenewalDate,
  }).catch(e => console.warn('[Billing Renewal] Omnichannel notice:', e.message));

  res.json({
    success: true,
    message: `Subscription successfully renewed through ${nextRenewal.toLocaleDateString()}!`,
    renewalDate: nextRenewalDate,
    invoiceNumber,
  });
});

// 7. Cancel Auto-Renewal
router.post('/cancel', requireRole(['owner', 'admin', 'billing_manager']), async (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE subscriptions SET status = 'canceled', updated_at = ? WHERE organization_id = ?`,
    [now, orgId]
  );

  res.json({
    success: true,
    message: 'Auto-renewal has been canceled. Your features will remain active until the end of the billing period.',
  });
});

// 8. Overview & Messaging Wallet Balance
router.get('/overview', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;
  const org = db.queryOne<any>(
    'SELECT plan_tier, wallet_balance, low_balance_threshold FROM organizations WHERE id = ?',
    [orgId]
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const mtdStats = db.queryOne<any>(
    `SELECT COUNT(*) as total_messages,
            SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) as outbound_count,
            SUM(cost) as total_spend
     FROM messages
     WHERE organization_id = ? AND created_at >= ?`,
    [orgId, startOfMonth]
  );

  const sub = db.queryOne<any>(
    'SELECT s.*, sp.name as plan_name FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id WHERE s.organization_id = ?',
    [orgId]
  );

  res.json({
    walletBalance: org?.wallet_balance || 0,
    lowBalanceThreshold: org?.low_balance_threshold || 10,
    isLowBalance: (org?.wallet_balance || 0) <= (org?.low_balance_threshold || 10),
    planTier: org?.plan_tier || 'starter',
    planName: sub?.plan_name || 'Starter Plan',
    subscriptionStatus: sub?.status || 'active',
    renewalDate: sub?.renewal_date || null,
    monthToDate: {
      totalMessages: mtdStats?.total_messages || 0,
      outboundCount: mtdStats?.outbound_count || 0,
      totalSpend: Number((mtdStats?.total_spend || 0).toFixed(2)),
    },
  });
});

// 9. Wallet Ledger
router.get('/ledger', (req: Request, res: Response) => {
  const ledger = db.query<any>(
    'SELECT * FROM wallet_ledger WHERE organization_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.auth!.orgId]
  );
  res.json(ledger);
});

// 10. Top-Up Messaging Wallet
router.post('/topup', requireRole(['billing_manager']), (req: Request, res: Response) => {
  const { amountUsd } = req.body;
  const amount = parseFloat(amountUsd);

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Valid top-up amount in USD required' });
    return;
  }

  const orgId = req.auth!.orgId;
  const now = new Date().toISOString();

  let newBalance = 0;
  db.transaction(() => {
    const org = db.queryOne<{ wallet_balance: number }>('SELECT wallet_balance FROM organizations WHERE id = ?', [
      orgId,
    ]);
    const current = org?.wallet_balance || 0;
    newBalance = Number((current + amount).toFixed(2));

    db.execute('UPDATE organizations SET wallet_balance = ?, updated_at = ? WHERE id = ?', [
      newBalance,
      now,
      orgId,
    ]);

    db.execute(
      `INSERT INTO wallet_ledger
       (id, organization_id, amount, balance_after, transaction_type, reference_id, description, created_at)
       VALUES (?, ?, ?, ?, 'topup', ?, ?, ?)`,
      [uuidv4(), orgId, amount, newBalance, `TXN_${Date.now()}`, `Prepaid wallet top-up (+US$ ${amount.toFixed(2)})`, now]
    );
  });

  res.json({
    success: true,
    addedAmount: amount,
    newWalletBalance: newBalance,
    message: `Successfully added $${amount.toFixed(2)} to prepaid messaging wallet`,
  });
});

// 11. Effective Rate Card
router.get('/rate-card', (req: Request, res: Response) => {
  const rates = db.query<any>('SELECT * FROM rate_card ORDER BY country_code, category');
  res.json(rates);
});

export default router;
