import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authMiddleware);

// Get Billing Overview (Wallet Balance, Active Plan, Usage Breakdown)
router.get('/overview', (req: Request, res: Response) => {
  const orgId = req.auth!.orgId;

  const org = db.queryOne<any>(
    'SELECT plan_tier, wallet_balance, low_balance_threshold FROM organizations WHERE id = ?',
    [orgId]
  );

  // Month-to-date message count & spend
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

  const planEntitlements: Record<string, any> = {
    starter: { name: 'Starter Plan', priceMonthlyUsd: 29, includedUsers: 3, phoneLimit: 1, rateTier: 'Standard' },
    growth: { name: 'Growth Business', priceMonthlyUsd: 79, includedUsers: 10, phoneLimit: 3, rateTier: 'Volume Discount' },
    enterprise: { name: 'Enterprise Dedicated', priceMonthlyUsd: 249, includedUsers: 50, phoneLimit: 10, rateTier: 'Custom Enterprise' },
  };

  const currentPlan = planEntitlements[org?.plan_tier || 'starter'] || planEntitlements.starter;
  const isLowBalance = (org?.wallet_balance || 0) <= (org?.low_balance_threshold || 10);

  res.json({
    walletBalance: org?.wallet_balance || 0,
    lowBalanceThreshold: org?.low_balance_threshold || 10,
    isLowBalance,
    planTier: org?.plan_tier || 'starter',
    planDetails: currentPlan,
    monthToDate: {
      totalMessages: mtdStats?.total_messages || 0,
      outboundCount: mtdStats?.outbound_count || 0,
      totalSpend: Number((mtdStats?.total_spend || 0).toFixed(2)),
    },
  });
});

// Get Wallet Transaction Ledger
router.get('/ledger', (req: Request, res: Response) => {
  const ledger = db.query<any>(
    'SELECT * FROM wallet_ledger WHERE organization_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.auth!.orgId]
  );
  res.json(ledger);
});

// Top-Up Wallet (Prepaid Messaging Credit)
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

// Effective Rate Card
router.get('/rate-card', (req: Request, res: Response) => {
  const rates = db.query<any>('SELECT * FROM rate_card ORDER BY country_code, category');
  res.json(rates);
});

export default router;
