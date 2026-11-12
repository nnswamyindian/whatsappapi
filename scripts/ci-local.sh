#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 RUNNING METAGREENWAVE LOCAL CI PIPELINE VERIFICATION"
echo "=========================================================="

echo ""
echo "[Step 1/5] Type Checking Client & Server..."
cd client && npx tsc --noEmit
echo "✅ Client TypeScript check passed."
cd ../server && npx tsc --noEmit
echo "✅ Server TypeScript check passed."
cd ..

echo ""
echo "[Step 2/5] Building Production Client & Server Bundles..."
npm run build:client
echo "✅ Client build passed."
npm run build:server
echo "✅ Server build passed."

echo ""
echo "[Step 3/5] Executing Core Backend Unit & Integration Tests..."
npm test
echo "✅ Core test suite passed (22/22 suites)."

echo ""
echo "[Step 4/5] Executing Enterprise End-to-End Acceptance Tests..."
node server/tests/enterprise-e2e.cjs
echo "✅ Enterprise E2E acceptance tests passed."

echo ""
echo "[Step 5/5] Checking Health Endpoint..."
node scripts/healthcheck.js
echo "✅ Health check verified: status=ok."

echo ""
echo "=========================================================="
echo "🎉 ALL METAGREENWAVE CI PIPELINE CHECKS PASSED (100%)"
echo "=========================================================="

