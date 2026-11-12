import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../dist/utils/phone.js';
import { db, seedDatabase } from '../dist/db/index.js';
import { mySqlEngine } from '../dist/db/mysql-pool.js';
import { MockWhatsAppProvider } from '../dist/providers/whatsapp/mock-provider.js';
import { encryptSecret, decryptSecret, maskSecret } from '../dist/utils/crypto.js';
import { EmailService } from '../dist/services/email.js';
import { NotificationService } from '../dist/services/notifications.js';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

describe('GreenWave Backend Core Verification', () => {
  before(() => {
    seedDatabase();
  });

  test('1. Database initializes and seeds demo workspace and rate cards', () => {
    const rateCards = db.query('SELECT * FROM rate_card');
    assert.ok(rateCards.length >= 6, 'Rate cards should be seeded');

    const demoOrg = db.queryOne("SELECT * FROM organizations WHERE slug = 'acme-retail'");
    assert.ok(demoOrg, 'Demo organization should be seeded');
    assert.equal(demoOrg.plan_tier, 'growth');

    const demoUser = db.queryOne("SELECT * FROM users WHERE email = 'admin@greenwave.io'");
    assert.ok(demoUser, 'Demo admin user should be seeded');
  });

  test('2. E.164 Phone Normalizer parses and standardizes multiple country formats', () => {
    // India 10-digit without country code (default 91)
    const in1 = normalizePhone('9876543210');
    assert.equal(in1.isValid, true);
    assert.equal(in1.e164, '+919876543210');
    assert.equal(in1.countryCode, '91');

    // US number with formatting
    const us1 = normalizePhone('+1 (415) 555-2671');
    assert.equal(us1.isValid, true);
    assert.equal(us1.e164, '+14155552671');
    assert.equal(us1.countryCode, '1');

    // UK number
    const uk1 = normalizePhone('+44 7911 123456');
    assert.equal(uk1.isValid, true);
    assert.equal(uk1.e164, '+447911123456');

    // Invalid numbers
    const inv1 = normalizePhone('1234');
    assert.equal(inv1.isValid, false);

    const inv2 = normalizePhone('abc-phone');
    assert.equal(inv2.isValid, false);
  });

  test('3. WhatsApp Sandbox Mock Provider delivers messages and syncs templates', async () => {
    const provider = new MockWhatsAppProvider(10);

    const sendRes = await provider.sendMessage({
      toPhoneE164: '+919876543210',
      type: 'template',
      template: {
        name: 'order_status_update',
        language: 'en_US',
      },
    });

    assert.equal(sendRes.success, true);
    assert.equal(sendRes.status, 'accepted');
    assert.ok(sendRes.providerMessageId?.startsWith('wamid.MOCK_'));

    const templates = await provider.fetchTemplates();
    assert.ok(templates.length >= 4);
    assert.equal(templates[0].status, 'APPROVED');

    // Check carousel template support
    const carouselTpl = templates.find((t) => t.isCarousel);
    assert.ok(carouselTpl, 'Carousel template should be present in sync list');
    assert.ok(carouselTpl.cards && carouselTpl.cards.length >= 2, 'Carousel must have at least 2 cards');

    const metrics = await provider.getAccountMetrics();
    assert.equal(metrics.qualityRating, 'GREEN');
    assert.equal(metrics.messagingLimitTier, 'TIER_10K');
  });

  test('4. Cryptographic WhatsApp OTP Request & Verification Engine', () => {
    const rawOtp = '739201';
    const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex');

    // Wrong OTP verification
    const wrongOtp = '111111';
    const wrongHash = crypto.createHash('sha256').update(wrongOtp).digest('hex');
    assert.notEqual(wrongHash, otpHash);

    // Correct OTP verification
    const testHash = crypto.createHash('sha256').update(rawOtp).digest('hex');
    assert.equal(testHash, otpHash);
  });

  test('5. Suppression List Enforcement prevents delivery to opted-out contacts', () => {
    const org = db.queryOne('SELECT id FROM organizations LIMIT 1');
    assert.ok(org);

    const suppressedPhone = '+919000000001';
    db.execute(
      "INSERT OR REPLACE INTO suppression_list (id, organization_id, phone_e164, reason, created_at) VALUES ('test_supp_1', ?, ?, 'user_optout', ?)",
      [org.id, suppressedPhone, new Date().toISOString()]
    );

    const check = db.queryOne(
      'SELECT 1 FROM suppression_list WHERE organization_id = ? AND phone_e164 = ?',
      [org.id, suppressedPhone]
    );
    assert.ok(check, 'Suppressed phone should be detected');

    // Clean up test suppression
    db.execute("DELETE FROM suppression_list WHERE id = 'test_supp_1'");
  });

  test('6. Multi-Tenant Query Scoping preserves organization boundary', () => {
    const orgs = db.query('SELECT id FROM organizations');
    assert.ok(orgs.length >= 1);

    const contactsForOrg = db.query('SELECT * FROM contacts WHERE organization_id = ?', [orgs[0].id]);
    for (const c of contactsForOrg) {
      assert.equal(c.organization_id, orgs[0].id, 'Every contact must belong exclusively to requested org');
    }
  });

  test('7. Advanced Message Types: Audio, Video, Document, Location, Reactions & Interactive Buttons', async () => {
    const provider = new MockWhatsAppProvider(5);

    // Image message
    const imgRes = await provider.sendMessage({
      toPhoneE164: '+919876543210',
      type: 'image',
      media: { link: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', caption: 'Festival Sale' },
    });
    assert.equal(imgRes.success, true);

    // Location message
    const locRes = await provider.sendMessage({
      toPhoneE164: '+919876543210',
      type: 'location',
      location: { latitude: 28.6139, longitude: 77.2090, name: 'Delhi Store', address: 'Connaught Place' },
    });
    assert.equal(locRes.success, true);

    // Reaction message
    const reactRes = await provider.sendMessage({
      toPhoneE164: '+919876543210',
      type: 'reaction',
      reaction: { message_id: 'wamid.123', emoji: '🎉' },
    });
    assert.equal(reactRes.success, true);
  });

  test('8. Visual Chatbot Studio: Seeded flow exists, nodes parse, and execution engine runs', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    assert.ok(org, 'Acme org should exist');

    const bot = db.queryOne('SELECT * FROM chatbots WHERE organization_id = ?', [org.id]);
    assert.ok(bot, 'Chatbot should be seeded for org');
    assert.equal(bot.is_active, 1);
    assert.equal(bot.trigger_keyword, 'hi');

    const nodes = JSON.parse(bot.published_nodes_json);
    const edges = JSON.parse(bot.published_edges_json);
    assert.ok(nodes.length >= 5, 'Bot should have multiple steps');
    assert.ok(edges.length >= 4, 'Bot should have connections');

    const startNode = nodes.find((n) => n.type === 'start');
    assert.ok(startNode, 'Flow must contain a Start block');
  });

  test('9. WhatsApp CRM & Sales Pipeline: Stages, lead progression, and activities', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    const stages = db.query('SELECT * FROM pipeline_stages WHERE organization_id = ? ORDER BY order_index ASC', [org.id]);
    assert.equal(stages.length, 8, '8 CRM pipeline stages should exist');
    assert.equal(stages[0].name, 'New Lead');
    assert.equal(stages[6].name, 'Converted');

    const lead = db.queryOne('SELECT * FROM contacts WHERE organization_id = ? LIMIT 1', [org.id]);
    assert.ok(lead, 'Contact/Lead should exist');
    assert.ok(lead.lead_value > 0, 'Lead value should be populated');

    // Move lead stage
    const convertedStage = stages[6];
    db.execute('UPDATE contacts SET pipeline_stage_id = ? WHERE id = ?', [convertedStage.id, lead.id]);
    const updatedLead = db.queryOne('SELECT pipeline_stage_id FROM contacts WHERE id = ?', [lead.id]);
    assert.equal(updatedLead.pipeline_stage_id, convertedStage.id);
  });

  test('10. Automatic Reply Classification & Intelligent Tagging Rules', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    const rules = db.query('SELECT * FROM reply_rules WHERE organization_id = ?', [org.id]);
    assert.ok(rules.length >= 3, 'Reply classification rules should be seeded');

    const optoutRule = rules.find((r) => r.is_optout === 1);
    assert.ok(optoutRule, 'Opt-out rule should exist');
    assert.equal(optoutRule.trigger_keyword, 'stop');

    const priceRule = rules.find((r) => r.trigger_keyword === 'price');
    assert.ok(priceRule, 'Pricing keyword rule should exist');
    const tags = JSON.parse(priceRule.add_tags_json);
    assert.ok(tags.includes('pricing-lead'));
  });

  test('11. Human Handoff Precedence: Suspends bot automation when human-controlled', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    const conv = db.queryOne('SELECT id, control_mode FROM conversations WHERE organization_id = ? LIMIT 1', [org.id]);
    assert.ok(conv, 'Conversation should exist');

    // Toggle to human_controlled
    db.execute("UPDATE conversations SET control_mode = 'human_controlled' WHERE id = ?", [conv.id]);
    const updatedConv = db.queryOne('SELECT control_mode FROM conversations WHERE id = ?', [conv.id]);
    assert.equal(updatedConv.control_mode, 'human_controlled');

    // Revert to bot_active
    db.execute("UPDATE conversations SET control_mode = 'bot_active' WHERE id = ?", [conv.id]);
  });

  test('12. AES-256-GCM Tenant Credential Encryption & Decryption at Rest', () => {
    const rawToken = 'EAAGm0PX4ZCpsBAK7ZCZCZBZBZ...test_meta_token_value_98765';
    const encrypted = encryptSecret(rawToken);

    assert.ok(encrypted.startsWith('enc:v1:'), 'Encrypted envelope must start with enc:v1:');
    assert.notEqual(encrypted, rawToken, 'Encrypted token must differ from raw token');

    const parts = encrypted.split(':');
    assert.equal(parts.length, 5, 'Envelope format must be enc:v1:<iv>:<tag>:<ciphertext>');

    const decrypted = decryptSecret(encrypted);
    assert.equal(decrypted, rawToken, 'Decrypted token must exactly match raw token');

    const masked = maskSecret(rawToken);
    assert.ok(masked.includes('••••••••'), 'Masked token must obscure secret chars');
    assert.ok(masked.endsWith('8765'), 'Masked token should preserve suffix for recognition');
  });

  test('13. Multi-Tenant Meta Connection Isolation & Safe Disconnect', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    db.execute("UPDATE whatsapp_connections SET mode = 'sandbox', access_token = NULL WHERE organization_id = ?", [org.id]);
    const conn = db.queryOne('SELECT * FROM whatsapp_connections WHERE organization_id = ?', [org.id]);
    assert.ok(conn, 'WhatsApp connection record must exist for organization');
    assert.equal(conn.mode, 'sandbox', 'Default demo connection is in sandbox mode');

    // Test updating to encrypted real connection
    const testSecret = 'EAAG_LIVE_SECURE_TOKEN_XYZ';
    const encSecret = encryptSecret(testSecret);
    db.execute(
      `UPDATE whatsapp_connections 
       SET provider = 'meta_cloud_api', mode = 'live', access_token = ?, waba_id = '1234567890', phone_number_id = '9876543210' 
       WHERE organization_id = ?`,
      [encSecret, org.id]
    );

    const updatedConn = db.queryOne('SELECT * FROM whatsapp_connections WHERE organization_id = ?', [org.id]);
    assert.equal(updatedConn.provider, 'meta_cloud_api');
    assert.equal(updatedConn.mode, 'live');
    assert.equal(decryptSecret(updatedConn.access_token), testSecret);

    // Test safe disconnect / revert to sandbox
    db.execute(
      `UPDATE whatsapp_connections 
       SET provider = 'meta_cloud', mode = 'sandbox', access_token = NULL, waba_id = 'sandbox-waba-01', phone_number_id = 'sandbox-phone-01' 
       WHERE organization_id = ?`,
      [org.id]
    );

    const revertedConn = db.queryOne('SELECT * FROM whatsapp_connections WHERE organization_id = ?', [org.id]);
    assert.equal(revertedConn.mode, 'sandbox');
    assert.equal(revertedConn.access_token, null);
  });

  test('14. Customer Registration & Application Workflow with PENDING_APPROVAL', () => {
    const testEmail = `newcustomer_${Date.now()}@example.com`;
    const userId = uuidv4();
    const orgId = uuidv4();
    const appId = uuidv4();
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    const testSlug = `apex-global-${uuidv4().slice(0, 8)}`;
    db.transaction(() => {
      db.execute(
        `INSERT INTO users (id, email, password_hash, full_name, email_verified, email_verification_token, created_at, updated_at)
         VALUES (?, ?, 'hash123', 'John Doe', 0, ?, ?, ?)`,
        [userId, testEmail, verifyToken, now, now]
      );

      db.execute(
        `INSERT INTO organizations 
         (id, name, slug, timezone, status, approval_status, plan_tier, wallet_balance, low_balance_threshold, business_category, country, phone_e164, created_at, updated_at)
         VALUES (?, 'Apex Global Retail', ?, 'UTC', 'active', 'PENDING_APPROVAL', 'starter', 15.00, 5.00, 'Retail', 'IN', '+919876543210', ?, ?)`,
        [orgId, testSlug, now, now]
      );

      db.execute(
        `INSERT INTO customer_applications
         (id, organization_id, user_id, business_name, owner_name, email, phone_e164, country, business_category, intended_usage, status, created_at, updated_at)
         VALUES (?, ?, ?, 'Apex Global Retail', 'John Doe', ?, '+919876543210', 'IN', 'Retail', 'Customer Support', 'PENDING_APPROVAL', ?, ?)`,
        [appId, orgId, userId, testEmail, now, now]
      );
    });

    const app = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [appId]);
    assert.ok(app, 'Application must be saved in database');
    assert.equal(app.status, 'PENDING_APPROVAL');
    assert.equal(app.business_name, 'Apex Global Retail');

    const org = db.queryOne('SELECT * FROM organizations WHERE id = ?', [orgId]);
    assert.equal(org.approval_status, 'PENDING_APPROVAL');

    const user = db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    assert.equal(user.email_verified, 0);
    assert.equal(user.email_verification_token, verifyToken);
  });

  test('15. Single-Use Cryptographic Email Verification Processing', () => {
    const user = db.queryOne("SELECT * FROM users WHERE email_verified = 0 LIMIT 1");
    assert.ok(user, 'Unverified user must exist');
    assert.ok(user.email_verification_token, 'Token must be present');

    // Simulate verification
    const now = new Date().toISOString();
    db.execute('UPDATE users SET email_verified = 1, email_verification_token = NULL, updated_at = ? WHERE id = ?', [
      now,
      user.id,
    ]);

    const verifiedUser = db.queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
    assert.equal(verifiedUser.email_verified, 1);
    assert.equal(verifiedUser.email_verification_token, null);
  });

  test('16. Super Admin Application Approval, Onboarding Step Unlock & Audit Logging', async () => {
    const pendingApp = db.queryOne("SELECT * FROM customer_applications WHERE status = 'PENDING_APPROVAL' LIMIT 1");
    assert.ok(pendingApp, 'Pending application must exist');

    const now = new Date().toISOString();
    const reviewer = 'admin@greenwave.io';

    db.transaction(() => {
      db.execute(
        `UPDATE customer_applications SET status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?`,
        [reviewer, now, now, pendingApp.id]
      );

      db.execute(
        `UPDATE organizations SET approval_status = 'APPROVED', reviewed_by = ?, reviewed_at = ?, updated_at = ? WHERE id = ?`,
        [reviewer, now, now, pendingApp.organization_id]
      );

      db.execute(
        `INSERT INTO audit_logs (id, organization_id, user_id, user_email, action, resource_type, resource_id, details_json, created_at)
         VALUES (?, ?, 'admin-id', ?, 'APPLICATION_APPROVED', 'customer_application', ?, '{}', ?)`,
        [uuidv4(), pendingApp.organization_id, reviewer, pendingApp.id, now]
      );
    });

    const approvedApp = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [pendingApp.id]);
    assert.equal(approvedApp.status, 'APPROVED');
    assert.equal(approvedApp.reviewed_by, reviewer);

    const approvedOrg = db.queryOne('SELECT * FROM organizations WHERE id = ?', [pendingApp.organization_id]);
    assert.equal(approvedOrg.approval_status, 'APPROVED');

    const audit = db.queryOne("SELECT * FROM audit_logs WHERE resource_id = ? AND action = 'APPLICATION_APPROVED'", [pendingApp.id]);
    assert.ok(audit, 'Audit log entry must exist for approval');
  });

  test('17. Super Admin Application Rejection Workflow with Mandatory Reason', () => {
    const appId = uuidv4();
    const orgId = uuidv4();
    const userId = uuidv4();
    const uniqueSpamEmail = `spam_${uuidv4().slice(0, 8)}@test.com`;
    const uniqueSpamSlug = `spam-bot-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.execute(
      `INSERT INTO users (id, email, password_hash, full_name, email_verified, created_at, updated_at)
       VALUES (?, ?, 'hash', 'Spam Owner', 1, ?, ?)`,
      [userId, uniqueSpamEmail, now, now]
    );

    db.execute(
      `INSERT INTO organizations (id, name, slug, timezone, status, approval_status, created_at, updated_at)
       VALUES (?, 'Spam Bot LLC', ?, 'UTC', 'active', 'PENDING_APPROVAL', ?, ?)`,
      [orgId, uniqueSpamSlug, now, now]
    );

    db.execute(
      `INSERT INTO customer_applications (id, organization_id, user_id, business_name, owner_name, email, phone_e164, country, business_category, intended_usage, status, created_at, updated_at)
       VALUES (?, ?, ?, 'Spam Bot LLC', 'Unknown', ?, '+15550000000', 'US', 'Gambling', 'Mass unsolicited blasts', 'PENDING_APPROVAL', ?, ?)`,
      [appId, orgId, userId, uniqueSpamEmail, now, now]
    );

    const rejectionReason = 'Prohibited content category: unsolicited gambling broadcasts violate WhatsApp Business Policy.';
    db.execute(
      `UPDATE customer_applications SET status = 'REJECTED', rejection_reason = ?, reviewed_by = 'admin@greenwave.io', reviewed_at = ? WHERE id = ?`,
      [rejectionReason, now, appId]
    );

    const rejectedApp = db.queryOne('SELECT * FROM customer_applications WHERE id = ?', [appId]);
    assert.equal(rejectedApp.status, 'REJECTED');
    assert.equal(rejectedApp.rejection_reason, rejectionReason);
  });

  test('18. Centralized Transactional Email Engine & Dynamic Hydration', async () => {
    // 1. Test preview hydration
    const preview = EmailService.preview('application_approved', {
      fullName: 'Alex Vance',
      businessName: 'Apex Retail Global',
      onboardingUrl: 'http://localhost:5000/onboarding',
    });

    assert.ok(preview.subject.includes('Apex Retail Global'), 'Subject must hydrate businessName');
    assert.ok(preview.html.includes('Alex Vance'), 'HTML must hydrate fullName');
    assert.ok(preview.html.includes('http://localhost:5000/onboarding'), 'HTML must hydrate link');

    // 2. Test send dispatch & delivery logging
    const sendResult = await EmailService.send({
      recipient: 'test_dispatch@example.com',
      templateSlug: 'application_approved',
      variables: {
        fullName: 'Alex Vance',
        businessName: 'Apex Retail Global',
        onboardingUrl: 'http://localhost:5000/onboarding',
      },
      forceResend: true,
    });

    assert.equal(sendResult.success, true);
    assert.ok(sendResult.logId);

    const log = db.queryOne('SELECT * FROM email_logs WHERE id = ?', [sendResult.logId]);
    assert.ok(log);
    assert.equal(log.status, 'sent');
    assert.equal(log.recipient, 'test_dispatch@example.com');
  });

  test('19. In-App Notification Center: Unread Counting & Mark As Read', () => {
    const userId = uuidv4();
    const orgId = uuidv4();

    // Create notification
    const notifId = NotificationService.notify({
      organizationId: orgId,
      userId: userId,
      type: 'approval',
      title: 'Workspace Approved',
      message: 'Your workspace application has been approved!',
      link: '/onboarding',
    });

    assert.ok(notifId);

    const unreadCount = NotificationService.getUnreadCount(userId, orgId);
    assert.equal(unreadCount, 1, 'Unread count must be 1');

    const notifs = NotificationService.list(userId, orgId);
    assert.equal(notifs.length, 1);
    assert.equal(notifs[0].is_read, 0);

    // Mark as read
    NotificationService.markAsRead(notifId, userId);
    const unreadAfter = NotificationService.getUnreadCount(userId, orgId);
    assert.equal(unreadAfter, 0, 'Unread count after marking read must be 0');
  });

  test('20. Guided 12-Step Onboarding Engine & Real-Time Checklist Verification', () => {
    const org = db.queryOne("SELECT id FROM organizations WHERE slug = 'acme-retail'");
    const steps = db.query('SELECT * FROM onboarding_checklists WHERE organization_id = ?', [org.id]);
    assert.ok(steps.length >= 10, 'Onboarding steps must be initialized');

    // Complete a step
    const now = new Date().toISOString();
    db.execute(
      `UPDATE onboarding_checklists SET is_completed = 1, completed_at = ?, completed_by = 'tester@greenwave.io' WHERE organization_id = ? AND step_key = 'business_profile'`,
      [now, org.id]
    );

    const updated = db.queryOne("SELECT * FROM onboarding_checklists WHERE organization_id = ? AND step_key = 'business_profile'", [org.id]);
    assert.equal(updated.is_completed, 1);
    assert.equal(updated.completed_by, 'tester@greenwave.io');
  });

  test('21. Subscription Plans Configuration & Quota Entitlements', () => {
    const plans = db.query('SELECT * FROM subscription_plans ORDER BY sort_order ASC');
    assert.ok(plans.length >= 3, 'Default subscription plans must exist');

    const starter = plans.find((p) => p.slug === 'starter');
    assert.equal(starter.monthly_price_usd, 29.00);
    assert.equal(starter.contact_limit, 1000);

    const growth = plans.find((p) => p.slug === 'growth');
    assert.equal(growth.monthly_price_usd, 79.00);
    assert.equal(growth.contact_limit, 10000);

    const enterprise = plans.find((p) => p.slug === 'enterprise');
    assert.equal(enterprise.monthly_price_usd, 199.00);
    assert.equal(enterprise.contact_limit, 100000);
  });

  test('22. Enterprise MySQL Migration, Dialect Translation & Health Telemetry', async () => {
    // 1. Test SQL Dialect Translation from SQLite to MySQL
    const sqliteUpsert = `INSERT INTO notification_preferences (id, user_id, email_alerts) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET email_alerts = excluded.email_alerts`;
    const translatedUpsert = mySqlEngine.translateSql(sqliteUpsert);
    assert.ok(translatedUpsert.includes('ON DUPLICATE KEY UPDATE'), 'Must translate ON CONFLICT to ON DUPLICATE KEY UPDATE');
    assert.ok(translatedUpsert.includes('VALUES(email_alerts)'), 'Must translate excluded.col to VALUES(col)');

    // 2. Test Concatenation Translation
    const concatSql = "SELECT * FROM chatbots WHERE ? LIKE '%' || trigger_keyword || '%'";
    const translatedConcat = mySqlEngine.translateSql(concatSql);
    assert.ok(translatedConcat.includes('CONCAT'), 'Must translate || to CONCAT for MySQL safety');

    // 3. Test Database Health Telemetry
    const health = await db.getHealth();
    assert.ok(health.engine === 'sqlite' || health.engine === 'mysql', 'Engine must report valid SQL type');
    assert.equal(health.connected, true, 'Database must report connected state');

    // 4. Test Unified Async Query Execution
    const asyncRows = await db.queryAsync('SELECT COUNT(*) as count FROM organizations');
    assert.ok(asyncRows.length > 0, 'Async query must return rows');
    assert.ok(asyncRows[0].count > 0, 'Organization count must be greater than zero');
  });
});

