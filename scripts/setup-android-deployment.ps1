# Setup Android Deployment for Google Play Store
# This script prepares the project for Android deployment

Write-Host "🚀 Setting up Android Deployment for Paradox Wallet" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Step 1: Install Capacitor
Write-Host "`n📦 Step 1: Installing Capacitor..." -ForegroundColor Yellow
pnpm add -D @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/splash-screen @capacitor/status-bar @capacitor/keyboard @capacitor/app

# Step 2: Initialize Capacitor (if not already initialized)
Write-Host "`n⚙️  Step 2: Initializing Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "capacitor.config.ts")) {
    Write-Host "   Capacitor config already exists, skipping init" -ForegroundColor Gray
} else {
    npx cap init "Paradox Wallet" "io.paradox.wallet" --web-dir=dist
}

# Step 3: Build web app
Write-Host "`n🏗️  Step 3: Building Web App..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
pnpm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed! dist folder not found." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Web app built successfully" -ForegroundColor Green

# Step 4: Add Android platform
Write-Host "`n📱 Step 4: Adding Android Platform..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    npx cap add android
    Write-Host "✅ Android platform added" -ForegroundColor Green
} else {
    Write-Host "✅ Android platform already exists" -ForegroundColor Green
}

# Step 5: Sync Capacitor
Write-Host "`n🔄 Step 5: Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android

Write-Host "`n✅ Setup Complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "   1. Run: .\scripts\deploy-android-playstore.ps1" -ForegroundColor White
Write-Host "   2. Or manually:" -ForegroundColor White
Write-Host "      - Create release keystore" -ForegroundColor Gray
Write-Host "      - Build AAB: cd android && .\gradlew bundleRelease" -ForegroundColor Gray
Write-Host "      - Upload to Google Play Console" -ForegroundColor Gray
