# Comprehensive Platform Startup Script
# Starts all services with proper error handling and health checks

param(
    [switch]$SkipDocker,
    [switch]$SkipFastAPI,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [int]$FastAPITimeout = 30,
    [int]$BackendTimeout = 30,
    [int]$FrontendTimeout = 20
)

$ErrorActionPreference = "Continue"
$PWD = Get-Location
$servicesStarted = @{}
$serviceJobs = @{}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Platform Startup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to check if a port is available
function Test-Port {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $null -eq $connection
}

# Function to wait for service health
function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$TimeoutSeconds = 30,
        [int]$IntervalSeconds = 2
    )
    
    $elapsed = 0
    $lastError = ""
    while ($elapsed -lt $TimeoutSeconds) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  [$Name] Health check passed" -ForegroundColor Green
            return $true
        } catch {
            $lastError = $_.Exception.Message
            Start-Sleep -Seconds $IntervalSeconds
            $elapsed += $IntervalSeconds
            if ($elapsed % 6 -eq 0) {
                Write-Host "  [$Name] Waiting... ($elapsed/$TimeoutSeconds seconds)" -ForegroundColor Gray
            }
        }
    }
    Write-Host "  [$Name] Health check failed after $TimeoutSeconds seconds" -ForegroundColor Red
    if ($lastError) {
        Write-Host "  [$Name] Last error: $lastError" -ForegroundColor Yellow
    }
    return $false
}

# Step 1: Start Docker Services
if (-not $SkipDocker) {
    Write-Host "Step 1: Starting Docker Services..." -ForegroundColor Yellow
    
    $dockerAvailable = $false
    try {
        $null = docker --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerAvailable = $true
        }
    } catch {
        Write-Host "  Docker not available" -ForegroundColor Yellow
    }
    
    if ($dockerAvailable) {
        $postgresRunning = docker ps --filter "name=degenx-postgres" --format "{{.Names}}" 2>$null
        $redisRunning = docker ps --filter "name=degenx-redis" --format "{{.Names}}" 2>$null
        
        if (-not $postgresRunning -or -not $redisRunning) {
            Write-Host "  Starting PostgreSQL and Redis..." -ForegroundColor Cyan
            docker-compose -f docker-compose.simple.yml up -d postgres redis 2>&1 | Out-Null
            
            Write-Host "  Waiting for databases to initialize..." -ForegroundColor Yellow
            Start-Sleep -Seconds 15
            
            # Verify PostgreSQL
            $pgReady = $false
            for ($i = 0; $i -lt 20; $i++) {
                try {
                    $result = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        $pgReady = $true
                        break
                    }
                } catch {
                    Start-Sleep -Seconds 2
                }
            }
            
            if ($pgReady) {
                Write-Host "  [PostgreSQL] Ready" -ForegroundColor Green
                $servicesStarted["PostgreSQL"] = $true
            } else {
                Write-Host "  [PostgreSQL] May need more time" -ForegroundColor Yellow
                $servicesStarted["PostgreSQL"] = $false
            }
            
            # Verify Redis
            try {
                $redisResult = docker exec degenx-redis redis-cli ping 2>&1
                if ($redisResult -match "PONG") {
                    Write-Host "  [Redis] Ready" -ForegroundColor Green
                    $servicesStarted["Redis"] = $true
                } else {
                    $servicesStarted["Redis"] = $false
                }
            } catch {
                Write-Host "  [Redis] Check failed" -ForegroundColor Yellow
                $servicesStarted["Redis"] = $false
            }
        } else {
            Write-Host "  [PostgreSQL] Already running" -ForegroundColor Green
            Write-Host "  [Redis] Already running" -ForegroundColor Green
            $servicesStarted["PostgreSQL"] = $true
            $servicesStarted["Redis"] = $true
        }
    } else {
        Write-Host "  Skipping Docker services" -ForegroundColor Yellow
        $servicesStarted["PostgreSQL"] = $false
        $servicesStarted["Redis"] = $false
    }
} else {
    Write-Host "Step 1: Skipping Docker Services" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Set Environment Variables
Write-Host "Step 2: Setting Environment Variables..." -ForegroundColor Yellow
$env:LOG_LEVEL = "INFO"
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
$env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
$env:NODE_ENV = "development"
Write-Host "  Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 3: Stop Existing Services
Write-Host "Step 3: Stopping Existing Services..." -ForegroundColor Yellow
$ports = @(8000, 3001, 5000)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Host "  Stopped processes on port $port" -ForegroundColor Gray
    }
}
Start-Sleep -Seconds 2
Write-Host ""

# Step 4: Start FastAPI Backend
if (-not $SkipFastAPI) {
    Write-Host "Step 4: Starting FastAPI Backend (port 8000)..." -ForegroundColor Yellow
    
    if (-not (Test-Port -Port 8000)) {
        Write-Host "  Port 8000 is already in use" -ForegroundColor Red
        $servicesStarted["FastAPI"] = $false
    } else {
        $pythonAvailable = $false
        try {
            $null = python --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $pythonAvailable = $true
            }
        } catch {
            Write-Host "  Python not found" -ForegroundColor Red
        }
        
        if ($pythonAvailable) {
            Write-Host "  Starting FastAPI server..." -ForegroundColor Cyan
            $fastApiJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                $env:LOG_LEVEL = "INFO"
                $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
                $env:REDIS_URL = "redis://localhost:6379"
                python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000 --reload 2>&1
            }
            
            $serviceJobs["FastAPI"] = $fastApiJob.Id
            Write-Host "  FastAPI job started (ID: $($fastApiJob.Id))" -ForegroundColor Gray
            
            # Wait for FastAPI to start (it takes time due to heavy initialization)
            Write-Host "  Waiting for FastAPI to initialize (this may take up to $FastAPITimeout seconds)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5  # Give it a moment to start
            $fastApiHealthy = Wait-ForService -Name "FastAPI" -Url "http://localhost:8000/health" -TimeoutSeconds $FastAPITimeout -IntervalSeconds 3
            
            if ($fastApiHealthy) {
                Write-Host "  [FastAPI] Running on http://localhost:8000" -ForegroundColor Green
                $servicesStarted["FastAPI"] = $true
            } else {
                Write-Host "  [FastAPI] Failed to start or health check failed" -ForegroundColor Red
                Write-Host "  Check logs: Receive-Job -Id $($fastApiJob.Id)" -ForegroundColor Gray
                $servicesStarted["FastAPI"] = $false
            }
        } else {
            $servicesStarted["FastAPI"] = $false
        }
    }
} else {
    Write-Host "Step 4: Skipping FastAPI Backend" -ForegroundColor Gray
    $servicesStarted["FastAPI"] = $false
}

Write-Host ""

# Step 5: Start TypeScript Backend
if (-not $SkipBackend) {
    Write-Host "Step 5: Starting TypeScript Backend (port 3001)..." -ForegroundColor Yellow
    
    if (-not (Test-Port -Port 3001)) {
        Write-Host "  Port 3001 is already in use" -ForegroundColor Red
        $servicesStarted["TypeScriptBackend"] = $false
    } else {
        $nodeAvailable = $false
        try {
            $null = node --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $nodeAvailable = $true
            }
        } catch {
            Write-Host "  Node.js not found" -ForegroundColor Red
        }
        
        if ($nodeAvailable) {
            Set-Location src/backend
            
            # Check if pnpm is available
            $pnpmAvailable = $false
            try {
                $null = pnpm --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $pnpmAvailable = $true
                }
            } catch {
                Write-Host "  pnpm not found, checking npm..." -ForegroundColor Yellow
            }
            
            # Check dependencies
            if (-not (Test-Path "node_modules")) {
                Write-Host "  Installing dependencies..." -ForegroundColor Cyan
                if ($pnpmAvailable) {
                    pnpm install 2>&1 | Out-Null
                } else {
                    npm install 2>&1 | Out-Null
                }
            }
            
            # Run migrations if needed
            if (Test-Path "prisma/schema.prisma") {
                Write-Host "  Running database migrations..." -ForegroundColor Cyan
                $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
                if ($pnpmAvailable) {
                    pnpm exec prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
                    pnpm exec prisma generate 2>&1 | Out-Null
                } else {
                    npx prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
                    npx prisma generate 2>&1 | Out-Null
                }
            }
            
            Write-Host "  Starting TypeScript backend..." -ForegroundColor Cyan
            $backendJob = Start-Job -ScriptBlock {
                Set-Location $using:PWD
                $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
                $env:REDIS_URL = "redis://localhost:6379"
                $env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
                $env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
                $env:NODE_ENV = "development"
                $env:PORT = "3001"
                if ($using:pnpmAvailable) {
                    pnpm run dev
                } else {
                    npm run dev
                }
            }
            
            $serviceJobs["TypeScriptBackend"] = $backendJob.Id
            Set-Location ../..
            
            Write-Host "  TypeScript backend job started (ID: $($backendJob.Id))" -ForegroundColor Gray
            
            # Wait for backend to start
            Write-Host "  Waiting for TypeScript backend to start..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5  # Give it a moment to start
            $backendHealthy = Wait-ForService -Name "TypeScriptBackend" -Url "http://localhost:3001/health" -TimeoutSeconds $BackendTimeout -IntervalSeconds 3
            
            if ($backendHealthy) {
                Write-Host "  [TypeScript Backend] Running on http://localhost:3001" -ForegroundColor Green
                $servicesStarted["TypeScriptBackend"] = $true
            } else {
                Write-Host "  [TypeScript Backend] Failed to start or health check failed" -ForegroundColor Red
                Write-Host "  Check logs: Receive-Job -Id $($backendJob.Id)" -ForegroundColor Gray
                $servicesStarted["TypeScriptBackend"] = $false
            }
        } else {
            $servicesStarted["TypeScriptBackend"] = $false
        }
    }
} else {
    Write-Host "Step 5: Skipping TypeScript Backend" -ForegroundColor Gray
    $servicesStarted["TypeScriptBackend"] = $false
}

Write-Host ""

# Step 6: Start Frontend
if (-not $SkipFrontend) {
    Write-Host "Step 6: Starting Frontend (port 5000)..." -ForegroundColor Yellow
    
    if (-not (Test-Port -Port 5000)) {
        Write-Host "  Port 5000 is already in use" -ForegroundColor Red
        $servicesStarted["Frontend"] = $false
    } else {
        $nodeAvailable = $false
        try {
            $null = node --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                $nodeAvailable = $true
            }
        } catch {
            Write-Host "  Node.js not found" -ForegroundColor Red
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
                Write-Host "  pnpm not found, checking npm..." -ForegroundColor Yellow
            }
            
            # Check dependencies
            if (-not (Test-Path "node_modules")) {
                Write-Host "  Installing frontend dependencies..." -ForegroundColor Cyan
                if ($pnpmAvailable) {
                    pnpm install 2>&1 | Out-Null
                } else {
                    npm install 2>&1 | Out-Null
                }
            }
            
            Write-Host "  Starting frontend..." -ForegroundColor Cyan
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
            
            $serviceJobs["Frontend"] = $frontendJob.Id
            
            Write-Host "  Frontend job started (ID: $($frontendJob.Id))" -ForegroundColor Gray
            
            # Wait for frontend to start
            Write-Host "  Waiting for frontend to start..." -ForegroundColor Yellow
            # Frontend uses web request, not REST API
            $frontendHealthy = $false
            $elapsed = 0
            while ($elapsed -lt $FrontendTimeout) {
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
                    $frontendHealthy = $true
                    break
                } catch {
                    Start-Sleep -Seconds 2
                    $elapsed += 2
                    Write-Host "  [Frontend] Waiting... ($elapsed/$FrontendTimeout seconds)" -ForegroundColor Gray
                }
            }
            
            if ($frontendHealthy) {
                Write-Host "  [Frontend] Running on http://localhost:5000" -ForegroundColor Green
                $servicesStarted["Frontend"] = $true
            } else {
                Write-Host "  [Frontend] Failed to start or health check failed" -ForegroundColor Red
                Write-Host "  Check logs: Receive-Job -Id $($frontendJob.Id)" -ForegroundColor Gray
                $servicesStarted["Frontend"] = $false
            }
        } else {
            $servicesStarted["Frontend"] = $false
        }
    }
} else {
    Write-Host "Step 6: Skipping Frontend" -ForegroundColor Gray
    $servicesStarted["Frontend"] = $false
}

Write-Host ""

# Final Status Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Startup Complete" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Service Status:" -ForegroundColor Yellow
foreach ($service in $servicesStarted.Keys) {
    $status = if ($servicesStarted[$service]) { "[OK]" } else { "[!!]" }
    $color = if ($servicesStarted[$service]) { "Green" } else { "Red" }
    Write-Host "  $status $service" -ForegroundColor $color
}

Write-Host "`nService URLs:" -ForegroundColor Yellow
if ($servicesStarted["FastAPI"]) {
    Write-Host "  FastAPI:         http://localhost:8000" -ForegroundColor Gray
    Write-Host "  FastAPI Docs:    http://localhost:8000/docs" -ForegroundColor Gray
}
if ($servicesStarted["TypeScriptBackend"]) {
    Write-Host "  TypeScript API:  http://localhost:3001" -ForegroundColor Gray
    Write-Host "  API Health:      http://localhost:3001/health" -ForegroundColor Gray
}
if ($servicesStarted["Frontend"]) {
    Write-Host "  Frontend:        http://localhost:5000" -ForegroundColor Gray
}
if ($servicesStarted["PostgreSQL"]) {
    Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor Gray
}
if ($servicesStarted["Redis"]) {
    Write-Host "  Redis:           localhost:6379" -ForegroundColor Gray
}

Write-Host "`nTo view service logs:" -ForegroundColor Yellow
foreach ($service in $serviceJobs.Keys) {
    Write-Host "  Receive-Job -Id $($serviceJobs[$service])  # $service" -ForegroundColor Gray
}

Write-Host "`nTo stop all services:" -ForegroundColor Yellow
Write-Host "  Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host "  docker-compose -f docker-compose.simple.yml down" -ForegroundColor Gray

# Save job info
$jobInfo = @{
    Services = $servicesStarted
    JobIds = $serviceJobs
    StartedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json

$jobInfo | Out-File -FilePath ".platform-services.json" -Encoding UTF8
Write-Host "`nService info saved to .platform-services.json" -ForegroundColor Gray
Write-Host ""

