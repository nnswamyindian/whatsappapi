# Meta WhatsApp Business Platform Cloud API Technical Integration Requirements

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**API Specification:** Meta Graph API v21.0 / v22.0  
**Target Review:** WhatsApp Embedded Signup & Cloud API Messaging  

---

## 1. Overview

MetaGreenWave operates as a multi-tenant SaaS reseller and messaging application connecting customer businesses to the official Meta WhatsApp Business Platform Cloud API. This document specifies the exact technical prerequisites, permissions, configuration parameters, and API requirements necessary for production operation and Meta App Review.

---

## 2. Meta App Configuration Requirements

### 2.1 Meta App Type
- **App Type:** Business App (`business`)
- **Use Case:** Build connected customer messaging experiences, manage business communications, and onboard client WABAs.

### 2.2 Products Required in Meta Developer Dashboard
1. **WhatsApp:**
   - Enables official WhatsApp Cloud API access, phone number registration, template management, and webhook subscription.
2. **Facebook Login for Business:**
   - Enables WhatsApp Embedded Signup, allowing client business owners to log in, select/create their WhatsApp Business Account (WABA), and grant permissions to MetaGreenWave.

---

## 3. Required Meta Permissions & Scopes

When customers initiate Embedded Signup via Facebook Login for Business, the application requests the following Meta permissions:

| Permission | Description | Justification |
| :--- | :--- | :--- |
| `whatsapp_business_management` | Read and write access to WABA, phone numbers, verified name, and message templates. | Essential to list phone numbers, register webhook subscriptions (`subscribed_apps`), synchronize templates, and manage business assets. |
| `whatsapp_business_messaging` | Send and receive WhatsApp messages via the Cloud API. | Essential to dispatch broadcast campaigns, transactional alerts, OTPs, and power the two-way shared team inbox. |
| `public_profile` | Basic Facebook user profile information. | Default scope for Facebook Login to identify the authorizing user. |

---

## 4. Graph API Endpoints Used

All requests use HTTPS and target `https://graph.facebook.com/v21.0/` (or configured `META_API_VERSION`).

### 4.1 OAuth & Token Exchange
- `GET /v21.0/oauth/access_token`
  - Parameters: `client_id`, `client_secret`, `code`
  - Exchanges the short-lived authorization code from Embedded Signup for a Meta access token.

### 4.2 Phone Number & WABA Telemetry
- `GET /v21.0/{phone-number-id}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier`
  - Retrieves verified phone metadata, current quality rating (GREEN/YELLOW/RED), and messaging tier (e.g. `TIER_1K`, `TIER_10K`).
- `GET /v21.0/{waba-id}?fields=id,name,currency,timezone_id`
  - Inspects WABA metadata.

### 4.3 Automated Webhook Subscription
- `POST /v21.0/{waba-id}/subscribed_apps`
  - Subscribes MetaGreenWave to receive webhook delivery receipts, read statuses, and inbound messages for the customer WABA.

### 4.4 Outbound Message Dispatch
- `POST /v21.0/{phone-number-id}/messages`
  - Dispatches template messages (Marketing, Utility, Authentication) or free-form text/media within the active 24-hour customer service window.

### 4.5 Template Management
- `GET /v21.0/{waba-id}/message_templates`
  - Synchronizes approved templates into the customer's workspace.
- `POST /v21.0/{waba-id}/message_templates`
  - Submits new custom templates to Meta for approval.

---

## 5. Webhook Specifications

### 5.1 Callback URL Configuration
- **Public HTTPS URL:** `https://metagreenwave.com/api/v1/webhooks/whatsapp`
- **Verification Token:** Stored in server environment (`META_WEBHOOK_VERIFY_TOKEN`).
- **GET Handler (Challenge):** Responds with `hub.challenge` when `hub.verify_token` matches.
- **POST Handler (Payloads):** Enforces HMAC-SHA256 signature verification (`X-Hub-Signature-256`) against `META_APP_SECRET`.
- **Deduplication:** Persistent deduplication against `webhook_events` table ensures idempotency.

### 5.2 Webhook Field Subscriptions
In the Meta App Dashboard under WhatsApp &gt; Configuration &gt; Webhook fields:
- `messages`: Receives inbound messages from end-users, delivery receipts (`sent`, `delivered`, `read`), and failure reasons.
- `message_template_status_update`: Receives real-time notifications when a template status changes (`APPROVED`, `REJECTED`, `PAUSED`).
- `phone_number_quality_update`: Receives alerts when a phone number quality rating changes.
- `account_review_update`: Receives updates regarding WABA compliance.

---

## 6. Cryptographic Security Standards

1. **AES-256-GCM Token Encryption:**
   - Raw Meta access tokens are never saved in plaintext.
   - Encrypted with unique initialization vectors and authenticated tags.
2. **HMAC Signature Verification:**
   - All inbound webhooks and deauthorization notices use constant-time comparison (`crypto.timingSafeEqual`).
3. **No Plaintext Leaks:**
   - Graph API access tokens are masked in API responses (`hasToken: true`, `accessTokenMasked: "EAAB••••••••"`).
