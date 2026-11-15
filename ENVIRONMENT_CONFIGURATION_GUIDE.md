# MetaGreenWave Environment Configuration Guide

**Platform:** MetaGreenWave  
**Operator:** Digi8 Solutions  
**Target:** Local Development & Production Linux VPS  

---

## 1. Overview

This document provides a comprehensive reference for all configuration variables used by the MetaGreenWave server and client applications. It includes instructions for cryptographically generating secrets, setting up Meta WhatsApp credentials, and configuring enterprise database connectivity.

---

## 2. Server Environment Variables (`server/.env`)

| Variable | Required | Type | Example / Default | Description |
| :--- | :---: | :---: | :--- | :--- |
| `NODE_ENV` | Yes | string | `production` / `development` | Runtime environment mode. Controls error reporting and optimizations. |
| `PORT` | Yes | number | `5000` | Port on which the Express server listens. |
| `PUBLIC_URL` | Yes | URL | `https://metagreenwave.com` | Canonical public HTTPS base URL for webhook responses and emails. |
| `DB_HOST` | Yes | string | `127.0.0.1` | MySQL server host address. |
| `DB_PORT` | Yes | number | `3306` | MySQL server port. |
| `DB_USER` | Yes | string | `greenwave` | MySQL database user. |
| `DB_PASSWORD` | Yes | string | `[SecretPassword]` | MySQL database user password. |
| `DB_NAME` | Yes | string | `greenwave_db` | MySQL relational database name. |
| `JWT_SECRET` | Yes | string | `[64-Byte Random]` | Secret key used for signing and verifying JWT tokens. |
| `JWT_EXPIRES_IN` | No | string | `7d` | Token validity duration. |
| `ENCRYPTION_KEY` | Yes | hex string | `[64 Hex Characters]` | 32-byte AES-256-GCM master encryption key for secrets at rest. |
| `META_APP_ID` | Yes | string | `102938475610293` | Official Meta App ID from Meta Developer Dashboard. |
| `META_APP_SECRET` | Yes | string | `[32-Char Hex]` | Official Meta App Secret from Meta Developer Dashboard. |
| `META_CONFIG_ID` | Yes | string | `987654321012345` | Configuration ID for WhatsApp Embedded Signup v4. |
| `META_API_VERSION` | No | string | `v21.0` | Meta Graph API version. |
| `META_WEBHOOK_VERIFY_TOKEN` | Yes | string | `[HighEntropyToken]` | Token verified during Meta webhook challenge handshake. |
| `META_ACCESS_TOKEN` | Optional | string | `EAAB...` | Platform admin fallback token for manual sandbox testing. |

---

## 3. Cryptographic Secret Generation Commands

### 3.1 Generate Master AES-256-GCM Encryption Key (32 Bytes / 64 Hex Characters)
Run the following Node.js command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*Copy the 64-character output into `ENCRYPTION_KEY`.*

### 3.2 Generate High-Entropy JWT Secret (64 Bytes Base64)
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```
*Copy the output into `JWT_SECRET`.*

### 3.3 Generate Webhook Verify Token
```bash
node -e "console.log('gw_verify_' + require('crypto').randomBytes(16).toString('hex'))"
```
*Copy into `META_WEBHOOK_VERIFY_TOKEN`.*

---

## 4. Client Environment Variables (`client/.env`)

When deploying in standard production, the client bundle is served directly by the Express backend on the same origin (Zero-CORS architecture). If running a standalone Vite development server, the following variables apply:

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | No | `/api/v1` | Base API route prefix. Defaults to `/api/v1` when served from the same host. |

---

## 5. Security & Handling Precautions

> [!CAUTION]
> 1. Never commit `.env` files to Git version control. `.env` is explicitly ignored in `.gitignore`.
> 2. Back up `ENCRYPTION_KEY` securely. If this key is lost, all customer WhatsApp tokens in `whatsapp_connections` become permanently unrecoverable.
> 3. Rotate `JWT_SECRET` only during maintenance windows, as rotating it invalidates all active user sessions.
