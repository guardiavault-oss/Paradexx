# 🛡️ Setup Token Protection Script (PowerShell)
# Automatically protects your token from MEV bots

Write-Host "🛡️ MEV Protection Setup for Token" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Get token address
$TOKEN_ADDRESS = Read-Host "Enter your token address"
if ([string]::IsNullOrWhiteSpace($TOKEN_ADDRESS)) {
    Write-Host "❌ Token address is required" -ForegroundColor Red
    exit 1
}

# Get network
Write-Host ""
Write-Host "Select network:"
Write-Host "1) Ethereum"
Write-Host "2) Polygon"
Write-Host "3) BSC"
Write-Host "4) Arbitrum"
$NETWORK_CHOICE = Read-Host "Enter choice (1-4)"

switch ($NETWORK_CHOICE) {
    "1" { $NETWORK = "ethereum" }
    "2" { $NETWORK = "polygon" }
    "3" { $NETWORK = "bsc" }
    "4" { $NETWORK = "arbitrum" }
    default {
        Write-Host "❌ Invalid network choice" -ForegroundColor Red
        exit 1
    }
}

# Get API key
$API_KEY = Read-Host "Enter API key"
if ([string]::IsNullOrWhiteSpace($API_KEY)) {
    Write-Host "⚠️  Using default API key (demo-api-key)" -ForegroundColor Yellow
    $API_KEY = "demo-api-key"
}

# Get protection level
Write-Host ""
Write-Host "Select protection level:"
Write-Host "1) Basic"
Write-Host "2) Standard"
Write-Host "3) High (Recommended)"
Write-Host "4) Maximum"
Write-Host "5) Enterprise"
$PROTECTION_CHOICE = Read-Host "Enter choice (1-5) [Default: 3]"

switch ($PROTECTION_CHOICE) {
    "1" { $PROTECTION_LEVEL = "basic" }
    "2" { $PROTECTION_LEVEL = "standard" }
    "3" { $PROTECTION_LEVEL = "high" }
    "" { $PROTECTION_LEVEL = "high" }
    "4" { $PROTECTION_LEVEL = "maximum" }
    "5" { $PROTECTION_LEVEL = "enterprise" }
    default { $PROTECTION_LEVEL = "high" }
}

# API endpoint
$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:8000" }

Write-Host ""
Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Token Address: $TOKEN_ADDRESS"
Write-Host "  Network: $NETWORK"
Write-Host "  Protection Level: $PROTECTION_LEVEL"
Write-Host "  API URL: $API_URL"
Write-Host ""

$CONFIRM = Read-Host "Continue? (y/n)"
if ($CONFIRM -ne "y") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🚀 Adding token protection..." -ForegroundColor Green

# Prepare request body
$body = @{
    address = $TOKEN_ADDRESS
    address_type = "token"
    network = $NETWORK
    protection_level = $PROTECTION_LEVEL
    auto_protect = $true
    notify_on_threat = $true
} | ConvertTo-Json

# Add protected address
try {
    $headers = @{
        "Authorization" = "Bearer $API_KEY"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/api/v1/protected-addresses" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ Token protection added successfully!" -ForegroundColor Green
    Write-Host ""
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "🛡️ Your token is now protected from MEV bots!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor protection:"
    Write-Host "  curl $API_URL/api/v1/protected-addresses -H `"Authorization: Bearer $API_KEY`""
    Write-Host ""
    Write-Host "View statistics:"
    Write-Host "  curl $API_URL/api/v1/protected-addresses/stats -H `"Authorization: Bearer $API_KEY`""
}
catch {
    Write-Host "❌ Failed to add protection" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}


