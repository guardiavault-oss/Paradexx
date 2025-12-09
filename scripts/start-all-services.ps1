# Comprehensive Service Startup Script
# Starts all services for full platform functionality

Write-Host "🚀 Starting All Platform Services..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$PWD = Get-Location

# Step 1: Start Docker Services (PostgreSQL & Redis)
Write-Host "Step 1: Starting Docker Services (PostgreSQL and Redis)..." -ForegroundColor Yellow

# Check if Docker is available
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "✅ Docker is available" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker not available, skipping Docker services" -ForegroundColor Yellow
}

if ($dockerAvailable) {
    # Check if containers are already running
    $postgresRunning = docker ps --filter "name=degenx-postgres" --format "{{.Names}}" 2>$null
    $redisRunning = docker ps --filter "name=degenx-redis" --format "{{.Names}}" 2>$null
    
    if (-not $postgresRunning -or -not $redisRunning) {
        Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Cyan
        docker-compose -f docker-compose.simple.yml up -d postgres redis 2>&1 | Out-Null
        
        Write-Host "Waiting for databases to initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
        
        # Verify PostgreSQL
        $pgReady = $false
        for ($i = 0; $i -lt 20; $i++) {
            try {
                $result = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
                if ($LASTEXITCODE -eq 0) {
                    $pgReady = $true
                    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
                    break
                }
            } catch {
                Start-Sleep -Seconds 2
            }
        }
        
        if (-not $pgReady) {
            Write-Host "⚠️  PostgreSQL may need more time" -ForegroundColor Yellow
        }
        
        # Verify Redis
        try {
            $redisResult = docker exec degenx-redis redis-cli ping 2>&1
            if ($redisResult -match "PONG") {
                Write-Host "✅ Redis is ready" -ForegroundColor Green
            }
        } catch {
            Write-Host "⚠️  Redis check failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Databases already running" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Skipping Docker services - ensure PostgreSQL and Redis are running locally" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Set Environment Variables
Write-Host "🔧 Step 2: Setting Environment Variables..." -ForegroundColor Yellow
$env:LOG_LEVEL = "INFO"
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
$env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
$env:NODE_ENV = "development"
Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 3: Stop Existing Services
Write-Host "🛑 Step 3: Stopping existing services..." -ForegroundColor Yellow

# Stop processes on common ports
$ports = @(8000, 3001, 5000, 8001, 8011)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Host "   Stopped processes on port $port" -ForegroundColor Gray
    }
}

Start-Sleep -Seconds 2
Write-Host "✅ Existing services stopped" -ForegroundColor Green
Write-Host ""

# Step 4: Start Python FastAPI Backend
Write-Host "🐍 Step 4: Starting Python FastAPI Backend (port 8000)..." -ForegroundColor Yellow

# Check if Python is available
$pythonAvailable = $false
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonAvailable = $true
        Write-Host "✅ Python is available: $pythonVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Python not found" -ForegroundColor Yellow
}

if ($pythonAvailable) {
    # Check if uvicorn is available
    $uvicornAvailable = $false
    try {
        $uvicornCheck = python -m uvicorn --help 2>&1
        if ($LASTEXITCODE -eq 0) {
            $uvicornAvailable = $true
        }
    } catch {
        Write-Host "⚠️  uvicorn not found, installing..." -ForegroundColor Yellow
        pip install uvicorn fastapi 2>&1 | Out-Null
        $uvicornAvailable = $true
    }
    
    if ($uvicornAvailable) {
        $fastApiJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            $env:LOG_LEVEL = "INFO"
            python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000 --reload
        }
        Write-Host "✅ FastAPI backend starting (Job ID: $($fastApiJob.Id))" -ForegroundColor Green
        Write-Host "   URL: http://localhost:8000" -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
} else {
    Write-Host "⚠️  Skipping Python FastAPI backend" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Start TypeScript Backend
Write-Host "📘 Step 5: Starting TypeScript Backend (port 3001)..." -ForegroundColor Yellow

# Check if Node.js is available
$nodeAvailable = $false
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $nodeAvailable = $true
        Write-Host "✅ Node.js is available: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Node.js not found" -ForegroundColor Yellow
}

if ($nodeAvailable) {
    Set-Location src/backend
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing dependencies..." -ForegroundColor Cyan
        npm install 2>&1 | Out-Null
    }
    
    # Run migrations if Prisma exists
    if (Test-Path "prisma/schema.prisma") {
        Write-Host "   Running database migrations..." -ForegroundColor Cyan
        $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
        npx prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
        npx prisma generate 2>&1 | Out-Null
    }
    
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
        $env:REDIS_URL = "redis://localhost:6379"
        $env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
        $env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
        $env:NODE_ENV = "development"
        $env:PORT = "3001"
        npm run dev
    }
    
    Write-Host "✅ TypeScript backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
    Write-Host "   URL: http://localhost:3001" -ForegroundColor Gray
    Set-Location ../..
    Start-Sleep -Seconds 5
} else {
    Write-Host "⚠️  Skipping TypeScript backend" -ForegroundColor Yellow
}

Write-Host ""

# Step 6: Start Frontend
Write-Host "🎨 Step 6: Starting Frontend (port 5000)..." -ForegroundColor Yellow

if ($nodeAvailable) {
    # Check if frontend dependencies are installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing frontend dependencies..." -ForegroundColor Cyan
        npm install 2>&1 | Out-Null
    }
    
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        $env:VITE_API_URL = "http://localhost:3001"
        $env:VITE_WS_URL = "ws://localhost:3001"
        npm run dev
    }
    
    Write-Host "✅ Frontend starting (Job ID: $($frontendJob.Id))" -ForegroundColor Green
    Write-Host "   URL: http://localhost:5000" -ForegroundColor Gray
    Start-Sleep -Seconds 5
} else {
    Write-Host "⚠️  Skipping Frontend" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Wait for Services to Initialize
Write-Host "⏳ Step 7: Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
Write-Host ""

# Step 8: Verify Services
Write-Host "✅ Step 8: Verifying Services..." -ForegroundColor Yellow
Write-Host ""

$services = @{
    "FastAPI Backend" = @{Url = "http://localhost:8000/health"; Job = $fastApiJob}
    "TypeScript Backend" = @{Url = "http://localhost:3001/api/health"; Job = $backendJob}
    "Frontend" = @{Url = "http://localhost:5000"; Job = $frontendJob}
}

$allHealthy = $true
foreach ($serviceName in $services.Keys) {
    $service = $services[$serviceName]
    try {
        $response = Invoke-RestMethod -Uri $service.Url -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ $serviceName is healthy" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $serviceName may still be starting..." -ForegroundColor Yellow
        Write-Host "   Check logs: Receive-Job -Id $($service.Job.Id)" -ForegroundColor Gray
        $allHealthy = $false
    }
}

Write-Host ""
Write-Host "📊 Service Status Summary:" -ForegroundColor Cyan
Write-Host "   PostgreSQL:     $(if ($dockerAvailable -and $postgresRunning) { '✅ Running' } else { '⚠️  Check manually' })" -ForegroundColor $(if ($dockerAvailable -and $postgresRunning) { "Green" } else { "Yellow" })
Write-Host "   Redis:          $(if ($dockerAvailable -and $redisRunning) { '✅ Running' } else { '⚠️  Check manually' })" -ForegroundColor $(if ($dockerAvailable -and $redisRunning) { "Green" } else { "Yellow" })
Write-Host "   FastAPI:        $(if ($fastApiJob) { '✅ Started (Job: ' + $fastApiJob.Id + ')' } else { '❌ Not started' })" -ForegroundColor $(if ($fastApiJob) { "Green" } else { "Red" })
Write-Host "   TypeScript API: $(if ($backendJob) { '✅ Started (Job: ' + $backendJob.Id + ')' } else { '❌ Not started' })" -ForegroundColor $(if ($backendJob) { "Green" } else { "Red" })
Write-Host "   Frontend:       $(if ($frontendJob) { '✅ Started (Job: ' + $frontendJob.Id + ')' } else { '❌ Not started' })" -ForegroundColor $(if ($frontendJob) { "Green" } else { "Red" })
Write-Host ""

Write-Host "🔗 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:        http://localhost:5000" -ForegroundColor Gray
Write-Host "   TypeScript API:  http://localhost:3001" -ForegroundColor Gray
Write-Host "   FastAPI:         http://localhost:8000" -ForegroundColor Gray
Write-Host "   PostgreSQL:      localhost:5432" -ForegroundColor Gray
Write-Host "   Redis:           localhost:6379" -ForegroundColor Gray
Write-Host ""

Write-Host "📝 To view service logs:" -ForegroundColor Yellow
if ($fastApiJob) {
    Write-Host "   Receive-Job -Id $($fastApiJob.Id)  # FastAPI Backend" -ForegroundColor Gray
}
if ($backendJob) {
    Write-Host "   Receive-Job -Id $($backendJob.Id)  # TypeScript Backend" -ForegroundColor Gray
}
if ($frontendJob) {
    Write-Host "   Receive-Job -Id $($frontendJob.Id)  # Frontend" -ForegroundColor Gray
}
Write-Host ""

Write-Host "🎉 Platform startup complete!" -ForegroundColor Green
Write-Host ""

# Save job IDs to file for later reference
$jobInfo = @{
    FastAPI = if ($fastApiJob) { $fastApiJob.Id } else { $null }
    TypeScriptBackend = if ($backendJob) { $backendJob.Id } else { $null }
    Frontend = if ($frontendJob) { $frontendJob.Id } else { $null }
    StartedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
} | ConvertTo-Json

$jobInfo | Out-File -FilePath ".service-jobs.json" -Encoding UTF8
Write-Host "💾 Job IDs saved to .service-jobs.json" -ForegroundColor Gray

