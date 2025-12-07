# Backend Setup Script
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location $PSScriptRoot

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "Running npm install..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Dependencies installed successfully!" -ForegroundColor Green
    
    # Check if tsx is available
    Write-Host "`nVerifying installation..." -ForegroundColor Cyan
    if (Test-Path "node_modules\.bin\tsx.cmd") {
        Write-Host "✅ tsx is installed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  tsx not found, trying to install..." -ForegroundColor Yellow
        npm install tsx --save-dev
    }
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Create .env file with your API keys" -ForegroundColor White
    Write-Host "2. Run: npx prisma generate" -ForegroundColor White
    Write-Host "3. Run: npx prisma migrate dev" -ForegroundColor White
    Write-Host "4. Run: npm run test:api" -ForegroundColor White
} else {
    Write-Host "`n❌ Installation failed. Check the errors above." -ForegroundColor Red
    exit 1
}

