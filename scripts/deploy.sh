#!/usr/bin/env bash
# ==============================================================================
# MetaGreenWave Automated Production Deployment Script
# ==============================================================================
set -e

APP_DIR="${APP_DIR:-/opt/metagreenwave}"
DOCKER_COMPOSE_FILE="${DOCKER_COMPOSE_FILE:-docker-compose.prod.yml}"
APP_URL="${APP_URL:-http://localhost:5000}"

echo "=========================================================="
echo "🚀 INITIATING METAGREENWAVE PRODUCTION DEPLOYMENT"
echo "=========================================================="
echo "Deployment Path: $APP_DIR"
echo "Compose File:    $DOCKER_COMPOSE_FILE"
echo "Timestamp:       $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo ""

# 1. Pull latest Git updates or Docker image
if [ -d "$APP_DIR/.git" ]; then
  echo "📥 Pulling latest git repository changes..."
  cd "$APP_DIR"
  git fetch --all
  git checkout main
  git pull origin main
fi

# 2. Build or Pull Production Docker Containers
echo "🐳 Building/Pulling Docker containers..."
docker compose -f "$DOCKER_COMPOSE_FILE" pull || true
docker compose -f "$DOCKER_COMPOSE_FILE" build metagreenwave-app

# 3. Start Database Service & Await Health
echo "🗄️ Ensuring MySQL database is up & healthy..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d mysql

echo "Waiting for MySQL health status..."
until [ "`docker inspect -f {{.State.Health.Status}} metagreenwave-mysql 2>/dev/null`"=="healthy" ]; do
    sleep 3
    echo -n "."
done
echo "✅ MySQL is healthy."

# 4. Zero-Downtime Application Rollout
echo "🔄 Rolling out metagreenwave-app container..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d --no-deps metagreenwave-app

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
  echo "Attempt $((COUNT+1))/$MAX_RETRIES: HTTP $STATUS. Waiting 4s..."
  sleep 4
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
  echo "Inspect container logs: docker compose -f $DOCKER_COMPOSE_FILE logs metagreenwave-app"
  exit 1
fi

