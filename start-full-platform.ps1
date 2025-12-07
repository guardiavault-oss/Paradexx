# ============================================================
# PARADOX WALLET - FULL PLATFORM STARTUP SCRIPT
# ============================================================
# Starts ALL services for complete trading, inheritance, and platform functionality
# Services: PostgreSQL, Redis, Backend API, MEV Guard, Cross-Chain, Degen Services, Frontend
# ============================================================

param(
    [switch]$SkipDocker,
    [switch]$SkipPython,
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "Paradox Wallet - Full Platform"

Write-Host @"

 ██████╗  █████╗ ██████╗  █████╗ ██████╗  ██████╗ ██╗  ██╗
 ██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗╚██╗██╔╝
 ██████╔╝███████║██████╔╝███████║██║  ██║██║   ██║ ╚███╔╝ 
 ██╔═══╝ ██╔══██║██╔══██╗██╔══██║██║  ██║██║   ██║ ██╔██╗ 
 ██║     ██║  ██║██║  ██║██║  ██║██████╔╝╚██████╔╝██╔╝ ██╗
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                    FULL PLATFORM STARTUP
"@ -ForegroundColor Cyan

$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = "$ROOT_DIR\src\backend"
$MEVGUARD_DIR = "$ROOT_DIR\mevguard service"
$CROSSCHAIN_DIR = "$ROOT_DIR\crosschain service"
$DEGEN_DIR = "$ROOT_DIR\degen services"
$SCARLETTE_DIR = "$ROOT_DIR\scarlette service"

# ============================================================
# PORT CONFIGURATION
# ============================================================
$PORTS = @{
    PostgreSQL = 5432
    Redis = 6379
    Backend = 3001
    Frontend = 5173
    MEVGuard = 8000
    CrossChain = 8001
    DegenServices = 3002
    Scarlette = 8002
    PgAdmin = 5050
    RedisCommander = 8081
}

# ============================================================
# ENVIRONMENT VARIABLES
# ============================================================
function Set-EnvironmentVariables {
    Write-Host "`n🔧 Setting Environment Variables..." -ForegroundColor Yellow
    
    # Database
    $env:DATABASE_URL = "postgresql://degenx_user:degenx_secure_password_2024@localhost:5432/degenx"
    $env:REDIS_URL = "redis://localhost:6379"
    
    # Security
    $env:JWT_SECRET = "h9vxNzfuTqN7Fb/jnsodKGBr3Pok43A7fxef1FKqGBw="
    $env:JWT_REFRESH_SECRET = "4QHgx6Mwz7rJjPykAbL21XoUl0S39TqWNYBdDGF8CnKEIues5faichmRZptOVv"
    $env:ENCRYPTION_KEY = "0cf39b7c3dbb9420c8156320f5b5a613e8b800edbbfc11d30ed944bb0b848b3b"
    
    # Service URLs
    $env:FRONTEND_URL = "http://localhost:5173"
    $env:BACKEND_URL = "http://localhost:3001"
    $env:VITE_API_URL = "http://localhost:3001"
    $env:VITE_WS_URL = "ws://localhost:3001"
    $env:VITE_MEVGUARD_URL = "http://localhost:8000"
    $env:VITE_CROSSCHAIN_URL = "http://localhost:8001"
    
    # Blockchain RPC (using public endpoints for development)
    $env:ETHEREUM_RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/KQDdqBIVP39M0b1A_2nwMXvFAFyYNfzT"
    $env:ETH_RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/KQDdqBIVP39M0b1A_2nwMXvFAFyYNfzT"
    $env:POLYGON_RPC_URL = "https://polygon.llamarpc.com"
    $env:BSC_RPC_URL = "https://bsc-dataseed.binance.org"
    $env:ARB_RPC_URL = "https://arb1.arbitrum.io/rpc"
    $env:BASE_RPC_URL = "https://mainnet.base.org"
    $env:FLASHBOTS_RPC = "https://rpc.flashbots.net"
    
    # API Keys
    $env:ALCHEMY_API_KEY = "KQDdqBIVP39M0b1A_2nwMXvFAFyYNfzT"
    $env:ETHERSCAN_API_KEY = "SBHWY68WVXPC58XJB7FC812MK73192WY6V"
    $env:ONEINCH_API_KEY = "pz32NE87fPUJrLFQj7SLYIL2bzyF73Lv"
    $env:BLOCKNATIVE_API_KEY = "aad44046-3c9d-4bde-9229-0a9d692d1168"
    
    # Feature Flags
    $env:ENABLE_SNIPER_BOT = "true"
    $env:ENABLE_MEMPOOL_MONITORING = "true"
    $env:ENABLE_MEV_PROTECTION = "true"
    $env:ENABLE_TX_SIMULATION = "true"
    
    # Runtime
    $env:NODE_ENV = "development"
    $env:LOG_LEVEL = "INFO"
    $env:PORT = "3001"
    
    Write-Host "✅ Environment variables configured" -ForegroundColor Green
}

# ============================================================
# UTILITY FUNCTIONS
# ============================================================
function Stop-ProcessOnPort {
    param([int]$Port)
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            try {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "   Stopped process on port $Port" -ForegroundColor Gray
            } catch {}
        }
        Start-Sleep -Seconds 1
    }
}

function Test-CommandExists {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Wait-ForService {
    param(
        [string]$Name,
        [string]$Url,
        [int]$MaxAttempts = 30
    )
    Write-Host "   Waiting for $Name..." -ForegroundColor Gray
    for ($i = 0; $i -lt $MaxAttempts; $i++) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 2 -ErrorAction Stop
            Write-Host "   ✅ $Name is ready" -ForegroundColor Green
            return $true
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "   ⚠️ $Name may still be starting" -ForegroundColor Yellow
    return $false
}

# ============================================================
# CLEANUP EXISTING SERVICES
# ============================================================
function Stop-ExistingServices {
    Write-Host "`n🛑 Stopping existing services..." -ForegroundColor Yellow
    
    foreach ($port in $PORTS.Values) {
        Stop-ProcessOnPort -Port $port
    }
    
    Write-Host "✅ Existing services stopped" -ForegroundColor Green
}

# ============================================================
# DOCKER SERVICES (PostgreSQL & Redis)
# ============================================================
function Start-DockerServices {
    if ($SkipDocker) {
        Write-Host "`n⏭️  Skipping Docker services (use -SkipDocker to skip)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "`n🐳 Starting Docker Services (PostgreSQL & Redis)..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "docker")) {
        Write-Host "⚠️  Docker not found - please ensure PostgreSQL and Redis are running locally" -ForegroundColor Yellow
        return
    }
    
    # Check if containers already running
    $postgresRunning = docker ps --filter "name=degenx-postgres" --format "{{.Names}}" 2>$null
    $redisRunning = docker ps --filter "name=degenx-redis" --format "{{.Names}}" 2>$null
    
    if ($postgresRunning -and $redisRunning) {
        Write-Host "✅ Docker containers already running" -ForegroundColor Green
        return
    }
    
    # Start containers
    Set-Location $ROOT_DIR
    docker-compose -f docker-compose.simple.yml up -d postgres redis 2>&1 | Out-Null
    
    Write-Host "   Waiting for databases to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Verify PostgreSQL
    for ($i = 0; $i -lt 20; $i++) {
        $result = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
            break
        }
        Start-Sleep -Seconds 2
    }
    
    # Verify Redis
    $redisResult = docker exec degenx-redis redis-cli ping 2>&1
    if ($redisResult -match "PONG") {
        Write-Host "✅ Redis is ready" -ForegroundColor Green
    }
}

# ============================================================
# BACKEND API (TypeScript/Express)
# ============================================================
function Start-BackendAPI {
    Write-Host "`n📡 Starting Backend API (port $($PORTS.Backend))..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "node")) {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        return $null
    }
    
    Set-Location $BACKEND_DIR
    
    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing backend dependencies..." -ForegroundColor Gray
        pnpm install 2>&1 | Out-Null
    }
    
    # Run Prisma migrations
    if (Test-Path "prisma/schema.prisma") {
        Write-Host "   Running database migrations..." -ForegroundColor Gray
        npx prisma generate 2>&1 | Out-Null
        npx prisma migrate dev --name init --skip-generate 2>&1 | Out-Null
    }
    
    # Start backend
    $job = Start-Job -ScriptBlock {
        param($dir, $dbUrl, $redisUrl, $jwtSecret, $jwtRefresh)
        Set-Location $dir
        $env:DATABASE_URL = $dbUrl
        $env:REDIS_URL = $redisUrl
        $env:JWT_SECRET = $jwtSecret
        $env:JWT_REFRESH_SECRET = $jwtRefresh
        $env:NODE_ENV = "development"
        $env:PORT = "3001"
        npx tsx server.ts
    } -ArgumentList $BACKEND_DIR, $env:DATABASE_URL, $env:REDIS_URL, $env:JWT_SECRET, $env:JWT_REFRESH_SECRET
    
    Write-Host "✅ Backend API starting (Job ID: $($job.Id))" -ForegroundColor Green
    Set-Location $ROOT_DIR
    return $job
}

# ============================================================
# MEV GUARD SERVICE (Python/FastAPI)
# ============================================================
function Start-MEVGuardService {
    if ($SkipPython) {
        Write-Host "`n⏭️  Skipping MEV Guard service" -ForegroundColor Yellow
        return $null
    }
    
    Write-Host "`n🛡️  Starting MEV Guard Service (port $($PORTS.MEVGuard))..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "python")) {
        Write-Host "⚠️  Python not found - skipping MEV Guard" -ForegroundColor Yellow
        return $null
    }
    
    $job = Start-Job -ScriptBlock {
        param($dir, $port)
        Set-Location $dir
        $env:PORT = $port
        $env:LOG_LEVEL = "INFO"
        python -m uvicorn api:app --host 0.0.0.0 --port $port --reload
    } -ArgumentList $MEVGUARD_DIR, $PORTS.MEVGuard
    
    Write-Host "✅ MEV Guard starting (Job ID: $($job.Id))" -ForegroundColor Green
    return $job
}

# ============================================================
# CROSS-CHAIN SERVICE (Python/FastAPI)
# ============================================================
function Start-CrossChainService {
    if ($SkipPython) {
        Write-Host "`n⏭️  Skipping Cross-Chain service" -ForegroundColor Yellow
        return $null
    }
    
    Write-Host "`n🌉 Starting Cross-Chain Service (port $($PORTS.CrossChain))..." -ForegroundColor Yellow
    
    if (-not (Test-CommandExists "python")) {
        Write-Host "⚠️  Python not found - skipping Cross-Chain service" -ForegroundColor Yellow
        return $null
    }
    
    $job = Start-Job -ScriptBlock {
        param($dir, $port)
        Set-Location $dir
        python run.py --host 0.0.0.0 --port $port --dev
    } -ArgumentList $CROSSCHAIN_DIR, $PORTS.CrossChain
    
    Write-Host "✅ Cross-Chain service starting (Job ID: $($job.Id))" -ForegroundColor Green
    return $job
}

# ============================================================
# DEGEN SERVICES (TypeScript/Express - Sniper Bot)
# ============================================================
function Start-DegenServices {
    Write-Host "`n🎯 Starting Degen Services (port $($PORTS.DegenServices))..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$DEGEN_DIR\package.json")) {
        Write-Host "⚠️  Degen services not found" -ForegroundColor Yellow
        return $null
    }
    
    Set-Location $DEGEN_DIR
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing degen services dependencies..." -ForegroundColor Gray
        npm install 2>&1 | Out-Null
    }
    
    $job = Start-Job -ScriptBlock {
        param($dir, $dbUrl, $redisUrl)
        Set-Location $dir
        $env:DATABASE_URL = $dbUrl
        $env:REDIS_URL = $redisUrl
        $env:PORT = "3002"
        npm run dev:backend
    } -ArgumentList $DEGEN_DIR, $env:DATABASE_URL, $env:REDIS_URL
    
    Write-Host "✅ Degen services starting (Job ID: $($job.Id))" -ForegroundColor Green
    Set-Location $ROOT_DIR
    return $job
}

# ============================================================
# FRONTEND (Vite/React)
# ============================================================
function Start-Frontend {
    Write-Host "`n🎨 Starting Frontend (port $($PORTS.Frontend))..." -ForegroundColor Yellow
    
    Set-Location $ROOT_DIR
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
        pnpm install 2>&1 | Out-Null
    }
    
    $job = Start-Job -ScriptBlock {
        param($dir, $apiUrl, $wsUrl, $mevUrl, $crosschainUrl)
        Set-Location $dir
        $env:VITE_API_URL = $apiUrl
        $env:VITE_WS_URL = $wsUrl
        $env:VITE_MEVGUARD_URL = $mevUrl
        $env:VITE_CROSSCHAIN_URL = $crosschainUrl
        pnpm run dev
    } -ArgumentList $ROOT_DIR, "http://localhost:3001", "ws://localhost:3001", "http://localhost:8000", "http://localhost:8001"
    
    Write-Host "✅ Frontend starting (Job ID: $($job.Id))" -ForegroundColor Green
    return $job
}

# ============================================================
# MAIN EXECUTION
# ============================================================
Write-Host "`n📋 Platform Configuration:" -ForegroundColor Cyan
Write-Host "   Root Directory: $ROOT_DIR" -ForegroundColor Gray
Write-Host "   Skip Docker: $SkipDocker" -ForegroundColor Gray
Write-Host "   Skip Python: $SkipPython" -ForegroundColor Gray
Write-Host "   Frontend Only: $FrontendOnly" -ForegroundColor Gray
Write-Host "   Backend Only: $BackendOnly" -ForegroundColor Gray

# Set environment
Set-EnvironmentVariables

# Stop existing services
Stop-ExistingServices

# Initialize job tracking
$jobs = @{}

if (-not $FrontendOnly) {
    # Start Docker services
    Start-DockerServices
    Start-Sleep -Seconds 3
    
    # Start Backend API
    $jobs.Backend = Start-BackendAPI
    Start-Sleep -Seconds 5
    
    # Start Python services
    $jobs.MEVGuard = Start-MEVGuardService
    $jobs.CrossChain = Start-CrossChainService
    Start-Sleep -Seconds 3
    
    # Start Degen Services
    $jobs.DegenServices = Start-DegenServices
    Start-Sleep -Seconds 3
}

if (-not $BackendOnly) {
    # Start Frontend
    $jobs.Frontend = Start-Frontend
    Start-Sleep -Seconds 5
}

# Wait for services to initialize
Write-Host "`n⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# ============================================================
# SERVICE STATUS SUMMARY
# ============================================================
Write-Host "`n" -NoNewline
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                     SERVICE STATUS SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Check each service
$serviceStatus = @{}

# Check Backend
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$($PORTS.Backend)/health" -Method Get -TimeoutSec 3
    $serviceStatus.Backend = "✅ Running"
    Write-Host "   Backend API:        ✅ Running (http://localhost:$($PORTS.Backend))" -ForegroundColor Green
} catch {
    $serviceStatus.Backend = "⚠️ Starting"
    Write-Host "   Backend API:        ⚠️  Starting (http://localhost:$($PORTS.Backend))" -ForegroundColor Yellow
}

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$($PORTS.Frontend)" -Method Get -TimeoutSec 3
    $serviceStatus.Frontend = "✅ Running"
    Write-Host "   Frontend:           ✅ Running (http://localhost:$($PORTS.Frontend))" -ForegroundColor Green
} catch {
    $serviceStatus.Frontend = "⚠️ Starting"
    Write-Host "   Frontend:           ⚠️  Starting (http://localhost:$($PORTS.Frontend))" -ForegroundColor Yellow
}

# Check MEV Guard
if (-not $SkipPython) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$($PORTS.MEVGuard)/health" -Method Get -TimeoutSec 3
        Write-Host "   MEV Guard:          ✅ Running (http://localhost:$($PORTS.MEVGuard))" -ForegroundColor Green
    } catch {
        Write-Host "   MEV Guard:          ⚠️  Starting (http://localhost:$($PORTS.MEVGuard))" -ForegroundColor Yellow
    }
}

# PostgreSQL and Redis
Write-Host "   PostgreSQL:         📦 localhost:$($PORTS.PostgreSQL)" -ForegroundColor Gray
Write-Host "   Redis:              📦 localhost:$($PORTS.Redis)" -ForegroundColor Gray

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# ============================================================
# API ENDPOINTS REFERENCE
# ============================================================
Write-Host "`n📚 API ENDPOINTS REFERENCE:" -ForegroundColor Cyan
Write-Host @"

   🔐 AUTHENTICATION
      POST /api/auth/register     - Register new user
      POST /api/auth/login        - Login with email/password
      POST /api/auth/oauth/google - OAuth with Google
      POST /api/auth/refresh      - Refresh access token

   💼 WALLET
      GET  /api/wallet/balance    - Get wallet balance
      POST /api/wallet/create     - Create new wallet
      GET  /api/wallet/transactions - Get transaction history

   💱 TRADING & SWAPS
      POST /api/swaps/aggregators - Get swap quotes from all DEXs
      POST /api/swaps/build-tx    - Build swap transaction
      POST /api/trading/orders    - Create limit order
      POST /api/trading/dca       - Create DCA plan
      GET  /api/trading/orders    - Get user orders

   🛡️ MEV PROTECTION
      GET  /api/mev-guard/status  - Check MEV protection status
      POST /api/mev-guard/protect - Submit protected transaction

   🏦 INHERITANCE VAULT
      POST /api/inheritance/vault      - Create inheritance vault
      GET  /api/inheritance/vault      - Get user's vault
      POST /api/inheritance/check-in   - Manual check-in
      POST /api/inheritance/beneficiary - Add beneficiary

   🌉 CROSS-CHAIN
      POST /api/cross-chain/quote - Get bridge quote
      POST /api/cross-chain/bridge - Execute bridge transaction

   📊 MARKET DATA
      GET  /api/market-data/prices - Get token prices
      GET  /api/market-data/trending - Get trending tokens

"@ -ForegroundColor Gray

# ============================================================
# JOB MONITORING
# ============================================================
Write-Host "📝 SERVICE LOGS:" -ForegroundColor Cyan
foreach ($key in $jobs.Keys) {
    if ($jobs[$key]) {
        Write-Host "   Receive-Job -Id $($jobs[$key].Id)  # $key" -ForegroundColor Gray
    }
}

# Save job info
$jobInfo = @{}
foreach ($key in $jobs.Keys) {
    if ($jobs[$key]) {
        $jobInfo[$key] = $jobs[$key].Id
    }
}
$jobInfo.StartedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$jobInfo | ConvertTo-Json | Out-File -FilePath "$ROOT_DIR\.platform-jobs.json" -Encoding UTF8

Write-Host "`n💾 Job IDs saved to .platform-jobs.json" -ForegroundColor Gray
Write-Host "`n🎉 Platform startup complete!" -ForegroundColor Green
Write-Host "   Open http://localhost:$($PORTS.Frontend) in your browser" -ForegroundColor Cyan
Write-Host ""

# Return to root
Set-Location $ROOT_DIR
