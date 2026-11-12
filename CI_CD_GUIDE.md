# MetaGreenWave Enterprise CI/CD Pipeline Documentation

This document outlines the Continuous Integration (CI) and Continuous Delivery/Deployment (CD) architecture engineered for the **MetaGreenWave WhatsApp Business Messaging SaaS platform**.

---

## 1. Overview of CI/CD Architecture

```
                  ┌───────────────────────────────────────────────┐
                  │              Developer Push / PR              │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CONTINUOUS INTEGRATION (CI)                            │
│                                                                                 │
│   ┌────────────────────┐     ┌────────────────────┐     ┌───────────────────┐   │
│   │ 1. Typecheck &     │ ──► │ 2. Production      │ ──► │ 3. Unit &         │   │
│   │    Lint Gate       │     │    Builds          │     │    Integration    │   │
│   │ (Client & Server)  │     │ (Vite & tsc)       │     │ (22 Test Suites)  │   │
│   └────────────────────┘     └────────────────────┘     └─────────┬─────────┘   │
│                                                                   │             │
│   ┌────────────────────┐     ┌────────────────────┐               │             │
│   │ 5. Security &      │ ◄── │ 4. Enterprise E2E  │ ◄─────────────┘             │
│   │    Vulnerability   │     │    Acceptance      │                             │
│   │    Audit           │     │ (Full SaaS Journey)│                             │
│   └────────────────────┘     └────────────────────┘                             │
└─────────────────────────────────────────┬───────────────────────────────────────┘
                                          │ (on merge to main / release tag)
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       CONTINUOUS DELIVERY & DEPLOYMENT (CD)                     │
│                                                                                 │
│   ┌────────────────────────────────┐     ┌──────────────────────────────────┐   │
│   │ 1. Multi-Stage Docker Build    │ ──► │ 2. Push Container to GHCR        │   │
│   │    (node:20-alpine + tini)     │     │ (ghcr.io/org/metagreenwave)      │   │
│   └────────────────────────────────┘     └────────────────┬─────────────────┘   │
│                                                           │                     │
│   ┌────────────────────────────────┐     ┌────────────────▼─────────────────┐   │
│   │ 4. Post-Deploy Smoke Test &    │ ◄── │ 3. Automated Zero-Downtime       │   │
│   │    Health Probe Probe          │     │    Rollout + Safe DB Migration   │   │
│   │    (/api/v1/health)            │     │    (docker-compose.prod.yml)     │   │
│   └────────────────────────────────┘     └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. GitHub Actions Workflows (`.github/workflows/`)

### 1. `ci.yml` — Continuous Integration Pipeline
- **Triggers:** Every `push` to `main`, `master`, `staging`, `develop`, and every `pull_request`.
- **Concurrency Control:** Cancels superseded runs on the same branch automatically to conserve runner minutes.
- **Matrix Testing:** Node.js 20.x LTS & Node.js 22.x.
- **Jobs Executed:**
  1. `lint-and-typecheck`: Verifies zero TypeScript syntax or type issues on both React frontend and Express backend.
  2. `build`: Compiles production assets for client (`client/dist`) and server (`server/dist`), uploading artifacts.
  3. `test-unit-integration`: Executes the 22-suite core backend unit & integration tests (`npm test`).
  4. `test-enterprise-e2e`: Boots server daemon, tests `/api/v1/health`, registers a real tenant, executes Super Admin approval, captures payment, verifies downloadable tax invoice with `PAID` stamp, and validates omnichannel WhatsApp follow-ups.
  5. `security-audit`: Scans dependencies for high/critical security advisories via `npm audit`.

### 2. `cd.yml` — Continuous Delivery & Deployment
- **Triggers:** Push of release tags (`v*`), merges to `main`, or manual trigger (`workflow_dispatch`).
- **Jobs Executed:**
  1. `build-and-push-container`: Builds the production multi-stage Docker container using Docker Buildx and pushes to GitHub Container Registry (`ghcr.io`).
  2. `deploy-staging`: Deploys the built image to the staging environment and verifies healthcheck probe.
  3. `deploy-production`: Performs zero-downtime rolling update on production, validates database schema integrity, and verifies post-deployment `/api/v1/health` status.

### 3. `release.yml` — Automated Releases & Semantic Tagging
- **Triggers:** Tag pushes matching `v*.*.*`.
- **Actions:** Packages compiled artifacts into a compressed release tarball (`metagreenwave-vX.Y.Z.tar.gz`), computes release notes, and publishes an official GitHub Release.

### 4. `codeql.yml` — GitHub Advanced Security SAST
- **Triggers:** Weekly schedule and PRs to main.
- **Actions:** Performs CodeQL semantic security analysis for JavaScript/TypeScript to catch injection, authentication, and cryptography vulnerabilities.

---

## 3. Production Containerization (`Dockerfile` & `docker-compose.prod.yml`)

### Multi-Stage Dockerfile Highlights:
- **Stage 1 (`client-builder`):** Compiles Vite React 18 client into minified static assets.
- **Stage 2 (`server-builder`):** Compiles TypeScript backend into production-ready JavaScript.
- **Stage 3 (`production-runner`):**
  - Base: Minimal, secure `node:20-alpine`.
  - Security Hardening: Runs under non-root user `node`.
  - Process Manager: Uses `tini` as PID 1 for correct Unix signal forwarding and zombie process reaping.
  - Dependencies: Production only (`npm ci --omit=dev`).
  - Healthcheck: Probes `node scripts/healthcheck.js` every 30s.

### Running with Docker Compose in Production:
```bash
# Start MySQL and MetaGreenWave platform containers
docker compose -f docker-compose.prod.yml up -d

# Check live logs
docker compose -f docker-compose.prod.yml logs -f metagreenwave-app

# Inspect running health
docker compose -f docker-compose.prod.yml ps
```

---

## 4. Local Developer CI/CD Commands

You can run the exact same verification pipeline on your local machine before pushing to GitHub:

| Command | Action |
|---|---|
| `npm run ci` | Runs complete CI suite (Typecheck → Build → Core Tests → Enterprise E2E) |
| `npm run ci:local` | Windows PowerShell 1-click CI verification script (`scripts/ci-local.ps1`) |
| `npm run lint` | Runs `tsc --noEmit` across client and server |
| `npm run test:core` | Executes the 22 backend test suites |
| `npm run test:e2e` | Runs the full Enterprise E2E acceptance test suite |
| `npm run docker:build` | Builds production Docker container image locally |
| `npm run docker:prod` | Launches production multi-container environment |

---

## 5. Required GitHub Repository Secrets

Configure the following secrets in GitHub under **Repository Settings → Secrets and variables → Actions**:

| Secret Name | Purpose | Example Value |
|---|---|---|
| `JWT_SECRET` | Cryptographic secret for signing auth tokens | Secure 64-character random string |
| `ENCRYPTION_KEY` | AES-256-GCM key for tenant WABA credentials | 64-hex character string |
| `DATABASE_URL` | Production MySQL connection string | `mysql://user:pass@host:3306/db` |
| `APP_URL` | Public domain URL of the platform | `https://app.metagreenwave.com` |
| `META_APP_ID` | Official Meta Developer App ID | `123456789012345` |
| `META_APP_SECRET`| Official Meta Developer App Secret | `abc123def456...` |
| `META_WEBHOOK_VERIFY_TOKEN` | Webhook verification token | Random secure string |

