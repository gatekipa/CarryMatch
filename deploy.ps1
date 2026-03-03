# ============================================================
#  CarryMatch - Full Deployment Script
#  Run from: carry-match-fresh root folder
# ============================================================

Write-Host ""
Write-Host "=== CarryMatch Full Deployment ===" -ForegroundColor Cyan

# Step 1: Deploy entities + functions
Write-Host ""
Write-Host "[1/3] Deploying entities + functions..." -ForegroundColor Yellow
base44 deploy -y
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Deploy failed! Check errors above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  Backend deployed!" -ForegroundColor Green

# Step 2: Build frontend
Write-Host ""
Write-Host "[2/3] Building frontend..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  npm install failed!" -ForegroundColor Red
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build complete!" -ForegroundColor Green

# Step 3: Deploy site
Write-Host ""
Write-Host "[3/3] Deploying site..." -ForegroundColor Yellow
base44 site deploy -y
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Site deploy failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
