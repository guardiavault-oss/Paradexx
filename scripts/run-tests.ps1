# Run endpoint tests with auth token
param(
    [string]$Token = "demo-token-20251203105541"
)

$env:AUTH_TOKEN = $Token
Write-Host "Running tests with token: $Token" -ForegroundColor Cyan
npm run test:endpoints

