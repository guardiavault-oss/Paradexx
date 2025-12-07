# Complete Deployment Script for Railway and Netlify
# Run this script to deploy your app

Write-Host "`n🚀 DegenX & GuardianX Wallet - Complete Deployment`n" -ForegroundColor Green
Write-Host "=" -Repeat 70 -ForegroundColor Gray
Write-Host ""

# Step 1: Generate Secrets
Write-Host "Step 1: Generating production secrets..." -ForegroundColor Cyan
node scripts/generate-secrets.js
Write-Host ""

# Step 2: Railway Backend Setup
Write-Host "Step 2: Setting up Railway backend..." -ForegroundColor Cyan
cd src/backend

# Check if Railway project exists
if (-not (Test-Path ".railway")) {
    Write-Host "Initializing Railway project..." -ForegroundColor Yellow
    railway init --name degenx-backend
}

# Add PostgreSQL if not exists
Write-Host "Adding PostgreSQL database..." -ForegroundColor Yellow
railway add postgresql

# Set basic environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set HOST=0.0.0.0

# Deploy backend
Write-Host "Deploying backend (this may take a few minutes)..." -ForegroundColor Yellow
railway up --detach

# Get backend URL
Write-Host "Getting backend URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
$backendUrl = railway domain 2>&1 | Select-String -Pattern "https://[^\s]+" | ForEach-Object { $_.Matches.Value } | Select-Object -First 1
if ($backendUrl) {
    Write-Host "✅ Backend URL: $backendUrl" -ForegroundColor Green
    $env:RAILWAY_BACKEND_URL = $backendUrl
} else {
    Write-Host "⚠️  Backend URL not available yet. Check Railway dashboard." -ForegroundColor Yellow
}

cd ../..

# Step 3: Netlify Frontend Setup
Write-Host "`nStep 3: Setting up Netlify frontend..." -ForegroundColor Cyan

# Check if Netlify project exists
if (-not (Test-Path ".netlify")) {
    Write-Host "Initializing Netlify project..." -ForegroundColor Yellow
    netlify init --manual
}

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

# Set environment variables
if ($env:RAILWAY_BACKEND_URL) {
    Write-Host "Setting Netlify environment variables..." -ForegroundColor Yellow
    $apiUrl = "$env:RAILWAY_BACKEND_URL/api"
    netlify env:set VITE_API_URL $apiUrl
}

# Deploy frontend
Write-Host "Deploying frontend (this may take a few minutes)..." -ForegroundColor Yellow
netlify deploy --prod

# Get frontend URL
Write-Host "Getting frontend URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$frontendUrl = netlify status --json 2>&1 | ConvertFrom-Json | Select-Object -ExpandProperty siteUrl -ErrorAction SilentlyContinue
if (-not $frontendUrl) {
    $netlifyStatus = netlify status 2>&1
    $frontendUrl = $netlifyStatus | Select-String -Pattern "https://[^\s]+" | ForEach-Object { $_.Matches.Value } | Select-Object -First 1
}
if ($frontendUrl) {
    Write-Host "✅ Frontend URL: $frontendUrl" -ForegroundColor Green
    $env:NETLIFY_FRONTEND_URL = $frontendUrl
} else {
    Write-Host "⚠️  Frontend URL not available yet. Check Netlify dashboard." -ForegroundColor Yellow
}

# Step 4: Update CORS
if ($env:NETLIFY_FRONTEND_URL -and $env:RAILWAY_BACKEND_URL) {
    Write-Host "`nStep 4: Updating CORS settings..." -ForegroundColor Cyan
    cd src/backend
    railway variables set FRONTEND_URL=$env:NETLIFY_FRONTEND_URL
    railway variables set ALLOWED_ORIGINS=$env:NETLIFY_FRONTEND_URL
    railway variables set APP_URL=$env:RAILWAY_BACKEND_URL
    railway variables set ORIGIN=$env:NETLIFY_FRONTEND_URL
    Write-Host "✅ CORS settings updated" -ForegroundColor Green
    cd ../..
}

# Step 5: Run Migrations
Write-Host "`nStep 5: Running database migrations..." -ForegroundColor Cyan
cd src/backend
railway run npx prisma generate
railway run npx prisma migrate deploy
Write-Host "✅ Migrations completed" -ForegroundColor Green
cd ../..

# Step 6: Test Deployment
Write-Host "`nStep 6: Testing deployment..." -ForegroundColor Cyan
if ($env:RAILWAY_BACKEND_URL) {
    try {
        $response = Invoke-WebRequest -Uri "$env:RAILWAY_BACKEND_URL/health" -Method GET -TimeoutSec 10 -UseBasicParsing
        Write-Host "✅ Backend is healthy!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend health check failed" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n" -NoNewline
Write-Host "=" -Repeat 70 -ForegroundColor Gray
Write-Host "`n🎉 DEPLOYMENT COMPLETE!`n" -ForegroundColor Green

Write-Host "📊 Summary:" -ForegroundColor Cyan
if ($env:RAILWAY_BACKEND_URL) {
    Write-Host "  Backend: $env:RAILWAY_BACKEND_URL" -ForegroundColor White
} else {
    Write-Host "  Backend: Check Railway dashboard" -ForegroundColor Yellow
}
if ($env:NETLIFY_FRONTEND_URL) {
    Write-Host "  Frontend: $env:NETLIFY_FRONTEND_URL" -ForegroundColor White
} else {
    Write-Host "  Frontend: Check Netlify dashboard" -ForegroundColor Yellow
}

Write-Host "`n⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Set remaining Railway environment variables (see DEPLOYMENT_COMPLETE_TERMINAL.md)" -ForegroundColor Gray
Write-Host "  2. Configure Stripe webhook" -ForegroundColor Gray
Write-Host "  3. Test all features" -ForegroundColor Gray

Write-Host "`n"

