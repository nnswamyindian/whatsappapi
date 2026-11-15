# MetaGreenWave Production Deployment Checklist

**Application:** MetaGreenWave by Digi8 Solutions  
**Target Environment:** Linux VPS (Ubuntu 22.04 / 24.04 LTS)  
**Architecture:** Single-Port Production Service (Port 5000 / 5021 Behind Nginx) + Enterprise MySQL  

---

## 1. Pre-Deployment Verification

### 1.1 Source Code & Build Verification
- [ ] Working tree is clean on Git `main` branch.
- [ ] Client builds with zero TypeScript errors: `cd client && npm run build`.
- [ ] Server compiles with zero TypeScript errors: `cd server && npm run build`.
- [ ] All 22 backend verification suites pass: `cd server && npm test`.
- [ ] Enterprise E2E lifecycle test passes: `node server/tests/enterprise-e2e.cjs`.
- [ ] No hardcoded development secrets, tokens, or mock IDs exist in source files.

### 1.2 Infrastructure Prerequisites
- [ ] Linux VPS provisioned with minimum 2 CPU cores and 4GB RAM.
- [ ] Node.js v20+ LTS installed: `node -v`.
- [ ] PM2 process manager installed globally: `npm install -g pm2`.
- [ ] Nginx web server installed and active: `sudo systemctl status nginx`.
- [ ] MySQL 8.0+ server installed and running: `sudo systemctl status mysql`.
- [ ] Domain DNS A records pointing to VPS public IP:
  - `metagreenwave.com`
  - `www.metagreenwave.com`
- [ ] SSL certificate provisioned via Let's Encrypt / Certbot:
  ```bash
  sudo certbot --nginx -d metagreenwave.com -d www.metagreenwave.com
  ```

---

## 2. Server Environment Configuration (`server/.env`)

Verify all environment variables are securely generated and populated on the VPS:
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `PUBLIC_URL=https://metagreenwave.com`
- [ ] `DB_HOST=127.0.0.1`
- [ ] `DB_PORT=3306`
- [ ] `DB_USER=greenwave`
- [ ] `DB_PASSWORD=[StrongProductionPassword]`
- [ ] `DB_NAME=greenwave_db`
- [ ] `JWT_SECRET=[Generated64ByteSecret]`
- [ ] `ENCRYPTION_KEY=[Generated32ByteHexKey]` (Must be 64 hexadecimal characters for AES-256-GCM)
- [ ] `META_APP_ID=[OfficialMetaAppId]`
- [ ] `META_APP_SECRET=[OfficialMetaAppSecret]`
- [ ] `META_WEBHOOK_VERIFY_TOKEN=[HighEntropyVerifyToken]`
- [ ] `META_CONFIG_ID=[EmbeddedSignupConfigurationId]`
- [ ] `META_API_VERSION=v21.0`

---

## 3. Database Initialization & Hardening

1. **Create MySQL Production User & Database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS greenwave_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'greenwave'@'127.0.0.1' IDENTIFIED BY 'STRONG_SECRET_PASSWORD';
   GRANT ALL PRIVILEGES ON greenwave_db.* TO 'greenwave'@'127.0.0.1';
   FLUSH PRIVILEGES;
   ```
2. **Schema Migration:**
   ```bash
   cd /var/www/metagreenwave/server
   node dist/index.js --migrate-only
   ```
3. **Verify Table Count:**
   - Confirm 27 tables exist in `greenwave_db`, including `webhook_events`, `policy_consents`, and `data_deletion_requests`.

---

## 4. Nginx Reverse Proxy & SSL Configuration

Ensure `/etc/nginx/sites-available/metagreenwave` contains security-hardened headers:
```nginx
server {
    server_name metagreenwave.com www.metagreenwave.com;

    # SSL configuration managed by Certbot
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/metagreenwave.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metagreenwave.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Max body size for media attachments
    client_max_body_size 64M;

    # Proxy to Node.js backend
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

        # Disable buffering for Server-Sent Events (SSE)
        proxy_buffering off;
        proxy_read_timeout 86400s;
    }
}
```

---

## 5. PM2 Cluster Deployment & Process Management

1. **Build Client and Server:**
   ```bash
   cd /var/www/metagreenwave/client && npm run build
   cd /var/www/metagreenwave/server && npm run build
   ```
2. **Start PM2 Cluster:**
   ```bash
   cd /var/www/metagreenwave/server
   pm2 start dist/index.js --name "metagreenwave-api" -i max
   pm2 save
   pm2 startup
   ```

---

## 6. Post-Deployment Verification

- [ ] `https://metagreenwave.com/api/v1/health` returns `{"status":"ok","database":"connected"}`.
- [ ] Landing page loads over HTTPS with zero console errors.
- [ ] Public Legal & Compliance Pages verified:
  - `/privacy-policy`
  - `/terms-of-service`
  - `/data-deletion`
  - `/cookies`
  - `/acceptable-use`
  - `/cancellation-refund`
  - `/security`
  - `/status`
- [ ] Inbound Meta Webhook verification test:
  - `GET /api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=[TOKEN]`
  - Returns `test123` with HTTP 200.
- [ ] Data Deletion Portal tested:
  - Submit request at `/data-deletion` and verify code lookup at `/api/v1/meta/data-deletion/status/:code`.
- [ ] Embedded Signup popup opens and connects with valid credentials.
