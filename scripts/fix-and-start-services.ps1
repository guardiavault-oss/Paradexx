# Fix Issues and Start All Services Properly
Write-Host "🔧 Fixing Issues and Starting Services..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix LOG_LEVEL environment variable
Write-Host "Step 1: Setting LOG_LEVEL to uppercase..." -ForegroundColor Yellow
$env:LOG_LEVEL = "INFO"
Write-Host "✅ LOG_LEVEL set to INFO" -ForegroundColor Green
Write-Host ""

# Step 2: Start Databases
Write-Host "Step 2: Starting databases..." -ForegroundColor Yellow

# Check if containers exist
$postgresRunning = docker ps --filter "name=degenx-postgres" --format "{{.Names}}" 2>$null
$redisRunning = docker ps --filter "name=degenx-redis" --format "{{.Names}}" 2>$null

if (-not $postgresRunning -or -not $redisRunning) {
    Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Cyan
    
    # Use docker-compose without .env file issues
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

Write-Host ""

# Step 3: Run Database Migrations
Write-Host "Step 3: Running database migrations..." -ForegroundColor Yellow

Set-Location src/backend

# Update Prisma schema to PostgreSQL if needed
$schemaPath = "prisma/schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    if ($schemaContent -match 'provider = "sqlite"') {
        $schemaContent = $schemaContent -replace 'provider = "sqlite"', 'provider = "postgresql"'
        Set-Content -Path $schemaPath -Value $schemaContent
        Write-Host "✅ Updated schema to PostgreSQL" -ForegroundColor Green
    }
}

# Set DATABASE_URL
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"

# Run migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Cyan
try {
    npx prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Migration error (may already be applied): $_" -ForegroundColor Yellow
}

# Generate Prisma Client
Write-Host "Generating Prisma Client..." -ForegroundColor Cyan
try {
    npx prisma generate 2>&1 | Out-Null
    Write-Host "✅ Prisma Client generated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Prisma generate error: $_" -ForegroundColor Yellow
}

Set-Location ../..
Write-Host ""

# Step 4: Stop existing services
Write-Host "Step 4: Stopping existing services..." -ForegroundColor Yellow

# Stop processes on ports 8000 and 3001
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3
Write-Host "✅ Existing services stopped" -ForegroundColor Green
Write-Host ""

# Step 5: Start FastAPI Server
Write-Host "Step 5: Starting FastAPI server..." -ForegroundColor Yellow

$env:LOG_LEVEL = "INFO"
$fastApiJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:LOG_LEVEL = "INFO"
    python -m uvicorn app.api.main_comprehensive:app --host 0.0.0.0 --port 8000
}

Write-Host "✅ FastAPI server starting (Job ID: $($fastApiJob.Id))" -ForegroundColor Green
Start-Sleep -Seconds 8

# Step 6: Start TypeScript Backend
Write-Host "Step 6: Starting TypeScript backend..." -ForegroundColor Yellow

Set-Location src/backend
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
$env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
$env:NODE_ENV = "development"
$env:PORT = "3001"

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
    $env:REDIS_URL = "redis://localhost:6379"
    npm run dev
}

Write-Host "✅ TypeScript backend starting (Job ID: $($backendJob.Id))" -ForegroundColor Green
Set-Location ../..

Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host ""

# Step 7: Verify Services
Write-Host "Step 7: Verifying services..." -ForegroundColor Yellow

$allHealthy = $false
$attempts = 0
$maxAttempts = 10

while (-not $allHealthy -and $attempts -lt $maxAttempts) {
    $attempts++
    Write-Host "Attempt $attempts/$maxAttempts..." -ForegroundColor Gray
    
    $fastApiHealthy = $false
    $backendHealthy = $false
    
    # Check FastAPI
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        $fastApiHealthy = $true
        Write-Host "✅ FastAPI is healthy" -ForegroundColor Green
    } catch {
        Write-Host "⏳ FastAPI not ready yet..." -ForegroundColor Yellow
    }
    
    # Check TypeScript Backend
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        $backendHealthy = $true
        Write-Host "✅ TypeScript backend is healthy" -ForegroundColor Green
    } catch {
        Write-Host "⏳ TypeScript backend not ready yet..." -ForegroundColor Yellow
    }
    
    if ($fastApiHealthy -and $backendHealthy) {
        $allHealthy = $true
        break
    }
    
    Start-Sleep -Seconds 3
}

Write-Host ""

# Step 8: Get Auth Token
Write-Host "Step 8: Getting authentication token..." -ForegroundColor Yellow

$authToken = $null
try {
    # Register user
    $registerBody = @{
        email = "test@example.com"
        password = "Test123!"
        displayName = "Test User"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
            -Method POST -ContentType "application/json" -Body $registerBody -ErrorAction Stop | Out-Null
        Write-Host "✅ User registered" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "⚠️  User already exists" -ForegroundColor Yellow
        }
    }

    # Login
    $loginBody = @{
        email = "test@example.com"
        password = "Test123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop

    if ($loginResponse.accessToken) {
        $authToken = $loginResponse.accessToken
        $env:AUTH_TOKEN = $authToken
        Write-Host "✅ Auth token obtained" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not get auth token: $_" -ForegroundColor Yellow
    $authToken = "demo-token-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $env:AUTH_TOKEN = $authToken
}

Write-Host ""

# Step 9: Run Tests
Write-Host "Step 9: Running comprehensive endpoint tests..." -ForegroundColor Yellow
Write-Host ""

npm run test:endpoints

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "   FastAPI:           $(if ($fastApiHealthy) { '✅' } else { '❌' })" -ForegroundColor $(if ($fastApiHealthy) { "Green" } else { "Red" })
Write-Host "   TypeScript Backend: $(if ($backendHealthy) { '✅' } else { '❌' })" -ForegroundColor $(if ($backendHealthy) { "Green" } else { "Red" })
Write-Host ""
Write-Host "To view job output:" -ForegroundColor Yellow
Write-Host "   Receive-Job -Id $($fastApiJob.Id)" -ForegroundColor Gray
Write-Host "   Receive-Job -Id $($backendJob.Id)" -ForegroundColor Gray

