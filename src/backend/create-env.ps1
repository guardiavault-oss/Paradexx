# Create .env file from .env.example
Write-Host "Creating .env file..." -ForegroundColor Cyan

$envExample = "env.template"
$envFile = ".env"

if (-not (Test-Path $envExample)) {
    Write-Host "Error: .env.example not found!" -ForegroundColor Red
    exit 1
}

# Copy .env.example to .env if it doesn't exist
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Edit .env file and add your API keys!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required:" -ForegroundColor Cyan
    Write-Host "  - DATABASE_URL (PostgreSQL connection string)" -ForegroundColor White
    Write-Host "  - JWT_SECRET (Random 32-character string)" -ForegroundColor White
    Write-Host "  - JWT_REFRESH_SECRET (Random 32-character string)" -ForegroundColor White
    Write-Host "  - ONEINCH_API_KEY (Get from https://portal.1inch.dev/)" -ForegroundColor White
    Write-Host ""
    Write-Host "Optional but recommended:" -ForegroundColor Cyan
    Write-Host "  - ALCHEMY_API_KEY or INFURA_API_KEY" -ForegroundColor White
    Write-Host "  - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  .env file already exists. Skipping creation." -ForegroundColor Yellow
    Write-Host "   If you want to recreate it, delete .env first." -ForegroundColor Yellow
}

