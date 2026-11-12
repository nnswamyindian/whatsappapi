# MetaGreenWave — VPS Deployment Secrets & Variables Guide (Native Node.js / PM2)

This guide explains how to configure GitHub Repository Secrets and Variables to enable automated Continuous Deployment (CD) directly to your Linux VPS via SSH on every push or release tag without Docker.

---

## 1. Required GitHub Secrets

Navigate to your GitHub repository in your browser:
**Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **New repository secret**

Add the following secrets:

| Secret Name | Accepted Aliases | Description | Example |
| :--- | :--- | :--- | :--- |
| `VPS_HOST` | `HOST` | The public IP address or domain name of your VPS server | `194.164.55.12` or `vps.metagreenwave.com` |
| `VPS_USER` | `USERNAME` | The SSH username with deploy permissions (e.g. `root` or `ubuntu`) | `root` or `ubuntu` |
| `VPS_SSH_KEY` | `SSH_KEY`, `SSH_PRIVATE_KEY`, `SSHKEY` | The private SSH key used to authenticate with your VPS | `-----BEGIN OPENSSH PRIVATE KEY...` |

> [!NOTE]
> The workflow accepts `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` or any of their aliases (`HOST`, `USERNAME`, `SSH_KEY`, `SSH_PRIVATE_KEY`, `SSHKEY`) interchangeably.

---

## 2. Optional GitHub Variables / Configuration

Under **Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **Variables** (or Secrets), you can optionally customize:

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `VPS_PORT` | `22` | SSH port of your VPS (e.g. `22` or custom port like `2222`) |
| `VPS_DEPLOY_PATH` | `/opt/metagreenwave` | Directory on your VPS where MetaGreenWave is deployed |
| `APP_URL` | `http://localhost:5000` | Public URL for post-deployment health verification |

---

## 3. How to Set Up Your VPS (One-Time Setup)

On your Ubuntu/Debian VPS, install Node.js (v20+ or v22+) and PM2:

```bash
# 1. Install Node.js 20 or 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git curl

# 2. Install PM2 process manager globally
sudo npm install -g pm2

# 3. Create the deployment directory
sudo mkdir -p /opt/metagreenwave
sudo chown -R $USER:$USER /opt/metagreenwave
```

---

## 4. How to Generate an SSH Key Pair for GitHub Actions

### Step 1: Generate Key Pair on your local machine or VPS
```bash
ssh-keygen -t ed25519 -C "github-actions@metagreenwave" -f ~/.ssh/metagreenwave_deploy -N ""
```
This generates two files:
- `metagreenwave_deploy` (Private Key &rarr; Add this to GitHub Secret **`VPS_SSH_KEY`**)
- `metagreenwave_deploy.pub` (Public Key &rarr; Install this on your VPS)

### Step 2: Authorize Public Key on your VPS
Log in to your VPS and add the public key to `~/.ssh/authorized_keys`:
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
<PASTE CONTENTS OF metagreenwave_deploy.pub HERE>
EOF
chmod 600 ~/.ssh/authorized_keys
```

---

## 5. How the Automated Deployment Operates

When you push to `main` or trigger the workflow:
1. **Typecheck**: Checks TypeScript code in client and server on Node 20.x & 22.x.
2. **Build**: Compiles production assets for client & server.
3. **Automated Testing**: Runs all 22 backend suites, starts the server, verifies health probe, and runs Enterprise E2E + Template Media upload test suites.
4. **Security Scan**: Checks npm dependencies.
5. **Direct SSH Deployment (No Docker)**:
   - Connects securely to the VPS over SSH using your `VPS_SSH_KEY`.
   - Pulls newest code updates into `VPS_DEPLOY_PATH`.
   - Installs client and server dependencies.
   - Builds frontend and backend production bundles.
   - Restarts application zero-downtime using PM2 (`pm2 reload ecosystem.config.cjs`).
   - Verifies the local healthcheck probe (`/api/v1/health` returns HTTP 200).
6. **Release**: Automatically packages tarball and publishes a GitHub Release for version tags (`v*.*.*`).
