# Test Development Debug Routes
# Run this after restarting the server

Write-Host "Testing Development Debug Routes..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check storage
Write-Host "1. Testing GET /api/dev/storage..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dev/storage" -Method GET
    Write-Host "   ✓ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    } elseif ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 2: Create test user
Write-Host "2. Testing POST /api/dev/create-test-user..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "Test123!@#"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dev/create-test-user" -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ✓ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    } elseif ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "   Response: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "   Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Test 3: Test login
Write-Host "3. Testing POST /api/dev/test-login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "test@example.com"
        password = "Test123!@#"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dev/test-login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ✓ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan

