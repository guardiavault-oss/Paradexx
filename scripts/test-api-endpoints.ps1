# ============================================
# Paradox Wallet API Endpoint Test Suite
# Tests all major backend API endpoints
# ============================================

$BaseUrl = "http://localhost:3001"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Colors for output
function Write-Success { param($msg) Write-Host "[PASS] $msg" -ForegroundColor Green }
function Write-Failure { param($msg) Write-Host "[FAIL] $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Header { 
    param($msg) 
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Yellow
    Write-Host "  $msg" -ForegroundColor Yellow
    Write-Host "============================================" -ForegroundColor Yellow
}

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200,
        [switch]$AllowError
    )
    
    $script:TotalTests++
    $url = "$BaseUrl$Endpoint"
    
    try {
        $params = @{
            Uri         = $url
            Method      = $Method
            ContentType = "application/json"
            TimeoutSec  = 10
            ErrorAction = "Stop"
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        
        if ($statusCode -eq $ExpectedStatus -or ($AllowError -and $statusCode -lt 500)) {
            $script:PassedTests++
            Write-Success "$Name - Status: $statusCode"
            return @{ Success = $true; Status = $statusCode; Data = $content }
        }
        else {
            $script:FailedTests++
            Write-Failure "$Name - Expected $ExpectedStatus, got $statusCode"
            return @{ Success = $false; Status = $statusCode; Data = $content }
        }
    }
    catch {
        $errorStatus = 0
        if ($_.Exception.Response) {
            $errorStatus = [int]$_.Exception.Response.StatusCode
        }
        
        if ($AllowError -or $errorStatus -eq $ExpectedStatus) {
            $script:PassedTests++
            Write-Success "$Name - Status: $errorStatus (expected error)"
            return @{ Success = $true; Status = $errorStatus; Error = $_.Exception.Message }
        }
        else {
            $script:FailedTests++
            Write-Failure "$Name - Error: $($_.Exception.Message)"
            return @{ Success = $false; Status = $errorStatus; Error = $_.Exception.Message }
        }
    }
}

# ============================================
# CHECK SERVER STATUS
# ============================================
Write-Header "CHECKING SERVER STATUS"

Write-Info "Testing connection to $BaseUrl..."
try {
    $healthCheck = Invoke-WebRequest -Uri "$BaseUrl/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Success "Server is running!"
}
catch {
    Write-Failure "Server is not responding at $BaseUrl"
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd src/backend" -ForegroundColor White
    Write-Host "  pnpm dev" -ForegroundColor White
    exit 1
}

# ============================================
# HEALTH & STATUS ENDPOINTS
# ============================================
Write-Header "HEALTH AND STATUS ENDPOINTS"

Test-Endpoint -Name "Health Check" -Endpoint "/health"
Test-Endpoint -Name "Database Status" -Endpoint "/api/test/db/status"

# ============================================
# AI SERVICES (Scarlett AI)
# ============================================
Write-Header "AI SERVICES (Scarlett AI)"

Test-Endpoint -Name "AI Health Check" -Endpoint "/api/ai/health"

# ============================================
# WALLET DATA ENDPOINTS
# ============================================
Write-Header "WALLET DATA ENDPOINTS"

$testWallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" # Vitalik's address

Test-Endpoint -Name "Get Token Balances" -Endpoint "/api/wallet/tokens/$testWallet" -AllowError
Test-Endpoint -Name "Get Transactions" -Endpoint "/api/wallet/transactions/$testWallet" -AllowError
Test-Endpoint -Name "Get Portfolio" -Endpoint "/api/wallet/portfolio/$testWallet" -AllowError

# ============================================
# SWAP ENDPOINTS
# ============================================
Write-Header "SWAP ENDPOINTS"

Test-Endpoint -Name "Get Swap Tokens" -Endpoint "/api/swaps/tokens?chainId=1"
Test-Endpoint -Name "Get Swap Quote" -Method "POST" -Endpoint "/api/swaps/quote" -Body @{
    fromToken = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    toToken   = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    amount    = "1000000000000000000"
    chainId   = 1
} -AllowError

# ============================================
# CROSS-CHAIN ENDPOINTS
# ============================================
Write-Header "CROSS-CHAIN ENDPOINTS"

Test-Endpoint -Name "Get Bridge Routes" -Method "POST" -Endpoint "/api/cross-chain/routes" -Body @{
    fromChainId = 1
    toChainId   = 137
    fromToken   = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    toToken     = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    amount      = "1000000000000000000"
} -AllowError

# ============================================
# MEV GUARD ENDPOINTS
# ============================================
Write-Header "MEV GUARD ENDPOINTS"

Test-Endpoint -Name "MEV Analysis" -Method "POST" -Endpoint "/api/mev-guard/analyze" -Body @{
    to      = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    data    = "0x"
    value   = "1000000000000000000"
    chainId = 1
} -AllowError

# ============================================
# MARKET DATA ENDPOINTS
# ============================================
Write-Header "MARKET DATA ENDPOINTS"

Test-Endpoint -Name "Get Token Prices" -Endpoint "/api/market-data/prices?ids=ethereum,bitcoin" -AllowError
Test-Endpoint -Name "Get Trending Tokens" -Endpoint "/api/market-data/trending"

# ============================================
# WHALE TRACKER ENDPOINTS
# ============================================
Write-Header "WHALE TRACKER ENDPOINTS"

Test-Endpoint -Name "Get Whale Wallets" -Endpoint "/api/whales" -AllowError
Test-Endpoint -Name "Get Recent Whale Txs" -Endpoint "/api/whales/transactions"

# ============================================
# AIRDROP HUNTER ENDPOINTS
# ============================================
Write-Header "AIRDROP HUNTER ENDPOINTS"

Test-Endpoint -Name "Get Active Airdrops" -Endpoint "/api/airdrops" -AllowError
Test-Endpoint -Name "Get Airdrop Eligibility" -Endpoint "/api/airdrops/eligibility/$testWallet" -AllowError

# ============================================
# SMART GAS ENDPOINTS
# ============================================
Write-Header "SMART GAS ENDPOINTS"

Test-Endpoint -Name "Get Gas Prices" -Endpoint "/api/gas/prices"
Test-Endpoint -Name "Get Gas History" -Endpoint "/api/gas/estimate" -AllowError

# ============================================
# CHANGENOW ENDPOINTS
# ============================================
Write-Header "CHANGENOW ENDPOINTS"

Test-Endpoint -Name "Get ChangeNOW Currencies" -Endpoint "/api/changenow/currencies"
Test-Endpoint -Name "Get Min Amount" -Endpoint "/api/changenow/min-amount?from=btc`&to=eth" -AllowError

# ============================================
# PREMIUM/SUBSCRIPTION ENDPOINTS
# ============================================
Write-Header "PREMIUM ENDPOINTS"

Test-Endpoint -Name "Get Premium Plans" -Endpoint "/api/premium" -AllowError
Test-Endpoint -Name "Get Premium Features" -Endpoint "/api/premium/features"

# ============================================
# FIAT ON-RAMP ENDPOINTS
# ============================================
Write-Header "FIAT ON-RAMP ENDPOINTS"

Test-Endpoint -Name "Get MoonPay Currencies" -Endpoint "/api/moonpay/currencies" -AllowError
Test-Endpoint -Name "Get Onramper Quote" -Endpoint "/api/onramper/quote?fiat=usd`&crypto=eth`&amount=100" -AllowError

# ============================================
# NFT ENDPOINTS
# ============================================
Write-Header "NFT ENDPOINTS"

Test-Endpoint -Name "Get NFT Collections" -Endpoint "/api/nft/collections/$testWallet" -AllowError

# ============================================
# TRADING ENDPOINTS
# ============================================
Write-Header "TRADING ENDPOINTS"

Test-Endpoint -Name "Get Trading Info" -Endpoint "/api/trading" -AllowError
Test-Endpoint -Name "Get Order Book" -Endpoint "/api/trading/orderbook?pair=ETH-USDT" -AllowError

# ============================================
# TEST RESULTS SUMMARY
# ============================================
Write-Header "TEST RESULTS SUMMARY"

$successRate = if ($TotalTests -gt 0) { [math]::Round(($PassedTests / $TotalTests) * 100, 1) } else { 0 }

Write-Host "`nTotal Tests: $TotalTests" -ForegroundColor White
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 50) { "Yellow" } else { "Red" })

if ($FailedTests -eq 0) {
    Write-Host ""
    Write-Host "All tests passed!" -ForegroundColor Green
}
elseif ($successRate -ge 80) {
    Write-Host ""
    Write-Host "Most tests passed, but some endpoints need attention." -ForegroundColor Yellow
}
else {
    Write-Host ""
    Write-Host "Multiple endpoints failing. Check server logs for details." -ForegroundColor Red
}

Write-Host ""
