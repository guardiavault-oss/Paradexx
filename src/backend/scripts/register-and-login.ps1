# Register and Login Script for PowerShell
param(
    [string]$Email = "test@example.com",
    [string]$Password = "Test123!",
    [string]$BaseUrl = "http://localhost:3001/api"
)

Write-Host "`n🔐 Registering and Logging In...`n" -ForegroundColor Cyan

# Check if backend is running
try {
    $null = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Backend is running`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not running!" -ForegroundColor Red
    Write-Host "   Start it with: npm run dev`n" -ForegroundColor Yellow
    exit 1
}

# Register user
Write-Host "1. Registering user..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $Email
        password = $Password
        displayName = "Test User"
    } | ConvertTo-Json

    $null = Invoke-RestMethod -Uri "$BaseUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    Write-Host "   ✅ User registered`n" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   ⚠️  User already exists, proceeding to login...`n" -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Red
        }
        exit 1
    }
}

# Login
Write-Host "2. Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $token = $loginResponse.accessToken

    if (-not $token) {
        Write-Host "   ❌ No token received" -ForegroundColor Red
        exit 1
    }

    Write-Host "   ✅ Login successful!`n" -ForegroundColor Green
    Write-Host "📝 Access Token:" -ForegroundColor Cyan
    Write-Host "   $token`n" -ForegroundColor White
    
    Write-Host "💡 Token saved to environment variable`n" -ForegroundColor Yellow
    
    # Set environment variable for current session
    $env:TEST_ACCESS_TOKEN = $token
    
    # Try to add to .env
    $envFile = ".env"
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        if ($content -notmatch "TEST_ACCESS_TOKEN=") {
            Add-Content $envFile "`nTEST_ACCESS_TOKEN=$token"
            Write-Host "✅ Added TEST_ACCESS_TOKEN to .env file`n" -ForegroundColor Green
        } else {
            # Update existing token
            $content = $content -replace "TEST_ACCESS_TOKEN=.*", "TEST_ACCESS_TOKEN=$token"
            Set-Content $envFile $content
            Write-Host "✅ Updated TEST_ACCESS_TOKEN in .env file`n" -ForegroundColor Green
        }
    }

    Write-Host "Token is ready for testing!`n" -ForegroundColor Green

} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
