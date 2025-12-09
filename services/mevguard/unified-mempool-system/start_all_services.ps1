# PowerShell script to start all mempool services
# Start All Mempool Services

Write-Host "🚀 Starting All Mempool Services..." -ForegroundColor Yellow

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Create logs directory
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Function to start a service
function Start-Service {
    param(
        [string]$ServiceName,
        [string]$Command,
        [int]$Port
    )
    
    Write-Host "Starting $ServiceName on port $Port..." -ForegroundColor Yellow
    
    $logFile = "logs\$ServiceName.log"
    $pidFile = "logs\$ServiceName.pid"
    
    # Start process in background
    $process = Start-Process -FilePath "python" -ArgumentList "-c", $Command `
        -NoNewWindow -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
    
    # Save PID
    $process.Id | Out-File $pidFile
    
    Write-Host "✅ $ServiceName started (PID: $($process.Id))" -ForegroundColor Green
    Write-Host "   Logs: $logFile" -ForegroundColor Gray
    
    Start-Sleep -Seconds 2
}

# Start mempool-core
Start-Service -ServiceName "mempool-core" `
    -Command "import sys; sys.path.insert(0, 'src/unified_mempool/mempool-core/app'); from api.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)" `
    -Port 8000

# Start mempool-hub
Start-Service -ServiceName "mempool-hub" `
    -Command "import sys; sys.path.insert(0, 'src/unified_mempool/mempool-hub'); from app import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8011)" `
    -Port 8011

# Start unified-engine
Start-Service -ServiceName "unified-engine" `
    -Command "import sys; sys.path.insert(0, '.'); from api.unified_api_gateway import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8001)" `
    -Port 8001

Write-Host ""
Write-Host "🎉 All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:"
Write-Host "  - mempool-core:    http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - mempool-hub:     http://localhost:8011" -ForegroundColor Cyan
Write-Host "  - unified-engine:  http://localhost:8001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check logs:"
Write-Host "  Get-Content logs\mempool-core.log -Tail 20 -Wait"
Write-Host "  Get-Content logs\mempool-hub.log -Tail 20 -Wait"
Write-Host "  Get-Content logs\unified-engine.log -Tail 20 -Wait"


