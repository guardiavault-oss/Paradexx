# ============================================================
# PARADOX WALLET - Platform Health Check Script
# ============================================================
# Tests all services and API endpoints to verify platform health
# ============================================================

Write-Host @"

 ██████╗ ██╗      █████╗ ████████╗███████╗ ██████╗ ██████╗ ███╗   ███╗
 ██╔══██╗██║     ██╔══██╗╚══██╔══╝██╔════╝██╔═══██╗██╔══██╗████╗ ████║
 ██████╔╝██║     ███████║   ██║   █████╗  ██║   ██║██████╔╝██╔████╔██║
 ██╔═══╝ ██║     ██╔══██║   ██║   ██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║
 ██║     ███████╗██║  ██║   ██║   ██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║
 ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝
                    HEALTH CHECK
"@ -ForegroundColor Cyan

$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing $Name..." -ForegroundColor Gray -NoNewline
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
        }
        else {
            $response = Invoke-WebRequest -Uri $Url -Method $Method -TimeoutSec 5 -ErrorAction Stop
        }
        Write-Host " ✅ OK" -ForegroundColor Green
        return @{
            Name       = $Name
            Status     = "OK"
            StatusCode = 200
            Error      = $null
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMsg = $_.Exception.Message
        Write-Host " ❌ FAILED ($errorMsg)" -ForegroundColor Red
        return @{
            Name       = $Name
            Status     = "FAILED"
            StatusCode = $statusCode
            Error      = $errorMsg
        }
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                    SERVICE HEALTH CHECKS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Core Services
Write-Host "`n📡 CORE SERVICES" -ForegroundColor Yellow
$results += Test-Endpoint -Name "Backend API Health" -Url "http://localhost:3001/health"
$results += Test-Endpoint -Name "Frontend" -Url "http://localhost:5173"
$results += Test-Endpoint -Name "MEV Guard Health" -Url "http://localhost:8000/health"
$results += Test-Endpoint -Name "Cross-Chain Health" -Url "http://localhost:8001/health"

# Database Check
Write-Host "`n💾 DATABASE SERVICES" -ForegroundColor Yellow
try {
    $pgCheck = docker exec degenx-postgres pg_isready -U degenx_user 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Testing PostgreSQL..." -ForegroundColor Gray -NoNewline
        Write-Host " ✅ OK" -ForegroundColor Green
        $results += @{ Name = "PostgreSQL"; Status = "OK"; Error = $null }
    }
    else {
        Write-Host "Testing PostgreSQL..." -ForegroundColor Gray -NoNewline
        Write-Host " ❌ FAILED" -ForegroundColor Red
        $results += @{ Name = "PostgreSQL"; Status = "FAILED"; Error = "Not responding" }
    }
}
catch {
    Write-Host "Testing PostgreSQL..." -ForegroundColor Gray -NoNewline
    Write-Host " ⚠️ SKIPPED (Docker not running)" -ForegroundColor Yellow
    $results += @{ Name = "PostgreSQL"; Status = "SKIPPED"; Error = "Docker not available" }
}

try {
    $redisCheck = docker exec degenx-redis redis-cli ping 2>&1
    if ($redisCheck -match "PONG") {
        Write-Host "Testing Redis..." -ForegroundColor Gray -NoNewline
        Write-Host " ✅ OK" -ForegroundColor Green
        $results += @{ Name = "Redis"; Status = "OK"; Error = $null }
    }
    else {
        Write-Host "Testing Redis..." -ForegroundColor Gray -NoNewline
        Write-Host " ❌ FAILED" -ForegroundColor Red
        $results += @{ Name = "Redis"; Status = "FAILED"; Error = "Not responding" }
    }
}
catch {
    Write-Host "Testing Redis..." -ForegroundColor Gray -NoNewline
    Write-Host " ⚠️ SKIPPED (Docker not running)" -ForegroundColor Yellow
    $results += @{ Name = "Redis"; Status = "SKIPPED"; Error = "Docker not available" }
}

# API Endpoints
Write-Host "`n🔌 API ENDPOINTS" -ForegroundColor Yellow
$results += Test-Endpoint -Name "Auth Endpoint" -Url "http://localhost:3001/api/auth/me"
$results += Test-Endpoint -Name "Market Data" -Url "http://localhost:3001/api/market-data/prices"
$results += Test-Endpoint -Name "Test Endpoint" -Url "http://localhost:3001/api/test/ping"

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                         SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Status -eq "OK" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAILED" }).Count
$skipped = ($results | Where-Object { $_.Status -eq "SKIPPED" }).Count
$total = $results.Count

Write-Host "`n✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "⚠️ Skipped: $skipped" -ForegroundColor $(if ($skipped -gt 0) { "Yellow" } else { "Gray" })
Write-Host "📊 Total: $total"

if ($failed -gt 0) {
    Write-Host "`n❌ PLATFORM NOT FULLY OPERATIONAL" -ForegroundColor Red
    Write-Host "Run .\start-full-platform.ps1 to start all services" -ForegroundColor Yellow
}
else {
    Write-Host "`n✅ PLATFORM OPERATIONAL" -ForegroundColor Green
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                      SERVICE URLS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Frontend:        http://localhost:5173" -ForegroundColor Gray
Write-Host "📡 Backend API:     http://localhost:3001" -ForegroundColor Gray
Write-Host "🛡️ MEV Guard:       http://localhost:8000" -ForegroundColor Gray
Write-Host "🌉 Cross-Chain:     http://localhost:8001" -ForegroundColor Gray
Write-Host "🐘 PgAdmin:         http://localhost:5050" -ForegroundColor Gray
Write-Host "📦 Redis Commander: http://localhost:8081" -ForegroundColor Gray
Write-Host ""
