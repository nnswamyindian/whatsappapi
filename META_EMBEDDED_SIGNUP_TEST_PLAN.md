# Meta WhatsApp Embedded Signup v4 Test Plan

**Application:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Testing Environment:** Development & Staging  
**Test Suite:** Embedded Signup Flow Verification  

---

## 1. Test Objectives

Validate that:
1. The official Facebook JavaScript SDK loads cleanly in the client browser.
2. The Embedded Signup popup launches with the correct `config_id` and parameters.
3. The authorization code is received and exchanged without race conditions.
4. Customer credentials are encrypted at rest with AES-256-GCM.
5. Inbound and outbound webhooks subscribe automatically.
6. Error scenarios (user cancellation, popup blocked, invalid code) are handled gracefully.

---

## 2. Test Prerequisites

1. Valid Meta Developer App with **WhatsApp** and **Facebook Login for Business** products added.
2. Embedded Signup Configuration created in Meta App Dashboard &gt; WhatsApp &gt; Quickstart or Embedded Signup Config.
3. Server `.env` populated with:
   - `META_APP_ID`: Your Meta App ID.
   - `META_APP_SECRET`: Your Meta App Secret.
   - `META_CONFIG_ID`: Embedded Signup configuration ID.
   - `META_API_VERSION`: `v21.0`.
   - `ENCRYPTION_KEY`: 32-byte hex key for AES-256-GCM.

---

## 3. Test Cases & Execution Matrix

### Test Case 1: Facebook JavaScript SDK Asynchronous Loading
- **Action:** Open Dashboard &gt; Integrations (`/integrations`).
- **Expected Result:**
  - `https://connect.facebook.net/en_US/sdk.js` script tag injected if not already present.
  - `window.FB` initialized with `appId`, `version: 'v21.0'`, `cookie: true`.
  - Console shows no initialization or CSP errors.

### Test Case 2: Launch Embedded Signup Dialog
- **Action:** Click "Launch Meta WhatsApp Embedded Signup v4" button.
- **Expected Result:**
  - Meta Facebook Login popup opens displaying official Meta branding.
  - Dialog presents permissions: `whatsapp_business_management` and `whatsapp_business_messaging`.
  - User can select an existing Business Portfolio or create a new WhatsApp Business Account.

### Test Case 3: Successful Authorization & Single-Token Exchange
- **Action:** Complete the Embedded Signup flow in the popup and click "Finish".
- **Expected Result:**
  - Popup closes automatically.
  - Event listener receives `WA_EMBEDDED_SIGNUP` message or `FB.login` callback returns `authResponse.code`.
  - Client makes single `POST /api/v1/whatsapp/embedded-signup/exchange` request with the authorization code.
  - Backend exchanges code via `https://graph.facebook.com/v21.0/oauth/access_token`.
  - Backend retrieves phone number ID, verified name, quality rating, and messaging limit tier.
  - Backend calls `POST /{waba-id}/subscribed_apps` to subscribe application to WABA webhooks.
  - Credentials encrypted at rest with AES-256-GCM.
  - Frontend refreshes and displays "CONNECTED" status with real WABA ID, Phone Number ID, and verified name.

### Test Case 4: Idempotency & Race Condition Prevention
- **Action:** Simulate simultaneous firing of `window.addEventListener('message')` and `FB.login` callback.
- **Expected Result:**
  - Client's `isExchangingRef` guard allows only the first event to trigger `/whatsapp/embedded-signup/exchange`.
  - Second duplicate trigger is prevented.
  - No 400 Bad Request ("Authorization code already used") error occurs.

### Test Case 5: User Cancellation Handling
- **Action:** Click "Launch Meta WhatsApp Embedded Signup v4", then immediately close the popup or click "Cancel".
- **Expected Result:**
  - Popup closes.
  - Frontend resets loading spinner to inactive state.
  - No error toast or broken UI state is displayed.
  - Workspace remains in its previous state.

### Test Case 6: Live Telemetry Refresh
- **Action:** With account connected, click "Refresh Meta Data".
- **Expected Result:**
  - Client calls `POST /api/v1/whatsapp/refresh`.
  - Backend queries Meta Graph API for updated `quality_rating`, `verified_name`, and `messaging_limit_tier`.
  - Updated values written to `whatsapp_connections` and returned to UI.
  - UI updates badge without requiring full page reload.

### Test Case 7: Disconnect WhatsApp Connection
- **Action:** Click "Disconnect" on the active connection card and confirm the browser alert.
- **Expected Result:**
  - Client calls `POST /api/v1/whatsapp/disconnect`.
  - Backend sets `mode = 'sandbox'`, sets `access_token = NULL`, and sets `status = 'disconnected'`.
  - UI updates to show disconnected CTA button.
  - No orphaned plain-text tokens remain in database.

---

## 4. Test Verification Checklist

| Test ID | Test Case | Status | Notes |
| :--- | :--- | :---: | :--- |
| TC-01 | Facebook SDK Async Loading | **PASS** | `connect.facebook.net/en_US/sdk.js` cleanly loaded. |
| TC-02 | Embedded Signup Popup Launch | **PASS** | Initiated with valid `config_id` and scopes. |
| TC-03 | Auth Code Exchange | **PASS** | Exchanged for System User token, credentials encrypted. |
| TC-04 | Single-Use Guard (No Race) | **PASS** | `isExchangingRef` prevents double submission. |
| TC-05 | User Cancellation | **PASS** | Resets cleanly without throwing unhandled exceptions. |
| TC-06 | Telemetry Refresh | **PASS** | Queries Meta Graph API for quality and limit tier. |
| TC-07 | Safe Disconnect | **PASS** | Revokes credentials and purges tokens from database. |
