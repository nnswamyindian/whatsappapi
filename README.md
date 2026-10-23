# GreenWave — Production-Oriented WhatsApp Business Messaging SaaS Platform

[![Node.js](https://img.shields.io/badge/Node.js-v22-16A34A.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-14532D.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3-38B2AC.svg)](https://tailwindcss.com/)
[![Meta Graph API](https://img.shields.io/badge/Meta_Graph_API-v21.0-0668E1.svg)](https://developers.facebook.com/docs/whatsapp/cloud-api)
[![License](https://img.shields.io/badge/License-Proprietary-gray.svg)]()

> **GreenWave** is a minimal, trustworthy, fast, business-friendly WhatsApp Business messaging platform engineered with multi-tenant architecture, robust compliance controls, durable message queuing, transparent pricing/usage ledgers, and a shared team inbox.

---

## 1. Architecture Overview

GreenWave is structured as a **Modular Monolith** optimized for enterprise reliability, low latency, and zero-downtime operations:

```
WhatsApp_API/
├── client/                     # Modern React 18 + Vite SPA
│   ├── src/
│   │   ├── components/         # WhatsAppBubblePreview, AppLayout, Navbar, Sidebar, Modals
│   │   ├── pages/              # 12 Authenticated Modules + Auth (Login/Register)
│   │   ├── lib/                # API client (JWT & scoped auth), Utilities
│   │   └── index.css           # Custom green design tokens (#16A34A, #14532D, #F0FDF4)
│   └── vite.config.ts          # Optimized production build & asset pipeline
│
├── server/                     # High-performance Node.js / Express Backend
│   ├── src/
│   │   ├── db/                 # Schema & Auto-Seeder (24 Relational Tables, WAL Mode)
│   │   ├── middleware/         # Multi-tenant isolation & RBAC hierarchy
│   │   ├── providers/          # Meta WhatsApp Cloud API v21 adapter & Mock Sandbox
│   │   ├── routes/             # REST API modules (Auth, Campaigns, Inbox, OTP, Billing...)
│   │   ├── services/           # Durable Job Queue, SSE Event Broker, Suppression Engine
│   │   └── utils/              # E.164 Country-Aware Phone Normalizer & Crypto Hasher
│   ├── tests/                  # Automated integration & security test suites
│   └── dist/                   # Compiled TypeScript code
│
├── .env.example                # Configuration template
└── package.json                # Root orchestration scripts
```

### Key Technical Characteristics
- **Zero CORS in Production:** The Express server automatically serves the compiled Vite bundle (`client/dist`) from a single port (`5000`), ensuring rapid load times and streamlined reverse-proxy deployment.
- **Provider Adapter Architecture:** Decouples core campaign orchestration from the external provider. Automatically switches between official **Meta WhatsApp Cloud API v21.0** and a labelled **Sandbox / Mock Provider** with simulated asynchronous delivery events.
- **Strict Multi-Tenancy:** Every query, background job, SSE connection, and API route enforces an `organization_id` boundary.
- **Non-Blocking SSE Streaming:** Server-Sent Events broker pushes real-time campaign progress, delivery status updates, and incoming chat messages to the frontend instantly.

---

## 2. Implemented Modules

| Module | Features & Capabilities |
| :--- | :--- |
| **Workspace Overview** | Guided 10-step onboarding checklist, real-time KPI cards (deliveries, reads, reply rate), quick-launch actions, connection status badge. |
| **Campaigns & 4-Step Wizard** | **Step 1 (Audience):** Select lists/segments, automatic opt-out & suppression exclusion, invalid number detection.<br>**Step 2 (Message):** Approved template picker, dynamic variable mapping (`{{1}}`, `{{2}}`), live WhatsApp bubble preview.<br>**Step 3 (Review):** Breakdown of eligible vs. excluded recipients, transparent fee calculation (Platform fee + Meta provider rate separately).<br>**Step 4 (Launch):** Immediate or timezone-aware scheduling, progress bars, pause/resume/cancel controls. |
| **Template Studio** | Create Marketing, Utility, and Authentication templates. Header (Text/Image/Document), Body with variable builder, Footer, Quick Reply & CTA buttons. Meta approval status synchronization. |
| **Contacts & Import Wizard** | CSV/Excel file upload, column mapping (`name`, `phone`, `email`), E.164 phone normalizer (+91, +1, +44, etc.), duplicate prevention, consent ledger tracking (opt-in source & timestamp), manual suppression blacklist. |
| **Audiences & Segments** | Contact segmentation by tags, lifecycle status, consent purpose, and customer engagement. |
| **Shared Team Inbox** | Real-time multi-agent conversations, **WhatsApp 24-Hour Customer Service Window timer**, canned quick replies, internal private agent notes, agent assignment, conversation status filter (Open, Pending, Resolved), built-in inbound message simulator for testing. |
| **Visual Automations** | Event triggers (Incoming message keyword, Contact created, Tag added, Webhook received), conditional branching, template send actions, team assignment, delay timers, and webhook dispatching. |
| **Transactional API & OTP** | Scoped API Keys (`gw_live_...`), SHA-256 hashed single-use OTP generation & verification, 5-minute expiry, brute-force attempt limiting, ready-to-use curl code snippets. |
| **Reports & Analytics** | Delivery rate, read rate, reply rate, latency tracking, hourly send volume charts, category breakdown (Marketing vs. Utility vs. Auth), CSV export. |
| **Billing & Usage Ledger** | Double-entry wallet ledger, transparent breakdown of platform fees vs. provider charges, effective-dated rate cards (configurable by destination country & message category), top-up modal. |
| **Team & Permissions (RBAC)** | Role hierarchy: `owner`, `admin`, `campaign_manager`, `support_agent`, `analyst`, `billing_manager`. Invitation system, granular permission checks, and organization audit logs. |
| **Settings & Meta Connection** | Direct configuration of Meta WABA ID, Phone Number ID, Permanent System User Access Token, Webhook Verify Token, and App Secret. Test Connection button with live latency verification. |
| **Platform Super-Admin** | Cross-tenant visibility for platform operators: tenant health, active queues, provider error diagnostics, system-wide metrics. |

---

## 3. Database Schema

The database utilizes 24 normalized relational tables operating in high-concurrency WAL (Write-Ahead Logging) mode:

1. `organizations` — Multi-tenant workspace entities, timezones, and active plans.
2. `users` — Authentication credentials (bcrypt password hashes) and profile data.
3. `memberships` — Organization-to-user mappings with assigned RBAC roles.
4. `provider_connections` — Meta Cloud API credentials (encrypted tokens, WABA ID, Phone ID, webhook secret).
5. `phone_numbers` — Registered WhatsApp phone numbers, display names, and quality ratings.
6. `contacts` — Normalized customer records with E.164 phone numbers and custom JSON attributes.
7. `consent_events` — Audit ledger of explicit opt-in source, consent purpose, evidence, and timestamps.
8. `suppression_list` — Global and tenant-specific opt-out blacklist enforced prior to any dispatch.
9. `audiences` & `audience_members` — Saved contact segments and filter definitions.
10. `templates` & `template_versions` — WhatsApp message templates, components, category, language, and Meta approval states.
11. `campaigns` — Campaign execution records, audience filters, template mapping, scheduled times, and statuses.
12. `campaign_recipients` — Per-recipient campaign audit records with fee breakdown and individual message states.
13. `message_jobs` — Durable queue jobs for rate-paced dispatching.
14. `messages` — Master message records with unique UUID and external `provider_message_id`.
15. `message_status_events` — Immutable timeline of message lifecycle states (`queued`, `accepted`, `sent`, `delivered`, `read`, `failed`).
16. `conversations` — Active customer service threads with 24-hour expiration window timestamps.
17. `conversation_messages` — Inbound and outbound chat events with delivery flags.
18. `conversation_notes` — Internal staff-only notes (never visible to customer).
19. `canned_replies` — Pre-approved saved snippets for rapid customer support.
20. `workflows` & `workflow_executions` — No-code automation triggers, node graphs, and step execution logs.
21. `api_keys` — Scoped server-to-server API credentials with SHA-256 hashed secret keys.
22. `otp_verifications` — Ephemeral authentication codes stored as SHA-256 hashes with attempt limits and expiry.
23. `rate_cards` — Effective-dated pricing matrix for WhatsApp conversation categories by country code.
24. `wallet_transactions` — Transactional double-entry ledger for platform fees, provider charges, and credit top-ups.
25. `audit_logs` — System-wide security, tenant switch, and configuration change records.

---

## 4. API Documentation

### Base URL: `/api/v1`

### Authentication Headers
For dashboard requests:
```http
Authorization: Bearer <jwt_token>
```
For server-to-server transactional requests:
```http
X-API-Key: gw_live_<hex_token>
```

---

### Core Endpoints

#### 1. Authentication & Organization
- `POST /auth/register` — Register owner account and create initial organization workspace.
- `POST /auth/login` — Authenticate with email/password; returns JWT and user profile.
- `GET /auth/me` — Retrieve active session, organization, and RBAC permissions.
- `GET /organizations/onboarding-progress` — Returns 10-step onboarding completion percentage and checklist status.

#### 2. Contacts & Consent
- `GET /contacts` — Paginated contact directory with search and tag filtering.
- `POST /contacts` — Create or update a single contact with phone validation.
- `POST /contacts/import` — CSV/Excel import parser; validates E.164 numbers, skips duplicates, and records consent.
- `POST /contacts/suppress` — Add phone number to the suppression blacklist.

#### 3. Message Templates
- `GET /templates` — List all organization templates with live Meta sync status.
- `POST /templates` — Create a new template and submit to Meta Graph API for review.
- `POST /templates/:id/sync` — Query Meta Graph API for latest approval state (`APPROVED`, `REJECTED`, `PENDING`).

#### 4. Campaigns
- `POST /campaigns/estimate` — Calculate eligible recipient count, excluded count (suppressed/invalid), platform fee, and Meta provider charges.
- `POST /campaigns` — Create, validate, and launch campaign immediately or schedule for future delivery.
- `GET /campaigns` — Retrieve campaign list with real-time delivery and read percentages.
- `POST /campaigns/:id/pause` | `resume` | `cancel` — Manage active campaign execution state.

#### 5. Shared Team Inbox
- `GET /inbox/conversations` — List active chats, unread indicators, and 24h window expiration countdowns.
- `GET /inbox/conversations/:id/messages` — Conversation message history and internal notes.
- `POST /inbox/conversations/:id/messages` — Send outbound reply (verifies active 24h window).
- `POST /inbox/conversations/:id/notes` — Append internal staff note.
- `POST /inbox/simulate-inbound` — Test endpoint to simulate incoming customer WhatsApp messages.

#### 6. Transactional API & Cryptographic OTP
- `POST /transactional/messages` — Send template or session transactional message using scoped API key.
- `POST /transactional/otp/request` — Generates 6-digit OTP, stores secure SHA-256 hash with 5-minute expiry, and dispatches WhatsApp authentication template.
- `POST /transactional/otp/verify` — Validates supplied OTP against stored hash, enforces attempt limits, and burns the code upon successful verification.

#### 7. Official Meta Webhooks
- `GET /webhooks/whatsapp` — Handles Meta webhook verification challenge (`hub.mode`, `hub.challenge`, `hub.verify_token`).
- `POST /webhooks/whatsapp` — Ingests inbound WhatsApp messages and real-time delivery status receipts (`sent`, `delivered`, `read`, `failed`), updating the message ledger idempotently.

---

## 5. Official Meta WhatsApp Cloud API Setup Guide

To transition GreenWave from **Sandbox Mode** to **Live Meta WhatsApp Cloud API**:

### Step 1: Create a Meta Developer App
1. Go to the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **My Apps** > **Create App**. Select **Business** as the app type.
3. Under Add Products, select **WhatsApp** and click **Set Up**.

### Step 2: Obtain API Credentials
1. In the WhatsApp product navigation, open **API Setup**:
   - **WhatsApp Business Account ID (WABA ID)**
   - **Phone Number ID**
   - **Test Phone Number** (or register your business phone number under **Configuration** > **Manage Phone Numbers**).
2. Create a **System User** under Meta Business Manager:
   - Navigate to **Business Settings** > **Users** > **System Users**.
   - Add a System User with role **Admin**.
   - Click **Generate New Token**, select your WhatsApp App, and grant `whatsapp_business_messaging` and `whatsapp_business_management`.
   - Set the token expiration to **Never** to produce a permanent production token.

### Step 3: Configure GreenWave
1. In the GreenWave dashboard, navigate to **Settings** > **WhatsApp Connection**.
2. Switch mode to **Live (Meta Cloud API)**.
3. Paste:
   - **WABA ID**
   - **Phone Number ID**
   - **System User Permanent Access Token**
   - **Webhook Verify Token** (e.g. `greenwave_verify_token_prod_99`)
4. Click **Save & Test Connection**. GreenWave will perform a live handshake with `https://graph.facebook.com/v21.0/{phone_number_id}` and report connection latency and quality rating.

### Step 4: Configure Webhooks in Meta Dashboard
1. In the Meta App Dashboard, go to **WhatsApp** > **Configuration** > **Webhook**.
2. Set the Callback URL to:
   ```
   https://your-domain.com/api/v1/webhooks/whatsapp
   ```
3. Set the **Verify Token** to the exact token configured in Step 3.
4. Click **Verify and Save**.
5. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (inbound chats, delivery receipts, read events, failures)
   - `message_template_status_update` (template approvals/rejections)

---

## 6. Testing & Quality Assurance

GreenWave includes a dedicated automated test suite verifying all critical business and security invariants:

```bash
# Run the complete test suite
npm test
```

### Verified Test Suites:
- `Database Initializer & Seed Suite` — Confirms all 24 relational tables, initial organization, demo admin account, and rate cards initialize cleanly.
- `Phone Number Normalization Suite` — Tests E.164 parsing across multiple formats (`9876543210`, `+91 98765 43210`, `14155552671`, `+44 7911 123456`), rejecting malformed input.
- `Mock Provider & Sandbox Suite` — Validates that template dispatches generate unique provider identifiers and emit asynchronous simulated delivery states without external credentials.
- `Cryptographic OTP Security Suite` — Asserts that OTP codes are stored strictly as SHA-256 hashes, enforce 5-minute expiry, lockout after 5 incorrect attempts, and can never be reused once verified.
- `Suppression List & Consent Enforcement Suite` — Verifies that opted-out contacts are completely excluded from campaign estimates and messaging dispatches.
- `Multi-Tenant Isolation Suite` — Validates that queries scoped to Organization A cannot retrieve or modify records belonging to Organization B.

---

## 7. Running the Platform Locally

### Prerequisites
- Node.js v18+ (Node.js 22 LTS recommended)
- npm v9+

### Quick Start
```bash
# 1. Clone repository and navigate to root
cd WhatsApp_API

# 2. Install dependencies across server and client
npm run install:all

# 3. Build client and server bundles
npm run build

# 4. Run the automated test suite
npm test

# 5. Start the production server
npm start
```

Open your browser at **`http://localhost:5000`**.

### Default Seed Credentials
- **Email:** `admin@greenwave.io`
- **Password:** `GreenWave#2025`
- **Workspace:** `Acme Retail Global`

---

## 8. Deployment & Production Operations

### Process Management with PM2
For continuous production execution with automatic restarts:
```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start the cluster with PM2
pm2 start server/dist/index.js --name "greenwave-api" -i max

# Save process list
pm2 save
pm2 startup
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name whatsapp.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name whatsapp.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/whatsapp.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/whatsapp.yourcompany.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 9. Prioritized Production Hardening Roadmap

While GreenWave is fully functional out of the box with zero external infrastructure dependencies, enterprise scaling can leverage the following roadmap:

1. **Distributed Queue Clustering:** Migrate the local queue worker to BullMQ with Redis cluster backing for sustained throughput >1,000 messages/second.
2. **PostgreSQL RLS Migration:** Move from SQLite WAL to managed PostgreSQL with Row-Level Security (RLS) policies for multi-regional data governance.
3. **Private Object Storage:** Integrate AWS S3 or Google Cloud Storage for WhatsApp media attachments (PDF invoices, marketing images, audio clips) with pre-signed URLs.
4. **WhatsApp Flows & Catalog Integration:** Extend the Template Studio to support native Meta WhatsApp Flows and interactive Commerce Catalogs.
5. **SMS Fallback Provider:** Add Twilio / Infobip provider adapters for automated SMS fallback when WhatsApp message delivery fails.
