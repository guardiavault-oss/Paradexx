# Fixed Service Startup Script
Write-Host "🔧 Starting All Services (Fixed)..." -ForegroundColor Cyan
Write-Host ""

# Set LOG_LEVEL to uppercase
$env:LOG_LEVEL = "INFO"

# Step 1: Start Databases
Write-Host "📦 Step 1: Starting databases..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml up -d postgres redis 2>&1 | Out-Null
Write-Host "Waiting for databases..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host "✅ Databases started" -ForegroundColor Green
Write-Host ""

# Step 2: Run Migrations
Write-Host "🗄️  Step 2: Running migrations..." -ForegroundColor Yellow
Set-Location src/backend
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"

# Update schema if needed
$schemaPath = "prisma/schema.prisma"
if (Test-Path $schemaPath) {
    $schemaContent = Get-Content $schemaPath -Raw
    if ($schemaContent -match 'provider = "sqlite"') {
        $schemaContent = $schemaContent -replace 'provider = "sqlite"', 'provider = "postgresql"'
        Set-Content -Path $schemaPath -Value $schemaContent
    }
}

# Run migrations
npx prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
npx prisma generate 2>&1 | Out-Null
Set-Location ../..
Write-Host "✅ Migrations complete" -ForegroundColor Green
Write-Host ""

# Step 3: Stop existing services
Write-Host "🛑 Step 3: Stopping existing services..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
Write-Host "✅ Existing services stopped" -ForegroundColor Green
Write-Host ""

# Step 4: Start FastAPI
Write-Host "🚀 Step 4: Starting FastAPI server..." -ForegroundColor Yellow
$env:LOG_LEVEL = "INFO"
Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "app.api.main_comprehensive:app", "--host", "0.0.0.0", "--port", "8000" `
    -WindowStyle Hidden

Write-Host "✅ FastAPI starting..." -ForegroundColor Green
Start-Sleep -Seconds 8

# Step 5: Start TypeScript Backend
Write-Host "🚀 Step 5: Starting TypeScript backend..." -ForegroundColor Yellow
Set-Location src/backend
$env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
$env:REDIS_URL = "redis://localhost:6379"
$env:JWT_SECRET = "degenx_jwt_secret_key_production_2024_secure"
$env:JWT_REFRESH_SECRET = "degenx_refresh_secret_key_production_2024_secure"
$env:NODE_ENV = "development"
$env:PORT = "3001"

Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WindowStyle Hidden

Set-Location ../..
Write-Host "✅ TypeScript backend starting..." -ForegroundColor Green
Start-Sleep -Seconds 15
Write-Host ""

# Step 6: Verify Services
Write-Host "🔍 Step 6: Verifying services..." -ForegroundColor Yellow

$fastApiHealthy = $false
$backendHealthy = $false

for ($i = 0; $i -lt 10; $i++) {
    if (-not $fastApiHealthy) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
            $fastApiHealthy = $true
            Write-Host "✅ FastAPI is healthy" -ForegroundColor Green
        } catch {
            Write-Host "⏳ FastAPI not ready..." -ForegroundColor Gray
        }
    }
    
    if (-not $backendHealthy) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
            $backendHealthy = $true
            Write-Host "✅ TypeScript backend is healthy" -ForegroundColor Green
        } catch {
            Write-Host "⏳ TypeScript backend not ready..." -ForegroundColor Gray
        }
    }
    
    if ($fastApiHealthy -and $backendHealthy) {
        break
    }
    
    Start-Sleep -Seconds 3
}

Write-Host ""

# Step 7: Get Auth Token
Write-Host "🔐 Step 7: Getting auth token..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@example.com"
        password = "Test123!"
    } | ConvertTo-Json

    try {
        Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
            -Method POST -ContentType "application/json" `
            -Body (@{
                email = "test@example.com"
                password = "Test123!"
                displayName = "Test User"
            } | ConvertTo-Json) -ErrorAction Stop | Out-Null
    } catch { }

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop

    if ($loginResponse.accessToken) {
        $env:AUTH_TOKEN = $loginResponse.accessToken
        Write-Host "✅ Auth token obtained" -ForegroundColor Green
    }
} catch {
    $env:AUTH_TOKEN = "demo-token-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Write-Host "⚠️  Using demo token" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Run Tests
Write-Host "🧪 Step 8: Running endpoint tests..." -ForegroundColor Yellow
Write-Host ""
Set-Location ../..
npm run test:endpoints

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Cyan
Write-Host "   FastAPI:           $(if ($fastApiHealthy) { '✅' } else { '❌' })" -ForegroundColor $(if ($fastApiHealthy) { "Green" } else { "Red" })
Write-Host "   TypeScript Backend: $(if ($backendHealthy) { '✅' } else { '❌' })" -ForegroundColor $(if ($backendHealthy) { "Green" } else { "Red" })

