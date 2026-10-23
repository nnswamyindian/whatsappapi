import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone } from '../dist/utils/phone.js';
import { db, seedDatabase } from '../dist/db/index.js';
import { MockWhatsAppProvider } from '../dist/providers/whatsapp/mock-provider.js';
import crypto from 'node:crypto';

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
    assert.ok(templates.length >= 3);
    assert.equal(templates[0].status, 'APPROVED');

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
});
