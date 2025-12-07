# Wallet Guard Dashboard - PowerShell Startup Script

Write-Host "🎨 Wallet Guard Dashboard - Starting..." -ForegroundColor Green
Write-Host ""

# Check Node.js version
Write-Host "📋 Checking prerequisites..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if API is running
Write-Host ""
Write-Host "🔍 Checking API connection..." -ForegroundColor Cyan
try {
    $apiHealth = Invoke-WebRequest -Uri "http://localhost:8003/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ API is running on port 8003" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  API is not running on port 8003" -ForegroundColor Yellow
    Write-Host "   Please start the API service first:" -ForegroundColor Yellow
    Write-Host "   python api.py" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check if node_modules exists
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "   ⚠️  Dependencies not installed. Installing..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ✅ Dependencies installed" -ForegroundColor Green
}

# Start the dashboard
Write-Host ""
Write-Host "🚀 Starting dashboard..." -ForegroundColor Cyan
Write-Host "   Dashboard: http://localhost:3003" -ForegroundColor White
Write-Host "   API: http://localhost:8003" -ForegroundColor White
Write-Host ""
Write-Host "   Press Ctrl+C to stop the dashboard" -ForegroundColor Yellow
Write-Host ""

# Start Next.js development server
npm run dev

