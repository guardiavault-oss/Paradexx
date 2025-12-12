# Redeploy Backend to Railway
# This script redeploys the Paradexx backend service

Write-Host "Redeploying Backend to Railway" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Check Railway CLI
Write-Host "`nChecking Railway CLI..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "ERROR: Railway CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "`nChecking Railway connection..." -ForegroundColor Yellow
$status = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not connected to Railway project!" -ForegroundColor Red
    Write-Host "Run: railway login" -ForegroundColor Yellow
    Write-Host "Then: railway link" -ForegroundColor Yellow
    exit 1
}

Write-Host $status -ForegroundColor Green

# Get current domain
Write-Host "`nCurrent Railway URL:" -ForegroundColor Yellow
$domain = railway domain 2>&1
Write-Host $domain -ForegroundColor Cyan

# Redeploy
Write-Host "`nRedeploying backend..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

railway up --detach

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: Deployment started!" -ForegroundColor Green
    Write-Host "`nMonitor deployment:" -ForegroundColor Yellow
    Write-Host "   railway logs --tail 50" -ForegroundColor Cyan
    Write-Host "   Or check Railway dashboard: https://railway.app" -ForegroundColor Cyan
    
    Write-Host "`nWaiting 5 seconds for deployment to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host "`nRecent logs:" -ForegroundColor Yellow
    railway logs --tail 20
} else {
    Write-Host "`nERROR: Deployment failed!" -ForegroundColor Red
    Write-Host "Check Railway dashboard for details" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDeployment Status:" -ForegroundColor Yellow
Write-Host "   Project: ideal-success" -ForegroundColor White
Write-Host "   Service: Paradexx" -ForegroundColor White
Write-Host "   Environment: production" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "   1. Wait for deployment to complete" -ForegroundColor White
Write-Host "   2. Test health endpoint: curl $domain/health" -ForegroundColor White
Write-Host "   3. Update mobile app config with Railway URL" -ForegroundColor White
Write-Host "   4. Rebuild mobile app: npm run build" -ForegroundColor White
