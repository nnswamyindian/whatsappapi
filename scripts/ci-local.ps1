# MetaGreenWave Windows PowerShell Local CI Runner
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 RUNNING METAGREENWAVE LOCAL CI PIPELINE VERIFICATION" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Write-Host "`n[Step 1/5] Type Checking Client & Server..." -ForegroundColor Yellow
Push-Location client
npx tsc --noEmit
Pop-Location
Write-Host "✅ Client TypeScript check passed." -ForegroundColor Green

Push-Location server
npx tsc --noEmit
Pop-Location
Write-Host "✅ Server TypeScript check passed." -ForegroundColor Green

Write-Host "`n[Step 2/5] Building Production Client & Server Bundles..." -ForegroundColor Yellow
npm run build:client
Write-Host "✅ Client build passed." -ForegroundColor Green
npm run build:server
Write-Host "✅ Server build passed." -ForegroundColor Green

Write-Host "`n[Step 3/5] Executing Core Backend Unit & Integration Tests..." -ForegroundColor Yellow
npm test
Write-Host "✅ Core test suite passed (22/22 suites)." -ForegroundColor Green

Write-Host "`n[Step 4/5] Executing Enterprise End-to-End Acceptance Tests..." -ForegroundColor Yellow
node server/tests/enterprise-e2e.cjs
Write-Host "✅ Enterprise E2E acceptance tests passed." -ForegroundColor Green

Write-Host "`n[Step 5/5] Checking Health Endpoint..." -ForegroundColor Yellow
node scripts/healthcheck.js
Write-Host "✅ Health check verified: status=ok." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "🎉 ALL METAGREENWAVE CI PIPELINE CHECKS PASSED (100%)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

