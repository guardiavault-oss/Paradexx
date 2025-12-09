# Paradex Platform Startup Script
# This script starts the development environment

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Docker,
    [switch]$All
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           PARADEX WALLET - DEVELOPMENT ENVIRONMENT           ║" -ForegroundColor Cyan  
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check for pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing pnpm..." -ForegroundColor Yellow
    npm install -g pnpm
}

# Default to frontend if no flags
if (-not ($Backend -or $Frontend -or $Docker -or $All)) {
    $Frontend = $true
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    pnpm install
}

# Start services based on flags
if ($All -or $Docker) {
    Write-Host ""
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Blue
    
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        docker-compose up -d
        Write-Host "✅ Docker services started" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Docker not found. Skipping Docker services." -ForegroundColor Yellow
    }
}

if ($All -or $Backend) {
    Write-Host ""
    Write-Host "🔧 Starting backend services..." -ForegroundColor Blue
    
    # Start backend in a new terminal
    Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm run server"
    Write-Host "✅ Backend starting in new terminal (Port 3000)" -ForegroundColor Green
}

if ($All -or $Frontend) {
    Write-Host ""
    Write-Host "🚀 Starting frontend development server..." -ForegroundColor Blue
    Write-Host ""
    Write-Host "╭──────────────────────────────────────────────────────────────╮" -ForegroundColor DarkGray
    Write-Host "│  Frontend:  http://localhost:5173                            │" -ForegroundColor DarkGray
    Write-Host "│  Backend:   https://paradexx-production.up.railway.app       │" -ForegroundColor DarkGray
    Write-Host "╰──────────────────────────────────────────────────────────────╯" -ForegroundColor DarkGray
    Write-Host ""
    
    # Start Vite dev server
    pnpm run dev
}

Write-Host ""
Write-Host "✅ Development environment ready!" -ForegroundColor Green
