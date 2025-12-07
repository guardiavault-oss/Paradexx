# Get Auth Token for Testing
param(
    [string]$Email = "demo@paradox.app",
    [string]$Password = "demo123",
    [string]$ApiUrl = "http://localhost:8000"
)

Write-Host "🔐 Getting auth token..." -ForegroundColor Yellow

# Try backend auth endpoint first (TypeScript backend)
$backendUrl = "http://localhost:3001"
try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$backendUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    if ($response.accessToken) {
        Write-Host "✅ Token obtained from backend!" -ForegroundColor Green
        Write-Host "Token: $($response.accessToken)" -ForegroundColor Gray
        $env:AUTH_TOKEN = $response.accessToken
        Write-Host "AUTH_TOKEN environment variable set!" -ForegroundColor Green
        return $response.accessToken
    }
} catch {
    Write-Host "Backend auth failed, trying demo account..." -ForegroundColor Yellow
}

# Try demo account (works without backend)
Write-Host "Using demo account credentials..." -ForegroundColor Cyan
Write-Host "Email: $Email" -ForegroundColor Gray
Write-Host "Password: $Password" -ForegroundColor Gray

# For testing, we'll create a simple JWT token
# In production, this would come from the auth endpoint
$token = "demo-token-$(Get-Date -Format 'yyyyMMddHHmmss')"
$env:AUTH_TOKEN = $token

Write-Host "✅ Demo token created!" -ForegroundColor Green
Write-Host "Token: $token" -ForegroundColor Gray
Write-Host "AUTH_TOKEN environment variable set!" -ForegroundColor Green

return $token

