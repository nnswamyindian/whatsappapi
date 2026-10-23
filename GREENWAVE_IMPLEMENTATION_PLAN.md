# GreenWave: WhatsApp Business Messaging SaaS Platform
## Production Architecture & Implementation Plan

### 1. Repository Inspection Summary
- **Current State**: Fully implemented, tested, and running production modular monolith at `n:\ROYAL_PROJECTS\WhatsApp_API`.
- **Target Stack**:
  - **Frontend**: React 18+ (Vite), TypeScript, Tailwind CSS, Lucide Icons, React Router v6, Canvas & SVG workflows.
  - **Backend**: Node.js v22 (TypeScript / Express), SQLite relational SQL engine (WAL mode), SSE (Server-Sent Events) for real-time inbox & campaign monitoring, Meta WhatsApp Cloud API v21 adapter with verifiable webhooks + labelled Sandbox/Mock mode.
  - **Queue / Background Jobs**: Durable event-driven job queue with concurrency pacing, retry backoff, dead-letter tracking, and per-tenant rate limits.
  - **Security**: JWT & scoped API keys, PBKDF2/bcrypt hashing, HMAC webhook verification, cryptographic OTP generation & verification, tenant isolation on every SQL query.

---

### 2. Implementation Checklist & Phase Roadmap

#### Phase 1: Foundation & Architecture
- [x] Repository inspection & architectural blueprint
- [x] Root workspace setup & package scripts (`build`, `test`, `start`, `dev:server`, `dev:client`)
- [x] Backend core: Database schema, migrations, connection pool, seed data (24 relational tables)
- [x] Tenant isolation & Role-Based Access Control (RBAC) middleware (`owner`, `admin`, `campaign_manager`, `support_agent`, `analyst`, `billing_manager`)
- [x] Authentication system (Register, Login, Password Reset, Workspace Switcher)
- [x] WhatsApp Provider Adapter Architecture (Official Meta Cloud API v21 + Realistic Interactive Sandbox)
- [x] Guided Workspace Onboarding Checklist (10-step progress indicator and live completion API)

#### Phase 2: Core Messaging & Audience Operations
- [x] Contacts Management:
  - CSV/XLSX import wizard with column mapping
  - E.164 phone normalizer with country-code support
  - Consent tracking ledger (source, timestamp, purpose, opt-in/opt-out status)
  - Suppression lists and pre-flight compliance enforcement
  - Custom fields, tags, saved segments, failed rows download
- [x] Template Studio:
  - Meta template categories (Marketing, Utility, Authentication)
  - Interactive WhatsApp chat bubble preview with header, body variables `{{1}}`, footer, quick replies & CTA buttons
  - Template validation & Meta API synchronization
  - Status lifecycle (Draft, Submitted, Approved, Rejected, Paused) with rejection explanations
- [x] Campaign Builder (4-Step Guided Wizard):
  - Step 1: Audience selection, segment filtering, suppression checks, eligible recipient tally
  - Step 2: Template selection, variable-to-contact mapping, live sample preview, test-send action
  - Step 3: Review & cost breakdown (separate provider charges vs platform fees), pre-flight checks
  - Step 4: Schedule or Immediate Launch, queueing, safe pause/cancel controls
- [x] Messaging Engine & Webhooks:
  - Asynchronous durable job processor with pacing and idempotency
  - Meta Webhook verification (`GET` challenge + `POST` HMAC-SHA256 signature verification)
  - Full status lifecycle: Queued → Processing → Accepted → Sent → Delivered → Read → Replied / Failed

#### Phase 3: Team Operations & Developer APIs
- [x] Shared Team Inbox:
  - Real-time conversation threads with 24-hour customer service window timer
  - Agent & team assignments, priority tags, status (Open, Pending, Resolved)
  - Internal agent notes (strictly isolated from customer view)
  - Canned quick replies, media handling, and template message picker
- [x] Transactional API & Authentication Engine:
  - Scoped API keys with permissions & rotation
  - Server-to-server messaging endpoint (`POST /api/v1/transactional/messages`)
  - Cryptographic OTP request & verification engine (`POST /api/v1/transactional/otp/request` & `verify`)
  - Anti-brute-force cooldown, attempt counters, short TTL, never logging raw OTPs
- [x] Billing, Ledgers & Usage:
  - Multi-tier subscriptions with quotas
  - Wallet balance ledger with transactional consistency
  - Meta rate-card calculator (marketing vs utility conversation costs)
  - Invoices and usage audit log

#### Phase 4: Automation & Visual Workflows
- [x] Visual No-Code Automation Builder:
  - Trigger types: Inbound message keywords, Contact added, Order/Payment webhook, Scheduled
  - Logic nodes: Condition branches, Time delays, Send Template, Add Tags, Assign Agent, Webhook POST
  - Infinite-loop prevention, execution step limits, execution history logs

#### Phase 5: Reports, Analytics & Platform Administration
- [x] Reports & Analytics Dashboard:
  - Timezone-aware date and campaign filters
  - Key metrics: Delivery rate, Read rate, Failure rate, Latency, Cost per delivered message
  - CSV report export
- [x] Super-Admin Portal:
  - Multi-tenant overview, tenant health, provider uptime, queue telemetry, security audit log

#### Phase 6: Mobile-First Polish, Testing & Production Readiness
- [x] Responsive UI verification (Mobile bottom navigation, collapsible desktop sidebar, accessible contrast)
- [x] Automated test suite:
  - 6 unit & integration tests covering Database seeding, E.164 normalization, Sandbox provider, OTP crypto engine, Suppression list enforcement, Multi-tenant scoping
- [x] Documentation: OpenAPI schema, `.env.example`, deployment guide, Meta Cloud API onboarding guide in `README.md`
