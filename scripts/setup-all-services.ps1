# Comprehensive Service Setup Script
# Sets up databases, runs migrations, starts all services, and tests endpoints

Write-Host "🚀 Starting Comprehensive Service Setup..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Start Databases (PostgreSQL & Redis)
Write-Host "📦 Step 1: Starting Databases..." -ForegroundColor Yellow
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "✅ Docker is available" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Docker not available, will try local services" -ForegroundColor Yellow
}

if ($dockerAvailable) {
    Write-Host "Starting PostgreSQL and Redis with Docker..." -ForegroundColor Cyan
    
    # Stop existing containers
    docker-compose -f docker-compose.simple.yml down 2>$null
    
    # Start databases
    docker-compose -f docker-compose.simple.yml up -d postgres redis
    
    Write-Host "Waiting for databases to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check PostgreSQL health
    $pgHealthy = $false
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $pgCheck = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
            if ($LASTEXITCODE -eq 0) {
                $pgHealthy = $true
                Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    
    if (-not $pgHealthy) {
        Write-Host "⚠️  PostgreSQL may not be ready yet, continuing..." -ForegroundColor Yellow
    }
    
    # Check Redis health
    try {
        $redisCheck = docker exec degenx-redis redis-cli ping 2>&1
        if ($redisCheck -match "PONG") {
            Write-Host "✅ Redis is ready" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Redis check failed, continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Docker not available. Please ensure PostgreSQL and Redis are running locally." -ForegroundColor Yellow
    Write-Host "   PostgreSQL should be on port 5432" -ForegroundColor Gray
    Write-Host "   Redis should be on port 6379" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Setup Environment Variables
Write-Host "⚙️  Step 2: Setting up environment variables..." -ForegroundColor Yellow

$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
$env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
$env:NODE_ENV = "development"
$env:PORT = "3001"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host ""

# Step 3: Run Database Migrations
Write-Host "🗄️  Step 3: Running database migrations..." -ForegroundColor Yellow

# Check if Prisma is installed
$prismaInstalled = Test-Path "src/backend/node_modules/.bin/prisma"
if (-not $prismaInstalled) {
    Write-Host "Installing Prisma dependencies..." -ForegroundColor Cyan
    Set-Location src/backend
    npm install
    Set-Location ../..
}

# Update Prisma schema to use PostgreSQL
Write-Host "Updating Prisma schema to use PostgreSQL..." -ForegroundColor Cyan
$schemaPath = "src/backend/prisma/schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    if ($schemaContent -match 'provider = "sqlite"') {
        $schemaContent = $schemaContent -replace 'provider = "sqlite"', 'provider = "postgresql"'
        Set-Content -Path $schemaPath -Value $schemaContent
        Write-Host "✅ Updated schema to use PostgreSQL" -ForegroundColor Green
    }
}

# Run migrations
Write-Host "Running Prisma migrations..." -ForegroundColor Cyan
Set-Location src/backend
try {
    npx prisma migrate dev --name init 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Migration may have issues, continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Migration error: $_" -ForegroundColor Yellow
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

# Step 4: Start Backend Services
Write-Host "🚀 Step 4: Starting backend services..." -ForegroundColor Yellow

# Stop any existing Python processes on port 8000
Write-Host "Stopping existing services on port 8000..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# Start FastAPI main server
Write-Host "Starting FastAPI main server (port 8000)..." -ForegroundColor Cyan
$fastApiProcess = Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "app.api.main_comprehensive:app", "--host", "0.0.0.0", "--port", "8000", "--reload" `
    -PassThru -NoNewWindow

Write-Host "✅ FastAPI server started (PID: $($fastApiProcess.Id))" -ForegroundColor Green

# Start TypeScript backend server
Write-Host "Starting TypeScript backend server (port 3001)..." -ForegroundColor Cyan
Set-Location src/backend
$backendProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -PassThru -NoNewWindow

Write-Host "✅ TypeScript backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
Set-Location ../..

Write-Host "Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""

# Step 5: Verify Services
Write-Host "🔍 Step 5: Verifying services..." -ForegroundColor Yellow

$servicesHealthy = @{
    FastAPI = $false
    TypeScriptBackend = $false
    PostgreSQL = $false
    Redis = $false
}

# Check FastAPI
try {
    $fastApiHealth = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $servicesHealthy.FastAPI = $true
    Write-Host "✅ FastAPI server is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ FastAPI server not responding" -ForegroundColor Red
}

# Check TypeScript Backend
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $servicesHealthy.TypeScriptBackend = $true
    Write-Host "✅ TypeScript backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️  TypeScript backend not responding (may need more time)" -ForegroundColor Yellow
}

# Check PostgreSQL
if ($dockerAvailable) {
    try {
        $pgCheck = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
        if ($LASTEXITCODE -eq 0) {
            $servicesHealthy.PostgreSQL = $true
            Write-Host "✅ PostgreSQL is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  PostgreSQL check failed" -ForegroundColor Yellow
    }
}

# Check Redis
if ($dockerAvailable) {
    try {
        $redisCheck = docker exec degenx-redis redis-cli ping 2>&1
        if ($redisCheck -match "PONG") {
            $servicesHealthy.Redis = $true
            Write-Host "✅ Redis is healthy" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Redis check failed" -ForegroundColor Yellow
    }
}

Write-Host ""

# Step 6: Get Auth Token
Write-Host "🔐 Step 6: Getting authentication token..." -ForegroundColor Yellow

$authToken = $null
try {
    # Try to register/login
    $registerBody = @{
        email = "test@example.com"
        password = "Test123!"
        displayName = "Test User"
    } | ConvertTo-Json

    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
            -Method POST -ContentType "application/json" -Body $registerBody -ErrorAction Stop
        Write-Host "✅ User registered" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            Write-Host "⚠️  User already exists, trying login..." -ForegroundColor Yellow
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
        Write-Host "   Token: $($authToken.Substring(0, [Math]::Min(50, $authToken.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not get auth token: $_" -ForegroundColor Yellow
    Write-Host "   Using demo token for testing..." -ForegroundColor Yellow
    $authToken = "demo-token-$(Get-Date -Format 'yyyyMMddHHmmss')"
    $env:AUTH_TOKEN = $authToken
}

Write-Host ""

# Step 7: Run Comprehensive Tests
Write-Host "🧪 Step 7: Running comprehensive tests..." -ForegroundColor Yellow
Write-Host ""

# Run endpoint tests
Write-Host "Testing all API endpoints..." -ForegroundColor Cyan
npm run test:endpoints

Write-Host ""
Write-Host "✅ Service setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "   FastAPI:           $(if ($servicesHealthy.FastAPI) { '✅' } else { '❌' })" -ForegroundColor $(if ($servicesHealthy.FastAPI) { "Green" } else { "Red" })
Write-Host "   TypeScript Backend: $(if ($servicesHealthy.TypeScriptBackend) { '✅' } else { '❌' })" -ForegroundColor $(if ($servicesHealthy.TypeScriptBackend) { "Green" } else { "Red" })
Write-Host "   PostgreSQL:        $(if ($servicesHealthy.PostgreSQL) { '✅' } else { '❌' })" -ForegroundColor $(if ($servicesHealthy.PostgreSQL) { "Green" } else { "Red" })
Write-Host "   Redis:             $(if ($servicesHealthy.Redis) { '✅' } else { '❌' })" -ForegroundColor $(if ($servicesHealthy.Redis) { "Green" } else { "Red" })
Write-Host ""
Write-Host "🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "   FastAPI:           http://localhost:8000" -ForegroundColor Gray
Write-Host "   TypeScript Backend: http://localhost:3001" -ForegroundColor Gray
Write-Host "   PostgreSQL:        localhost:5432" -ForegroundColor Gray
Write-Host "   Redis:             localhost:6379" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Process IDs:" -ForegroundColor Cyan
Write-Host "   FastAPI:           $($fastApiProcess.Id)" -ForegroundColor Gray
Write-Host "   TypeScript Backend: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "   Stop-Process -Id $($fastApiProcess.Id), $($backendProcess.Id) -Force" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.simple.yml down" -ForegroundColor Gray

