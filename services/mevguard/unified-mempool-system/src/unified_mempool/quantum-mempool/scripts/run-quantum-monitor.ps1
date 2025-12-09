# Main startup script for Quantum Mempool Monitor

param(
    [switch]$BuildOnly,
    [switch]$Clean,
    [switch]$Minimal
)

Write-Host "Quantum Mempool Monitor Startup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if Docker is running
$dockerStatus = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Clean up if requested
if ($Clean) {
    Write-Host "`nCleaning up existing containers and volumes..." -ForegroundColor Yellow
    docker compose down -v
    docker rm -f quantum-monitor 2>$null
}

# Setup directories
Write-Host "`nSetting up directories..." -ForegroundColor Green
& "$PSScriptRoot\setup-directories.ps1"

# Check for .env file
if (!(Test-Path ".env")) {
    Write-Host "`nERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with required environment variables." -ForegroundColor Yellow
    exit 1
}

# Build the main application image
Write-Host "`nBuilding Docker image..." -ForegroundColor Green
docker build -f Dockerfile.ultimate -t ultimate-quantum-monitor:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed!" -ForegroundColor Red
    exit 1
}

if ($BuildOnly) {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    exit 0
}

# Start services
if ($Minimal) {
    Write-Host "`nStarting minimal services (quantum-monitor, postgres, redis)..." -ForegroundColor Green
    docker compose up -d quantum-monitor postgres redis
} else {
    Write-Host "`nStarting all services..." -ForegroundColor Green
    docker compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start services!" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "`nWaiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "`nChecking service health..." -ForegroundColor Green
docker compose ps

# Display access URLs
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Services are running!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Main Application: http://localhost:8001" -ForegroundColor Yellow
Write-Host "Dashboard: http://localhost:8081" -ForegroundColor Yellow
Write-Host "Grafana: http://localhost:3000 (admin/${env:GRAFANA_PASSWORD})" -ForegroundColor Yellow
Write-Host "Kibana: http://localhost:5601" -ForegroundColor Yellow
Write-Host "Jaeger UI: http://localhost:16686" -ForegroundColor Yellow
Write-Host "`nView logs: docker compose logs -f quantum-monitor" -ForegroundColor Gray
Write-Host "Stop all: docker compose down" -ForegroundColor Gray
