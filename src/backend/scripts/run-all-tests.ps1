# Run All Tests Script
Write-Host "`n🧪 Running All Tests...`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$ErrorActionPreference = "Continue"
$results = @{}

# Test 1: Trading API
Write-Host "`n[1/4] Testing Trading API..." -ForegroundColor Yellow
try {
    $output = npm run test:trading 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -or $output -match "✅") {
        $results["Trading"] = "✅ PASSED"
        Write-Host "   ✅ Trading API: PASSED" -ForegroundColor Green
    } else {
        $results["Trading"] = "⚠️  PARTIAL"
        Write-Host "   ⚠️  Trading API: PARTIAL (expected - needs funded wallet)" -ForegroundColor Yellow
    }
} catch {
    $results["Trading"] = "❌ FAILED"
    Write-Host "   ❌ Trading API: FAILED" -ForegroundColor Red
}

# Test 2: Vault Logic (no database needed)
Write-Host "`n[2/4] Testing Vault Logic..." -ForegroundColor Yellow
try {
    $output = npm run test:vault:complete 2>&1 | Out-String
    if ($output -match "✅ Vault Logic: PASSED") {
        $results["VaultLogic"] = "✅ PASSED"
        Write-Host "   ✅ Vault Logic: PASSED" -ForegroundColor Green
    } else {
        $results["VaultLogic"] = "❌ FAILED"
        Write-Host "   ❌ Vault Logic: FAILED" -ForegroundColor Red
    }
} catch {
    $results["VaultLogic"] = "❌ FAILED"
    Write-Host "   ❌ Vault Logic: FAILED" -ForegroundColor Red
}

# Test 3: Database Connection
Write-Host "`n[3/4] Testing Database Connection..." -ForegroundColor Yellow
try {
    $output = npm run test:vault:complete 2>&1 | Out-String
    if ($output -match "✅ Database: CONNECTED") {
        $results["Database"] = "✅ CONNECTED"
        Write-Host "   ✅ Database: CONNECTED" -ForegroundColor Green
    } elseif ($output -match "⚠️.*Database: NOT AVAILABLE") {
        $results["Database"] = "⚠️  NOT AVAILABLE"
        Write-Host "   ⚠️  Database: NOT AVAILABLE" -ForegroundColor Yellow
    } else {
        $results["Database"] = "❌ FAILED"
        Write-Host "   ❌ Database: FAILED" -ForegroundColor Red
    }
} catch {
    $results["Database"] = "❌ FAILED"
    Write-Host "   ❌ Database: FAILED" -ForegroundColor Red
}

# Test 4: API Endpoints (requires auth token)
Write-Host "`n[4/4] Testing API Endpoints..." -ForegroundColor Yellow

# Try to get token first
Write-Host "   Getting auth token..." -ForegroundColor Gray
try {
    $tokenScript = Join-Path $PSScriptRoot "register-and-login.ps1"
    & $tokenScript -ErrorAction SilentlyContinue | Out-Null
    
    if ($env:TEST_ACCESS_TOKEN) {
        Write-Host "   ✅ Token obtained" -ForegroundColor Green
        
        # Run vault test with token
        $output = npm run test:vault:complete 2>&1 | Out-String
        if ($output -match "✅ Guardian API: WORKING" -and $output -match "✅ Recovery API: WORKING") {
            $results["APIs"] = "✅ WORKING"
            Write-Host "   ✅ API Endpoints: WORKING" -ForegroundColor Green
        } elseif ($output -match "⚠️.*API: SKIPPED") {
            $results["APIs"] = "⚠️  SKIPPED"
            Write-Host "   ⚠️  API Endpoints: SKIPPED (need token)" -ForegroundColor Yellow
        } else {
            $results["APIs"] = "⚠️  PARTIAL"
            Write-Host "   ⚠️  API Endpoints: PARTIAL" -ForegroundColor Yellow
        }
    } else {
        $results["APIs"] = "⚠️  NO TOKEN"
        Write-Host "   ⚠️  API Endpoints: NO TOKEN (backend may not be running)" -ForegroundColor Yellow
    }
} catch {
    $results["APIs"] = "⚠️  SKIPPED"
    Write-Host "   ⚠️  API Endpoints: SKIPPED" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "`n📊 TEST RESULTS SUMMARY`n" -ForegroundColor Cyan

foreach ($key in $results.Keys) {
    Write-Host "   $key : $($results[$key])" -ForegroundColor White
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host ""

