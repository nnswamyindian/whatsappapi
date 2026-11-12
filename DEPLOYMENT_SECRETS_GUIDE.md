# MetaGreenWave — VPS Deployment Secrets & Variables Guide

This guide explains how to configure GitHub Repository Secrets and Variables to enable automated Continuous Deployment (CD) to your VPS via SSH on every push or release tag.

---

## 1. Required GitHub Secrets

Navigate to your GitHub repository:
**Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **New repository secret**

Add the following secrets:

| Secret Name | Accepted Aliases | Description | Example |
| :--- | :--- | :--- | :--- |
| `VPS_HOST` | `HOST` | The public IP address or domain name of your VPS server | `194.164.55.12` or `vps.metagreenwave.com` |
| `VPS_USER` | `USERNAME` | The SSH username with permissions to run Docker on the VPS | `root` or `ubuntu` |
| `VPS_SSH_KEY` | `SSH_KEY`, `SSH_PRIVATE_KEY`, `SSHKEY` | The private SSH key used to authenticate with your VPS | `-----BEGIN OPENSSH PRIVATE KEY...` |

> [!NOTE]
> The workflow accepts `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY` or any of their aliases (`HOST`, `USERNAME`, `SSH_KEY`, `SSH_PRIVATE_KEY`, `SSHKEY`) interchangeably.

---

## 2. Optional GitHub Variables / Configuration

Under **Settings** &rarr; **Secrets and variables** &rarr; **Actions** &rarr; **Variables** (or Secrets), you can optionally customize:

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `VPS_PORT` | `22` | SSH port of your VPS (e.g. `22` or custom port like `2222`) |
| `VPS_DEPLOY_PATH` | `/opt/metagreenwave` | Directory on your VPS where MetaGreenWave is located |
| `APP_URL` | `http://localhost:5000` | Public URL for post-deployment health verification |

---

## 3. How to Generate an SSH Key Pair for GitHub Actions

If you don't already have a dedicated SSH key for deployment:

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
# On your VPS:
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
<PASTE CONTENTS OF metagreenwave_deploy.pub HERE>
EOF
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Ensure User Can Run Docker Without Sudo
If your `VPS_USER` is not `root` (e.g. `ubuntu`):
```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 4. How the Automated Deployment Operates

When you push to `main` or push a release tag `v*.*.*`:
1. **Build & Test**: GitHub Actions runs TypeScript checks, builds Vite client & server, and runs all 22 test suites and E2E checks.
2. **Container Registry**: Packages production Docker image and pushes to `ghcr.io/nnswamyindian/whatsappapi:latest`.
3. **SSH Deployment**:
   - Reads `VPS_HOST`, `VPS_USER`, and `VPS_SSH_KEY`.
   - Connects securely to the VPS over SSH.
   - Logs into GitHub Container Registry (`ghcr.io`).
   - Pulls the newest container image.
   - Restarts the application service with zero-downtime using `docker compose` or standalone container.
   - Polls `/api/v1/health` until the service returns HTTP 200 OK.
   - Cleans up stale container images (`docker image prune -f`).

If the VPS secrets are not yet added, the pipeline safely falls back to logging an activation guide without failing the CI pipeline.
