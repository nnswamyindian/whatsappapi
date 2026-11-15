# MetaGreenWave Privacy & Data Flow Documentation

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Scope:** Inbound, Outbound, Storage, and Deletion Data Lifecycle  

---

## 1. Overview

This document maps the complete lifecycle of data entering, circulating within, and exiting the MetaGreenWave software ecosystem. It provides data flow analysis for customer administrative records, recipient contact directories, Meta Graph API tokens, inbound/outbound messaging payloads, and opt-out suppression lists.

---

## 2. End-to-End Data Flow Architecture

```
[Customer Admin / Agent]                  [Meta WhatsApp Cloud API]
         |                                           ^
         | (1) HTTPS / JWT Authenticated             | (3) Outbound REST
         v                                           v
+---------------------------------------------------------------+
|               MetaGreenWave Node.js Application               |
|                                                               |
|  - AES-256-GCM Encryption / Decryption Module                 |
|  - Multi-Tenant Organization Boundary Scoping (orgId)         |
|  - HMAC-SHA256 Webhook Verification Engine                    |
|  - Persistent Deduplication Engine (webhook_events)           |
+---------------------------------------------------------------+
         |                                           ^
         | (2) Relational Queries                    | (4) Inbound Webhooks
         v                                           |     (Delivery receipts,
+------------------------------------+               |      incoming chats)
|    Enterprise MySQL 8.0 Storage    |               |
|  - 27 Scoped Relational Tables     |---------------+
|  - Encrypted Tokens & Credentials  |
|  - Auditable Consent Ledgers       |
+------------------------------------+
```

---

## 3. Detailed Data Lifecycle Stages

### 3.1 Stage 1: Customer Onboarding & Consent Capture
1. Customer registers at `/register`.
2. Admin credentials (name, email, password) submitted over TLS 1.3.
3. Password hashed using PBKDF2/SHA-256 with 10,000+ iterations.
4. Explicit consent records inserted into `policy_consents` table:
   - Policy: `terms_and_conditions` (v2.0) and `privacy_policy` (v2.0).
   - Timestamp, IP address, and User-Agent captured.
5. Organization workspace created with status `PENDING_APPROVAL`.

### 3.2 Stage 2: Embedded Signup & Meta Credential Ingestion
1. Customer initiates Embedded Signup via Facebook Login for Business SDK.
2. Short-lived authorization code sent to `POST /api/v1/whatsapp/embedded-signup/exchange`.
3. Backend exchanges code with Meta Graph API for long-lived System User Access Token.
4. Token is encrypted immediately using AES-256-GCM with a unique 12-byte IV and 16-byte auth tag.
5. Plaintext token is destroyed in memory; encrypted cipher stored in `whatsapp_connections`.
6. Automated call to `POST /{waba-id}/subscribed_apps` activates webhook delivery.

### 3.3 Stage 3: Contact List Ingestion & Normalization
1. Customer uploads CSV contact file or creates contacts via API.
2. Phone numbers normalized strictly into international E.164 standard (e.g. `+919876543210`).
3. System verifies recipient is not present on the organization's suppression blacklist.
4. Contacts inserted into `contacts` table strictly associated with the active `organization_id`.

### 3.4 Stage 4: Outbound Campaign & Transactional Dispatch
1. Customer composes broadcast using a Meta-approved template.
2. Paced dispatcher worker queries eligible contacts.
3. Payload constructed according to Meta Cloud API specification:
   ```json
   {
     "messaging_product": "whatsapp",
     "to": "+919876543210",
     "type": "template",
     "template": { "name": "order_update", "language": { "code": "en" } }
   }
   ```
4. Dispatched over outbound HTTPS to `https://graph.facebook.com/v21.0/{phone-number-id}/messages`.
5. Message ID logged in `messages` and `campaign_recipients`.

### 3.5 Stage 5: Inbound Webhooks & Delivery Receipts
1. Meta dispatches delivery receipt (`sent`, `delivered`, `read`) or end-user reply to `POST /api/v1/webhooks/whatsapp`.
2. Webhook middleware verifies `X-Hub-Signature-256` using constant-time comparison against `META_APP_SECRET`.
3. Persistent deduplication check executed against `webhook_events` table using `(id, provider_message_id)`.
4. If duplicate: skipped immediately with HTTP 200.
5. If new: status updated in `messages` and streamed live to active agents via Server-Sent Events (SSE).

### 3.6 Stage 6: Recipient Opt-Out & Suppression Flow
1. Recipient sends "STOP", "UNSUBSCRIBE", or "CANCEL" via WhatsApp.
2. Webhook processor detects opt-out keyword.
3. Recipient phone number immediately updated in `contacts`: `opt_out = 1` and entered into suppression blacklist.
4. All future campaign dispatches to this phone number are blocked automatically.

---

## 4. Multi-Tenant Data Isolation Summary

| Asset | Scoping Column | Database Table | Isolation Mechanism |
| :--- | :--- | :--- | :--- |
| Contacts | `organization_id` | `contacts` | Filtered in query WHERE clause |
| Messages & Inboxes | `organization_id` | `messages`, `conversations` | Filtered in query WHERE clause |
| Templates | `organization_id` | `whatsapp_templates` | Filtered in query WHERE clause |
| Campaigns | `organization_id` | `campaigns` | Filtered in query WHERE clause |
| Meta Credentials | `organization_id` | `whatsapp_connections` | Encrypted row per workspace |
| Billing & Wallets | `organization_id` | `wallet_transactions`, `billing_invoices` | Transactional ledger per workspace |
| API Keys | `organization_id` | `api_keys` | Scoped server-to-server validation |
