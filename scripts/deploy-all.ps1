# Complete Deployment Script
# Run: .\deploy-all.ps1

$ErrorActionPreference = "Continue"

Write-Host "`n🚀 DegenX & GuardianX - Complete Deployment`n" -ForegroundColor Green
Write-Host "=" -Repeat 70 -ForegroundColor Gray
Write-Host ""

# Step 1: Generate Secrets
Write-Host "Step 1: Generating secrets..." -ForegroundColor Cyan
node scripts/generate-secrets.js
Write-Host ""

# Step 2: Railway Backend
Write-Host "Step 2: Railway Backend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray
Set-Location src/backend

Write-Host "`n2a. Checking Railway status..." -ForegroundColor Yellow
railway status

Write-Host "`n2b. Adding PostgreSQL..." -ForegroundColor Yellow
railway add postgresql

Write-Host "`n2c. Setting environment variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set HOST=0.0.0.0

Write-Host "`n2d. Deploying backend..." -ForegroundColor Yellow
Write-Host "This will take 2-5 minutes..." -ForegroundColor Gray
railway up

Write-Host "`n2e. Getting backend URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
$backendUrl = railway domain 2>&1
Write-Host $backendUrl
$backendUrl | Out-File -FilePath "../../.railway-url.txt"

Set-Location ../..

# Step 3: Netlify Frontend
Write-Host "`nStep 3: Netlify Frontend Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

Write-Host "`n3a. Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host "`n3b. Setting Netlify environment..." -ForegroundColor Yellow
if (Test-Path ".railway-url.txt") {
    $railwayUrl = Get-Content ".railway-url.txt" -Raw | ForEach-Object { $_.Trim() }
    $apiUrl = "$railwayUrl/api"
    netlify env:set VITE_API_URL $apiUrl
}

Write-Host "`n3c. Deploying to Netlify..." -ForegroundColor Yellow
Write-Host "This will take 2-5 minutes..." -ForegroundColor Gray
netlify deploy --prod

Write-Host "`n3d. Getting frontend URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$netlifyStatus = netlify status 2>&1
Write-Host $netlifyStatus
$netlifyStatus | Out-File -FilePath ".netlify-status.txt"

# Step 4: Update CORS
Write-Host "`nStep 4: Updating CORS Settings" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

if (Test-Path ".netlify-status.txt" -and Test-Path ".railway-url.txt") {
    Set-Location src/backend
    $netlifyUrl = Get-Content "../.netlify-status.txt" -Raw | Select-String -Pattern "https://[^\s]+\.netlify\.app" | ForEach-Object { $_.Matches.Value }
    $railwayUrl = Get-Content "../.railway-url.txt" -Raw | ForEach-Object { $_.Trim() }
    
    if ($netlifyUrl -and $railwayUrl) {
        Write-Host "`nUpdating CORS..." -ForegroundColor Yellow
        railway variables set FRONTEND_URL=$netlifyUrl
        railway variables set ALLOWED_ORIGINS=$netlifyUrl
        railway variables set APP_URL=$railwayUrl
        railway variables set ORIGIN=$netlifyUrl
    }
    Set-Location ../..
}

# Step 5: Migrations
Write-Host "`nStep 5: Database Migrations" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

Set-Location src/backend
Write-Host "`nRunning migrations..." -ForegroundColor Yellow
railway run npx prisma generate
railway run npx prisma migrate deploy
Set-Location ../..

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" -Repeat 70 -ForegroundColor Gray
Write-Host "`n✅ DEPLOYMENT COMPLETE!`n" -ForegroundColor Green

Write-Host "📊 URLs:" -ForegroundColor Cyan
if (Test-Path ".railway-url.txt") {
    $url = Get-Content ".railway-url.txt" -Raw | ForEach-Object { $_.Trim() }
    Write-Host "  Backend: $url" -ForegroundColor White
}
if (Test-Path ".netlify-status.txt") {
    $url = Get-Content ".netlify-status.txt" -Raw | Select-String -Pattern "https://[^\s]+\.netlify\.app" | ForEach-Object { $_.Matches.Value }
    if ($url) {
        Write-Host "  Frontend: $url" -ForegroundColor White
    }
}

Write-Host "`n⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Set remaining Railway variables (see RUN_THESE_COMMANDS.md)" -ForegroundColor Gray
Write-Host "  2. Configure Stripe webhook" -ForegroundColor Gray
Write-Host "  3. Test your deployment`n" -ForegroundColor Gray

