# Get Auth Token for Testing
Write-Host "Getting auth token for vault tests..." -ForegroundColor Cyan

$email = "test@example.com"
$password = "Test123!"

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -ErrorAction SilentlyContinue
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend not running. Start it with: npm run dev" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Try to register user
Write-Host "`n1. Registering user..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $email
        password = $password
        displayName = "Test User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop

    Write-Host "   ✅ User registered" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   ⚠️  User already exists, trying login..." -ForegroundColor Yellow
    } else {
        Write-Host "   ❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Login to get token
Write-Host "`n2. Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    $token = $loginResponse.accessToken

    if ($token) {
        Write-Host "   ✅ Login successful!" -ForegroundColor Green
        Write-Host "`n📝 Add this to your .env file:" -ForegroundColor Cyan
        Write-Host "   TEST_ACCESS_TOKEN=$token" -ForegroundColor White
        Write-Host "`nOr run this command:" -ForegroundColor Cyan
        Write-Host "   `$env:TEST_ACCESS_TOKEN='$token'" -ForegroundColor White
        Write-Host "`nThen run: npm run test:vault:complete" -ForegroundColor Yellow
        
        # Try to add to .env file
        $envFile = ".env"
        if (Test-Path $envFile) {
            $content = Get-Content $envFile -Raw
            if ($content -notmatch "TEST_ACCESS_TOKEN=") {
                Add-Content $envFile "`nTEST_ACCESS_TOKEN=$token"
                Write-Host "`n✅ Added TEST_ACCESS_TOKEN to .env file" -ForegroundColor Green
            } else {
                Write-Host "`n⚠️  TEST_ACCESS_TOKEN already exists in .env - update it manually" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ❌ No token received" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

