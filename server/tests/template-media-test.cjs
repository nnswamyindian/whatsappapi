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

async function run() {
  console.log('--- TESTING TEMPLATE MEDIA UPLOADS ---');

  // 1. Authenticate as Tenant Admin
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@greenwave.io',
      password: 'GreenWave#2025',
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const token = loginRes.data.token;
  console.log('✅ Authenticated successfully.');

  // 2. Upload Sample Image
  console.log('[Test 1] Uploading Header Image...');
  const fakeImageBase64 = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;').toString('base64');
  const imgUploadRes = await request('/templates/upload-media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fileName: 'promo_banner.png',
      fileType: 'image/png',
      fileBase64: fakeImageBase64,
      mediaType: 'IMAGE',
    }),
  });
  assert.strictEqual(imgUploadRes.status, 201);
  assert.ok(imgUploadRes.data.url, 'Public media URL returned');
  console.log(`✅ Image uploaded successfully: ${imgUploadRes.data.url}`);

  // Verify static download of uploaded image
  const fetchImg = await fetch(imgUploadRes.data.url);
  assert.strictEqual(fetchImg.status, 200, 'Uploaded image should be publicly accessible');
  console.log('✅ Uploaded image verified via static URL (HTTP 200 OK).');

  // 3. Upload Sample Video
  console.log('[Test 2] Uploading Header Video...');
  const fakeVideoBase64 = Buffer.from('FAKE_MP4_VIDEO_BUFFER_CONTENT_12345').toString('base64');
  const videoUploadRes = await request('/templates/upload-media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fileName: 'product_walkthrough.mp4',
      fileType: 'video/mp4',
      fileBase64: fakeVideoBase64,
      mediaType: 'VIDEO',
    }),
  });
  assert.strictEqual(videoUploadRes.status, 201);
  assert.ok(videoUploadRes.data.url);
  console.log(`✅ Video uploaded successfully: ${videoUploadRes.data.url}`);

  // 4. Upload Sample Document
  console.log('[Test 3] Uploading Header Document (PDF)...');
  const fakeDocBase64 = Buffer.from('%PDF-1.4 Fake PDF Header Content').toString('base64');
  const docUploadRes = await request('/templates/upload-media', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      fileName: 'terms_and_pricing.pdf',
      fileType: 'application/pdf',
      fileBase64: fakeDocBase64,
      mediaType: 'DOCUMENT',
    }),
  });
  assert.strictEqual(docUploadRes.status, 201);
  assert.ok(docUploadRes.data.url);
  console.log(`✅ Document uploaded successfully: ${docUploadRes.data.url}`);

  // 5. Create Template with the Uploaded Image
  console.log('[Test 4] Creating WhatsApp Template with Uploaded Media Header...');
  const templateName = `promo_media_${Date.now()}`;
  const tplRes = await request('/templates', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: templateName,
      category: 'MARKETING',
      language: 'en_US',
      headerType: 'IMAGE',
      headerContent: imgUploadRes.data.url,
      bodyText: 'Hello {{1}}, explore our exclusive festival offers on our store today!',
      footerText: 'Reply STOP to unsubscribe.',
      buttons: [
        { type: 'QUICK_REPLY', text: 'Claim Offer' },
        { type: 'QUICK_REPLY', text: 'Chat with Agent' },
      ],
      variables: ['Customer'],
      action: 'SUBMIT',
    }),
  });
  assert.strictEqual(tplRes.status, 201);
  console.log(`✅ WhatsApp Media Template '${templateName}' created & submitted with status: ${tplRes.data.status}`);

  console.log('🎉 ALL TEMPLATE MEDIA UPLOAD TESTS PASSED (100%)!');
}

run().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
