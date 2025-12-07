# Comprehensive Docker-Based Platform Startup Script
# Starts all services using Docker Compose for maximum reliability

param(
    [switch]$SkipFastAPI,
    [switch]$SkipFrontend,
    [switch]$BuildOnly
)

$ErrorActionPreference = "Continue"
$PWD = Get-Location

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Docker Platform Startup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check Docker availability
Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
$dockerAvailable = $false
try {
    $null = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "  [Docker] Available" -ForegroundColor Green
    }
} catch {
    Write-Host "  [Docker] Not available" -ForegroundColor Red
    exit 1
}

if (-not $dockerAvailable) {
    Write-Host "Docker is required but not available. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Step 2: Stop existing containers
Write-Host "`nStep 2: Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml down 2>&1 | Out-Null
Write-Host "  Existing containers stopped" -ForegroundColor Green

# Step 3: Start PostgreSQL and Redis
Write-Host "`nStep 3: Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml up -d postgres redis 2>&1 | Out-Null

Write-Host "  Waiting for databases to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Verify PostgreSQL
$pgReady = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $result = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pgReady = $true
            Write-Host "  [PostgreSQL] Ready" -ForegroundColor Green
            break
        }
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $pgReady) {
    Write-Host "  [PostgreSQL] Still initializing..." -ForegroundColor Yellow
}

# Verify Redis
try {
    $redisResult = docker exec degenx-redis redis-cli ping 2>&1
    if ($redisResult -match "PONG") {
        Write-Host "  [Redis] Ready" -ForegroundColor Green
    } else {
        Write-Host "  [Redis] Check failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [Redis] Check failed" -ForegroundColor Yellow
}

# Step 4: Start TypeScript Backend in Docker (optional)
Write-Host "`nStep 4: Starting TypeScript Backend..." -ForegroundColor Yellow
if ($BuildOnly) {
    Write-Host "  Building backend image..." -ForegroundColor Cyan
    docker-compose -f docker-compose.simple.yml build backend 2>&1 | Out-Null
    Write-Host "  [Backend] Image built" -ForegroundColor Green
} else {
    docker-compose -f docker-compose.simple.yml up -d backend 2>&1 | Out-Null
    Write-Host "  [Backend] Starting in Docker..." -ForegroundColor Cyan
    
    # Wait for backend health check
    $backendHealthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
            $backendHealthy = $true
            Write-Host "  [Backend] Healthy" -ForegroundColor Green
            break
        } catch {
            Start-Sleep -Seconds 2
            if ($i % 5 -eq 0) {
                Write-Host "  [Backend] Waiting... ($($i * 2)/60 seconds)" -ForegroundColor Gray
            }
        }
    }
    
    if (-not $backendHealthy) {
        Write-Host "  [Backend] May still be starting (check logs: docker logs degenx-backend)" -ForegroundColor Yellow
    }
}

# Step 5: Start FastAPI Backend (local, not Docker)
if (-not $SkipFastAPI) {
    Write-Host "`nStep 5: Starting FastAPI Backend (local)..." -ForegroundColor Yellow
    
    # Stop any existing FastAPI processes
    $ports = @(8000)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    $pythonAvailable = $false
    try {
        $null = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonAvailable = $true
        }
    } catch {
        Write-Host "  [FastAPI] Python not found" -ForegroundColor Red
    }
    
    if ($pythonAvailable) {
        Write-Host "  [FastAPI] Starting..." -ForegroundColor Cyan
        $fastApiJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            $env:LOG_LEVEL = "INFO"
            $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
            $env:REDIS_URL = "redis://localhost:6379"
            python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000 --reload 2>&1
        }
        
        Write-Host "  [FastAPI] Job started (ID: $($fastApiJob.Id))" -ForegroundColor Gray
        
        # Wait for FastAPI
        Start-Sleep -Seconds 5
        $fastApiHealthy = $false
        for ($i = 0; $i -lt 20; $i++) {
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
                $fastApiHealthy = $true
                Write-Host "  [FastAPI] Healthy" -ForegroundColor Green
                break
            } catch {
                Start-Sleep -Seconds 3
                if ($i % 3 -eq 0) {
                    Write-Host "  [FastAPI] Waiting... ($($i * 3)/60 seconds)" -ForegroundColor Gray
                }
            }
        }
        
        if (-not $fastApiHealthy) {
            Write-Host "  [FastAPI] May still be starting (check logs: Receive-Job -Id $($fastApiJob.Id))" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`nStep 5: Skipping FastAPI Backend" -ForegroundColor Gray
}

# Step 6: Start Frontend (local with pnpm)
if (-not $SkipFrontend) {
    Write-Host "`nStep 6: Starting Frontend (local)..." -ForegroundColor Yellow
    
    # Stop any existing frontend processes
    $ports = @(5000, 3000, 5173)
    foreach ($port in $ports) {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    $nodeAvailable = $false
    try {
        $null = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $nodeAvailable = $true
        }
    } catch {
        Write-Host "  [Frontend] Node.js not found" -ForegroundColor Red
    }
    
    if ($nodeAvailable) {
        # Check if pnpm is available
        $pnpmAvailable = $false
        try {
            $null = pnpm --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $pnpmAvailable = $true
            }
        } catch {
            Write-Host "  [Frontend] pnpm not found, using npm" -ForegroundColor Yellow
        }
        
        # Check dependencies
        if (-not (Test-Path "node_modules")) {
            Write-Host "  [Frontend] Installing dependencies..." -ForegroundColor Cyan
            if ($pnpmAvailable) {
                pnpm install 2>&1 | Out-Null
            } else {
                npm install 2>&1 | Out-Null
            }
        }
        
        Write-Host "  [Frontend] Starting..." -ForegroundColor Cyan
        $frontendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            $env:VITE_API_URL = "http://localhost:3001"
            $env:VITE_WS_URL = "ws://localhost:3001"
            if ($using:pnpmAvailable) {
                pnpm run dev
            } else {
                npm run dev
            }
        }
        
        Write-Host "  [Frontend] Job started (ID: $($frontendJob.Id))" -ForegroundColor Gray
        
        # Wait for frontend
        Start-Sleep -Seconds 5
        $frontendHealthy = $false
        for ($i = 0; $i -lt 15; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                $frontendHealthy = $true
                Write-Host "  [Frontend] Running" -ForegroundColor Green
                break
            } catch {
                Start-Sleep -Seconds 2
                if ($i % 3 -eq 0) {
                    Write-Host "  [Frontend] Waiting... ($($i * 2)/30 seconds)" -ForegroundColor Gray
                }
            }
        }
        
        if (-not $frontendHealthy) {
            Write-Host "  [Frontend] May still be starting (check logs: Receive-Job -Id $($frontendJob.Id))" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "`nStep 6: Skipping Frontend" -ForegroundColor Gray
}

# Final Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Startup Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Service Status:" -ForegroundColor Yellow
Write-Host "  [PostgreSQL] Running in Docker (localhost:5432)" -ForegroundColor Green
Write-Host "  [Redis] Running in Docker (localhost:6379)" -ForegroundColor Green
if (-not $SkipFastAPI) {
    Write-Host "  [FastAPI] Running locally (http://localhost:8000)" -ForegroundColor $(if ($fastApiHealthy) { "Green" } else { "Yellow" })
}
if (-not $BuildOnly) {
    Write-Host "  [TypeScript Backend] Running in Docker (http://localhost:3001)" -ForegroundColor $(if ($backendHealthy) { "Green" } else { "Yellow" })
}
if (-not $SkipFrontend) {
    Write-Host "  [Frontend] Running locally (http://localhost:5000)" -ForegroundColor $(if ($frontendHealthy) { "Green" } else { "Yellow" })
}

Write-Host "`nService URLs:" -ForegroundColor Yellow
if (-not $SkipFastAPI) {
    Write-Host "  FastAPI:         http://localhost:8000" -ForegroundColor Gray
    Write-Host "  FastAPI Docs:    http://localhost:8000/docs" -ForegroundColor Gray
}
if (-not $BuildOnly) {
    Write-Host "  TypeScript API:  http://localhost:3001" -ForegroundColor Gray
    Write-Host "  API Health:      http://localhost:3001/health" -ForegroundColor Gray
}
if (-not $SkipFrontend) {
    Write-Host "  Frontend:        http://localhost:5000" -ForegroundColor Gray
}
Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor Gray
Write-Host "  Redis:           localhost:6379" -ForegroundColor Gray
Write-Host "  pgAdmin:         http://localhost:5050" -ForegroundColor Gray
Write-Host "  Redis Commander: http://localhost:8081" -ForegroundColor Gray

Write-Host "`nUseful Commands:" -ForegroundColor Yellow
Write-Host "  View Docker logs:     docker logs -f degenx-backend" -ForegroundColor Gray
Write-Host "  View FastAPI logs:    Receive-Job -Id $($fastApiJob.Id)" -ForegroundColor Gray
Write-Host "  View Frontend logs:   Receive-Job -Id $($frontendJob.Id)" -ForegroundColor Gray
Write-Host "  Stop all services:    docker-compose -f docker-compose.simple.yml down" -ForegroundColor Gray
Write-Host "  Stop local services:  Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray

# Save job info
if ($fastApiJob -or $frontendJob) {
    $jobInfo = @{
        FastAPI = if ($fastApiJob) { $fastApiJob.Id } else { $null }
        Frontend = if ($frontendJob) { $frontendJob.Id } else { $null }
        StartedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    } | ConvertTo-Json
    
    $jobInfo | Out-File -FilePath ".docker-services.json" -Encoding UTF8
}

Write-Host ""

