import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { authMiddleware } from '../middleware/auth.js';
import { EmailService } from '../services/email.js';
import { NotificationService } from '../services/notifications.js';
import { normalizePhone } from '../utils/phone.js';

const router = Router();

// Register new business account & application
router.post('/register', async (req: Request, res: Response) => {
  const {
    businessName,
    fullName,
    email,
    phone,
    country = 'IN',
    businessCategory,
    website,
    businessAddress,
    intendedUsage,
    password,
    termsAccepted,
  } = req.body;

  if (!businessName || !fullName || !email || !password || !phone) {
    res.status(400).json({ error: 'Missing required registration fields' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = db.queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists' });
    return;
  }

  // Validate phone number
  const phoneNormalized = normalizePhone(phone, country);
  const phoneE164 = phoneNormalized.isValid ? phoneNormalized.e164 : phone.trim();

  const now = new Date().toISOString();
  const userId = uuidv4();
  const orgId = uuidv4();
  const applicationId = uuidv4();
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const passwordHash = bcrypt.hashSync(password, 10);
  const orgSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 32);

  try {
    db.transaction(() => {
      // 1. Create User
      db.execute(
        `INSERT INTO users (id, email, password_hash, full_name, is_platform_admin, email_verified, email_verification_token, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?)`,
        [userId, cleanEmail, passwordHash, fullName.trim(), emailVerificationToken, now, now]
      );

      // 2. Create Organization in PENDING_APPROVAL status
      db.execute(
        `INSERT INTO organizations 
         (id, name, slug, timezone, status, approval_status, plan_tier, wallet_balance, low_balance_threshold,
          business_category, country, website, business_address, intended_usage, phone_e164, created_at, updated_at)
         VALUES (?, ?, ?, 'UTC', 'active', 'PENDING_APPROVAL', 'starter', 15.00, 5.00, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orgId,
          businessName.trim(),
          `${orgSlug}-${Date.now().toString(36)}`,
          businessCategory || 'Retail & E-commerce',
          country,
          website || null,
          businessAddress || null,
          intendedUsage || 'Customer support and marketing campaigns',
          phoneE164,
          now,
          now,
        ]
      );

      // 3. Create Owner Membership
      db.execute(
        `INSERT INTO memberships (id, organization_id, user_id, role, created_at)
         VALUES (?, ?, ?, 'owner', ?)`,
        [uuidv4(), orgId, userId, now]
      );

      // 4. Create Customer Application Record
      db.execute(
        `INSERT INTO customer_applications
         (id, organization_id, user_id, business_name, owner_name, email, phone_e164, country, business_category, website, business_address, intended_usage, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?, ?)`,
        [
          applicationId,
          orgId,
          userId,
          businessName.trim(),
          fullName.trim(),
          cleanEmail,
          phoneE164,
          country,
          businessCategory || 'Retail',
          website || '',
          businessAddress || '',
          intendedUsage || '',
          now,
          now,
        ]
      );

      // 5. Initial Trial Wallet Ledger
      db.execute(
        `INSERT INTO wallet_ledger (id, organization_id, amount, balance_after, transaction_type, description, created_at)
         VALUES (?, ?, 15.00, 15.00, 'topup', 'Welcome promotional credit', ?)`,
        [uuidv4(), orgId, now]
      );

      // 6. Default Sandbox WhatsApp connection
      db.execute(
        `INSERT INTO whatsapp_connections (id, organization_id, provider, mode, quality_rating, messaging_limit_tier, status, created_at, updated_at)
         VALUES (?, ?, 'meta_cloud', 'sandbox', 'GREEN', 'TIER_1K', 'disconnected', ?, ?)`,
        [uuidv4(), orgId, now, now]
      );

      // 7. Initialize 12-Step Guided Onboarding Checklist
      const onboardingSteps = [
        'business_profile',
        'account_review',
        'whatsapp_embedded_signup',
        'meta_business_verification',
        'confirm_phone_number',
        'sync_templates',
        'import_contacts',
        'configure_team',
        'configure_roles',
        'create_test_campaign',
        'send_test_message',
        'complete_onboarding',
      ];
      for (const stepKey of onboardingSteps) {
        db.execute(
          `INSERT INTO onboarding_checklists (id, organization_id, step_key, is_completed, created_at)
           VALUES (?, ?, ?, 0, ?)`,
          [uuidv4(), orgId, stepKey, now]
        );
      }
    });

    // Send transactional emails
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:5000'}/verify-email?token=${emailVerificationToken}`;
    await EmailService.send({
      recipient: cleanEmail,
      templateSlug: 'registration_successful',
      variables: {
        fullName: fullName.trim(),
        businessName: businessName.trim(),
      },
    });

    await EmailService.send({
      recipient: cleanEmail,
      templateSlug: 'email_verification_required',
      variables: {
        fullName: fullName.trim(),
        verifyUrl,
      },
    });

    // Notify Super Admins
    NotificationService.notify({
      type: 'registration',
      title: 'New Customer Application',
      message: `${businessName} (${cleanEmail}) submitted a new platform registration.`,
      link: '/admin/applications',
    });

    const token = jwt.sign(
      { userId, email: cleanEmail, isPlatformAdmin: false },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful! Please verify your official email address.',
      token,
      verificationRequired: true,
      user: { id: userId, email: cleanEmail, fullName: fullName.trim(), isPlatformAdmin: false },
      organization: {
        id: orgId,
        name: businessName,
        role: 'owner',
        approvalStatus: 'PENDING_APPROVAL',
      },
    });
  } catch (err: any) {
    console.error('[Registration Error]:', err);
    res.status(500).json({ error: 'Failed to complete registration', details: err.message });
  }
});

// Email Verification Endpoint
router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Verification token required' });
    return;
  }

  const user = db.queryOne<any>('SELECT * FROM users WHERE email_verification_token = ?', [token]);
  if (!user) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }

  const now = new Date().toISOString();
  db.execute('UPDATE users SET email_verified = 1, email_verification_token = NULL, updated_at = ? WHERE id = ?', [
    now,
    user.id,
  ]);

  // Dispatch confirmation email
  await EmailService.send({
    recipient: user.email,
    templateSlug: 'email_verified',
    variables: {
      fullName: user.full_name,
      dashboardUrl: `${process.env.APP_URL || 'http://localhost:5000'}/application-status`,
    },
  });

  res.json({ success: true, message: 'Email verified successfully! Your application is now in review.' });
});

// Forgot Password Request
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = db.queryOne<any>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.execute('UPDATE users SET reset_password_token = ?, reset_password_expires_at = ? WHERE id = ?', [
      resetToken,
      expiresAt,
      user.id,
    ]);

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    await EmailService.send({
      recipient: cleanEmail,
      templateSlug: 'password_reset',
      variables: {
        fullName: user.full_name,
        resetUrl,
      },
    });
  }

  res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
});

// Reset Password
router.post('/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'Valid token and password of at least 8 characters required' });
    return;
  }

  const now = new Date().toISOString();
  const user = db.queryOne<any>(
    'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires_at > ?',
    [token, now]
  );

  if (!user) {
    res.status(400).json({ error: 'Password reset token is invalid or has expired' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, 10);
  db.execute(
    'UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires_at = NULL, updated_at = ? WHERE id = ?',
    [passwordHash, now, user.id]
  );

  res.json({ success: true, message: 'Password has been successfully reset. You may now log in.' });
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  const user = db.queryOne<any>('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  // Fetch user organizations with approval_status
  const memberships = db.query<any>(
    `SELECT m.role, o.id, o.name, o.slug, o.plan_tier, o.wallet_balance, o.approval_status,
            o.business_category, o.country, o.rejection_reason, o.info_requested_details
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ? AND o.status = 'active'`,
    [user.id]
  );

  const token = jwt.sign(
    { userId: user.id, email: user.email, isPlatformAdmin: !!user.is_platform_admin },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isPlatformAdmin: !!user.is_platform_admin,
      emailVerified: !!user.email_verified,
    },
    organizations: memberships,
    activeOrganization: memberships[0] || null,
  });
});

// Get Current User Profile & Memberships
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const user = db.queryOne<any>(
    'SELECT id, email, full_name, is_platform_admin, email_verified, created_at FROM users WHERE id = ?',
    [req.auth!.userId]
  );

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const memberships = db.query<any>(
    `SELECT m.role, o.id, o.name, o.slug, o.timezone, o.plan_tier, o.wallet_balance, o.approval_status,
            o.business_category, o.country, o.rejection_reason, o.info_requested_details
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     WHERE m.user_id = ? AND o.status = 'active'`,
    [user.id]
  );

  const activeOrg = memberships.find((m) => m.id === req.auth!.orgId) || memberships[0] || null;

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      isPlatformAdmin: !!user.is_platform_admin,
      emailVerified: !!user.email_verified,
    },
    organizations: memberships,
    activeOrganization: activeOrg,
  });
});

// Get Application Status for Current Workspace
router.get('/application-status', authMiddleware, (req: Request, res: Response) => {
  const org = db.queryOne<any>(
    `SELECT id, name, approval_status, business_category, country, website, business_address,
            intended_usage, phone_e164, rejection_reason, info_requested_details, created_at, updated_at
     FROM organizations WHERE id = ?`,
    [req.auth!.orgId]
  );

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  res.json(org);
});

// Resubmit Application with requested info
router.post('/application-resubmit', authMiddleware, (req: Request, res: Response) => {
  const { updatedInfo } = req.body;
  const orgId = req.auth!.orgId;
  const now = new Date().toISOString();

  db.execute(
    `UPDATE organizations 
     SET approval_status = 'PENDING_APPROVAL',
         info_submitted_details = ?,
         updated_at = ?
     WHERE id = ?`,
    [updatedInfo || '', now, orgId]
  );

  db.execute(
    `UPDATE customer_applications
     SET status = 'PENDING_APPROVAL',
         info_submitted_details = ?,
         updated_at = ?
     WHERE organization_id = ?`,
    [updatedInfo || '', now, orgId]
  );

  NotificationService.notify({
    type: 'approval',
    title: 'Application Resubmitted',
    message: `Workspace #${orgId} submitted updated information for review.`,
    link: '/admin/applications',
  });

  res.json({ success: true, message: 'Application updated and returned to the review queue.' });
});

export default router;
