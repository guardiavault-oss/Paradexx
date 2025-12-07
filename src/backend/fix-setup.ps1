# Fix Setup Script
Write-Host "Fixing setup issues..." -ForegroundColor Cyan

Set-Location $PSScriptRoot

# 1. Generate Prisma Client
Write-Host "`n1. Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ❌ Prisma generation failed" -ForegroundColor Red
    exit 1
}

# 2. Check .env file for ONEINCH_API_KEY
Write-Host "`n2. Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    if ($envContent -match 'ONEINCH_API_KEY\s*=\s*([^\s]+)') {
        $apiKey = $matches[1]
        if ($apiKey -eq 'your-1inch-api-key-here' -or $apiKey -eq 'your-1inch-api-key') {
            Write-Host "   ⚠️  ONEINCH_API_KEY is still set to placeholder!" -ForegroundColor Yellow
            Write-Host "   Please update .env file with your actual API key: YOUR_1INCH_API_KEY_HERE" -ForegroundColor Yellow
        } else {
            Write-Host "   ✅ ONEINCH_API_KEY is set: $($apiKey.Substring(0, [Math]::Min(20, $apiKey.Length)))..." -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️  ONEINCH_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Run: Copy-Item env.template .env" -ForegroundColor Yellow
    exit 1
}

# 3. Verify DATABASE_URL
Write-Host "`n3. Checking DATABASE_URL..." -ForegroundColor Yellow
if ($envContent -match 'DATABASE_URL\s*=\s*([^\s]+)') {
    $dbUrl = $matches[1]
    if ($dbUrl -match 'your_password|changeme|password') {
        Write-Host "   ⚠️  DATABASE_URL contains placeholder password!" -ForegroundColor Yellow
        Write-Host "   Please update with your actual PostgreSQL password" -ForegroundColor Yellow
    } else {
        Write-Host "   ✅ DATABASE_URL is set" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ DATABASE_URL not found" -ForegroundColor Red
}

Write-Host "`n✅ Setup check complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make sure .env has ONEINCH_API_KEY=YOUR_1INCH_API_KEY_HERE" -ForegroundColor White
Write-Host "2. Update DATABASE_URL with your PostgreSQL password" -ForegroundColor White
Write-Host "3. Run: npm run test:api" -ForegroundColor White

