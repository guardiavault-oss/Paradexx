# Test authentication endpoints
Write-Host "Testing authentication endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test register endpoint
Write-Host "1. Testing POST /api/auth/register" -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -SessionVariable session
    
    Write-Host "✅ Register successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Register failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error details: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test login endpoint
Write-Host "2. Testing POST /api/auth/login" -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "testpassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -WebSession $session
    
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error details: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Cyan


