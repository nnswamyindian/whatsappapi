// Enterprise E2E Test Suite for MetaGreenWave
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING METAGREENWAVE ENTERPRISE E2E VERIFICATION ---');

  // 1. Health check
  console.log('[1/8] Verifying Platform Health API...');
  const health = await request('/health');
  assert.strictEqual(health.status, 200, 'Health endpoint should return 200');
  assert.strictEqual(health.data.status, 'ok', 'Health status should be ok');
  console.log('✅ Health API is operational: status=ok');

  // 2. Tenant Registration (Real Client Business)
  const testEmail = `tenant_${Date.now()}@apexretail.com`;
  const testPhone = '+919876543210';
  console.log(`[2/8] Registering New Business Tenant (${testEmail})...`);
  const regRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      businessName: 'Apex Omnichannel Retail',
      fullName: 'Vikram Malhotra',
      email: testEmail,
      phone: testPhone,
      country: 'IN',
      businessCategory: 'Retail & E-commerce',
      website: 'https://apexretail.example.com',
      intendedUsage: 'High volume marketing broadcasts and customer service',
      password: 'SecurePassword#2025',
    }),
  });
  assert.strictEqual(regRes.status, 201, 'Registration should return 201 Created');
  assert.strictEqual(regRes.data.organization?.approvalStatus, 'PENDING_APPROVAL', 'Tenant must require approval');
  console.log(`✅ Tenant registered. Organization ID: ${regRes.data.organization?.id}`);

  // 3. Super Admin Login & Application Approval
  console.log('[3/8] Authenticating as Super Admin to review & approve tenant...');
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@greenwave.io',
      password: 'GreenWave#2025',
    }),
  });
  assert.strictEqual(adminLogin.status, 200);
  const adminToken = adminLogin.data.token;
  assert.ok(adminToken);

  // Find application ID
  const appsRes = await request('/admin/applications?status=PENDING_APPROVAL', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(appsRes.status, 200);
  const targetApp = appsRes.data.find(a => a.email === testEmail || a.organization_id === regRes.data.organization.id);
  assert.ok(targetApp, 'Application must be found in review queue');

  const approveRes = await request(`/admin/applications/${targetApp.id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      notes: 'Verified business registration and GSTIN certificate.',
    }),
  });
  assert.strictEqual(approveRes.status, 200);
  console.log('✅ Super Admin approved tenant application. WhatsApp & Email onboarding link dispatched.');

  // 4. Tenant Login to their Operational Dashboard
  console.log('[4/8] Logging into Tenant Workspace...');
  const tenantLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePassword#2025',
    }),
  });
  assert.strictEqual(tenantLogin.status, 200);
  const tenantToken = tenantLogin.data.token;
  assert.ok(tenantToken);
  console.log('✅ Tenant successfully authenticated and entered their workspace.');

  // 5. Tenant Initial Quota Check (Pre-checkout Free/Starter Tier)
  console.log('[5/8] Inspecting Tenant Initial Quotas & Tier...');
  const subRes = await request('/billing/subscription', {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  assert.strictEqual(subRes.status, 200);
  assert.strictEqual(subRes.data.planTier, 'starter', 'Initial tier is starter');
  assert.ok(subRes.data.quotas, 'Live quota consumption returned');
  console.log(`✅ Pre-checkout Tier: ${subRes.data.planTier.toUpperCase()}, Has Active Paid Sub: ${subRes.data.hasActiveSubscription}`);

  // 6. Tenant Checkout / Plan Upgrade Payment Capture
  console.log('[6/8] Capturing Payment for Enterprise Plan Upgrade...');
  const checkoutRes = await request('/billing/checkout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tenantToken}` },
    body: JSON.stringify({
      planId: 'enterprise',
      billingCycle: 'yearly',
      paymentMethod: 'card',
    }),
  });
  assert.strictEqual(checkoutRes.status, 201);
  assert.strictEqual(checkoutRes.data.success, true);
  const invoiceNumber = checkoutRes.data.invoice?.invoiceNumber;
  assert.ok(invoiceNumber, 'Invoice number must be generated');
  console.log(`✅ Payment captured: Invoice ${invoiceNumber}`);

  // Re-verify Subscription is now Active & Upgraded
  const subResAfter = await request('/billing/subscription', {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  assert.strictEqual(subResAfter.status, 200);
  assert.strictEqual(subResAfter.data.hasActiveSubscription, true);
  assert.strictEqual(subResAfter.data.subscription.planSlug, 'enterprise');
  console.log(`✅ Subscription Activated: ${subResAfter.data.subscription.planName} (${subResAfter.data.subscription.billingCycle})`);

  // Verify Printable Invoice
  const invoiceDownload = await request(`/billing/invoices/${invoiceNumber}/download`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
  });
  assert.strictEqual(invoiceDownload.status, 200);
  assert.ok(invoiceDownload.data.includes('MetaGreenWave'));
  assert.ok(invoiceDownload.data.includes('Paid'));
  console.log('✅ Tax Invoice download verified: Official MetaGreenWave branding with PAID badge.');

  // 7. Super Admin Revenue Hub (MRR, ARR, Client Subscriptions)
  console.log('[7/8] Verifying Super Admin Revenue Hub & MRR Tracking...');
  const adminSubs = await request('/admin/subscriptions', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(adminSubs.status, 200);
  assert.ok(adminSubs.data.metrics.mrr > 0, 'MRR should be positive');
  assert.ok(adminSubs.data.metrics.arr > 0, 'ARR should be positive');
  const foundClient = adminSubs.data.subscriptions.find(c => c.organization_id === regRes.data.organization.id);
  assert.ok(foundClient, 'Newly upgraded client must appear in Super Admin revenue hub');
  assert.strictEqual(foundClient.current_tier, 'enterprise', 'Client tier reflected as enterprise');
  console.log(`✅ Super Admin Revenue: MRR=$${adminSubs.data.metrics.mrr}, ARR=$${adminSubs.data.metrics.arr}, Active Paid Clients=${adminSubs.data.metrics.activePaidClients}`);
  console.log(`✅ Client Verified in Super Admin list: ${foundClient.org_name} (${foundClient.current_tier.toUpperCase()})`);

  // 8. Super Admin Omnichannel Lifecycle Engine (Playbooks, Festivals & Dispatches)
  console.log('[8/8] Testing Omnichannel In-Subscription Marketing Playbooks & Festival Greetings...');
  const nurtureRes = await request('/admin/lifecycle/send-nurture', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      playbookId: 1,
    }),
  });
  assert.strictEqual(nurtureRes.status, 200);
  assert.strictEqual(nurtureRes.data.success, true);
  console.log(`✅ Marketing Playbook Broadcast: ${nurtureRes.data.message}`);

  const festivalRes = await request('/admin/lifecycle/send-festival', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      festivalName: 'Diwali',
    }),
  });
  assert.strictEqual(festivalRes.status, 200);
  assert.strictEqual(festivalRes.data.success, true);
  console.log(`✅ Festival Wishes Broadcast: ${festivalRes.data.message}`);

  const dispatchesRes = await request('/admin/lifecycle/dispatches', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(dispatchesRes.status, 200);
  assert.ok(Array.isArray(dispatchesRes.data), 'Dispatches array returned');
  assert.ok(dispatchesRes.data.length >= 3, 'All lifecycle events logged in audit table');
  console.log(`✅ Omnichannel Audit Log: ${dispatchesRes.data.length} recorded events in lifecycle_dispatches.`);

  console.log('\n======================================================');
  console.log('🎉 ALL METAGREENWAVE ENTERPRISE E2E CHECKS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('❌ E2E Test Failure:', err);
  process.exit(1);
});
