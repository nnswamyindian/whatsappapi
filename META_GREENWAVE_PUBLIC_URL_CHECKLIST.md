# MetaGreenWave Public URL & Endpoint Checklist

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Canonical Domain:** `https://metagreenwave.com`  
**Review Target:** Meta WhatsApp Business Platform App Review & Verification  

---

## 1. Meta App Dashboard Required URLs

These URLs must be entered into the **Meta Developer App Dashboard** (Settings &gt; Basic and WhatsApp &gt; Configuration) and must remain publicly accessible over HTTPS without requiring user authentication:

| Dashboard Field | Canonical URL | Purpose | Status |
| :--- | :--- | :--- | :---: |
| **Privacy Policy URL** | `https://metagreenwave.com/privacy-policy` | Legal privacy disclosures, DPDPA, GDPR, data roles | **LIVE & ACTIVE** |
| **Terms of Service URL** | `https://metagreenwave.com/terms-of-service` | SaaS terms, acceptable use, liability, non-endorsement | **LIVE & ACTIVE** |
| **Data Deletion Callback URL** | `https://metagreenwave.com/api/v1/meta/data-deletion` | Receives and verifies Meta `signed_request` via HMAC-SHA256 | **LIVE & ACTIVE** |
| **Data Deletion Instructions URL** | `https://metagreenwave.com/data-deletion` | Public portal for self-service deletion and status tracking | **LIVE & ACTIVE** |
| **WhatsApp Webhook Callback URL** | `https://metagreenwave.com/api/v1/webhooks/whatsapp` | GET challenge verification and POST event delivery | **LIVE & ACTIVE** |
| **App Domain** | `metagreenwave.com` | Primary authorized domain | **LIVE & ACTIVE** |

---

## 2. Public Marketing & Compliance Pages Checklist

| URL Path | Component | Purpose | Auth Required |
| :--- | :--- | :--- | :---: |
| `https://metagreenwave.com/` | `LandingPage.tsx` | Platform overview, features preview, CTA | No |
| `https://metagreenwave.com/features` | `FeaturesPage.tsx` | Campaign engine, shared inbox, chatbots, CRM | No |
| `https://metagreenwave.com/solutions` | `SolutionsPage.tsx` | Industry verticals (Retail, Healthcare, Real Estate) | No |
| `https://metagreenwave.com/pricing` | `PricingPage.tsx` | Subscription tiers & Meta messaging wallet fees | No |
| `https://metagreenwave.com/about` | `AboutPage.tsx` | Digi8 Solutions operator profile & MySQL architecture | No |
| `https://metagreenwave.com/contact` | `ContactPage.tsx` | Contact info (`hello@digi8solutions.com`) and inquiry form | No |
| `https://metagreenwave.com/faq` | `FaqPage.tsx` | Knowledge base, Cloud API questions, verification | No |
| `https://metagreenwave.com/privacy-policy` | `PrivacyPolicyPage.tsx` | Privacy Policy v2.0 | No |
| `https://metagreenwave.com/privacy` | `PrivacyPolicyPage.tsx` | Alias for Privacy Policy | No |
| `https://metagreenwave.com/terms-of-service` | `TermsOfServicePage.tsx` | Terms of Service v2.0 | No |
| `https://metagreenwave.com/terms` | `TermsOfServicePage.tsx` | Alias for Terms of Service | No |
| `https://metagreenwave.com/data-deletion` | `DataDeletionPage.tsx` | Deletion request form, confirmation code tracker | No |
| `https://metagreenwave.com/cookies` | `CookiePolicyPage.tsx` | Cookie categories, zero third-party ad tracker policy | No |
| `https://metagreenwave.com/acceptable-use` | `AcceptableUsePage.tsx` | Anti-spam policy, prohibited verticals, opt-in rules | No |
| `https://metagreenwave.com/cancellation-refund` | `RefundCancellationPage.tsx` | Subscription and wallet balance refund terms | No |
| `https://metagreenwave.com/refund-policy` | `RefundCancellationPage.tsx` | Alias for Refund Policy | No |
| `https://metagreenwave.com/security` | `SecurityPage.tsx` | Cryptographic trust center (AES-256, HMAC, RBAC) | No |
| `https://metagreenwave.com/status` | `StatusPage.tsx` | Live infrastructure telemetry and uptime indicators | No |

---

## 3. Public API & Telemetry Endpoints Checklist

| API Endpoint | Method | Purpose | Auth Required |
| :--- | :---: | :--- | :---: |
| `/api/v1/health` | GET | System health & MySQL connectivity status | No |
| `/api/v1/meta/data-deletion` | POST | Meta signed_request data deletion callback | Signed Request |
| `/api/v1/meta/data-deletion/request` | POST | Public web deletion request submission | No |
| `/api/v1/meta/data-deletion/status/:code` | GET | Public deletion status lookup by code | No |
| `/api/v1/meta/deauthorize` | POST | Meta app deauthorization callback | Signed Request |
| `/api/v1/webhooks/whatsapp` | GET | Meta webhook subscription challenge handshake | Hub Token |
| `/api/v1/webhooks/whatsapp` | POST | Inbound webhook events (messages, delivery statuses) | HMAC SHA-256 |
| `/api/v1/docs` | GET | OpenAPI interactive documentation | No |

---

## 4. Verification Command for Production Testing

To verify all endpoints on your production server:
```bash
# Health check
curl -I https://metagreenwave.com/api/v1/health

# Webhook Challenge handshake
curl "https://metagreenwave.com/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_123&hub.verify_token=[YOUR_TOKEN]"

# Deletion status lookup
curl https://metagreenwave.com/api/v1/meta/data-deletion/status/DEL-TEST-CODE
```
