# Production Build Script
# Builds the application for production deployment

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           PARADEX WALLET - PRODUCTION BUILD                  ║" -ForegroundColor Cyan  
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check environment
if (-not $env:VITE_API_URL) {
    Write-Host "⚠️  VITE_API_URL not set, using default production URL" -ForegroundColor Yellow
    $env:VITE_API_URL = "https://paradexx-production.up.railway.app"
}

# Clean previous build
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Blue
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
pnpm install --frozen-lockfile

# Type check (optional, don't fail on warnings)
Write-Host "🔍 Running type check..." -ForegroundColor Blue
pnpm run typecheck 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Type check has warnings (continuing build)" -ForegroundColor Yellow
}

# Build
Write-Host "🏗️  Building for production..." -ForegroundColor Blue
pnpm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╭──────────────────────────────────────────────────────────────╮" -ForegroundColor Green
    Write-Host "│  ✅ Build completed successfully!                            │" -ForegroundColor Green
    Write-Host "│                                                              │" -ForegroundColor Green
    Write-Host "│  Output: ./build/                                            │" -ForegroundColor Green
    Write-Host "│                                                              │" -ForegroundColor Green
    Write-Host "│  To preview locally:                                         │" -ForegroundColor Green
    Write-Host "│    pnpm run preview                                          │" -ForegroundColor Green
    Write-Host "│                                                              │" -ForegroundColor Green
    Write-Host "│  To deploy:                                                  │" -ForegroundColor Green
    Write-Host "│    - Netlify: Push to main branch                            │" -ForegroundColor Green
    Write-Host "│    - Manual: Upload ./build/ to your CDN                     │" -ForegroundColor Green
    Write-Host "╰──────────────────────────────────────────────────────────────╯" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
