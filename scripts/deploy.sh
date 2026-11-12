#!/usr/bin/env bash
# ==============================================================================
# MetaGreenWave Native Linux VPS Deployment Script (No Docker)
# ==============================================================================
set -e

APP_DIR="${APP_DIR:-/opt/metagreenwave}"
APP_URL="${APP_URL:-http://localhost:5000}"

echo "=========================================================="
echo "🚀 INITIATING METAGREENWAVE PRODUCTION DEPLOYMENT"
echo "=========================================================="
echo "Deployment Path: $APP_DIR"
echo "Timestamp:       $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# 1. Pull latest Git updates
if [ -d "$APP_DIR/.git" ]; then
  echo "📥 Pulling latest git repository changes..."
  cd "$APP_DIR"
  git fetch --all
  git checkout main
  git pull origin main
else
  echo "📥 Cloning repository into $APP_DIR..."
  git clone https://github.com/nnswamyindian/whatsappapi.git "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Install Dependencies & Build Frontend
echo "📦 Building client..."
cd "$APP_DIR/client"
npm install --no-audit
npm run build

# 3. Install Dependencies & Build Backend
echo "📦 Building server..."
cd "$APP_DIR/server"
npm install --no-audit
npm run build

# 4. Restart Application via PM2 or Node
cd "$APP_DIR"
if command -v pm2 &> /dev/null; then
  echo "🔄 Reloading application with PM2..."
  pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production
  pm2 save || true
else
  echo "🔄 Restarting application with Node daemon..."
  pkill -f "node dist/index.js" || true
  sleep 1
  cd "$APP_DIR/server"
  nohup npm start > ../server.log 2>&1 &
  cd "$APP_DIR"
fi

# 5. Post-Deployment Verification Probe
echo "🩺 Verifying application health probe..."
MAX_RETRIES=15
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/v1/health" || true)
  if [ "$STATUS" == "200" ]; then
    HEALTHY=true
    break
  fi
  echo "Attempt $((COUNT+1))/$MAX_RETRIES: HTTP $STATUS. Waiting 3s..."
  sleep 3
  COUNT=$((COUNT+1))
done

if [ "$HEALTHY" = true ]; then
  echo ""
  echo "=========================================================="
  echo "🎉 DEPLOYMENT SUCCEEDED: MetaGreenWave is LIVE and HEALTHY!"
  echo "=========================================================="
  exit 0
else
  echo ""
  echo "❌ CRITICAL: Deployment healthcheck failed after $MAX_RETRIES attempts."
  exit 1
fi
