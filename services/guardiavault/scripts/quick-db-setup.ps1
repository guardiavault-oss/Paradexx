# Quick Database Setup - Start PostgreSQL with Docker
Write-Host "🚀 Starting GuardiaVault Database..." -ForegroundColor Cyan

# Check Docker
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker Desktop is not running!" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop and run this script again" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker is not installed or not running!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker is running" -ForegroundColor Green

# Start PostgreSQL container
Write-Host "🐳 Starting PostgreSQL container..." -ForegroundColor Cyan
docker-compose up -d postgres

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database container started" -ForegroundColor Green
    
    # Wait for database to be ready
    Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        $test = docker exec guardiavault-db pg_isready -U guardiavault 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database is ready!" -ForegroundColor Green
            break
        }
        Write-Host "   Still waiting... ($waited/$maxWait seconds)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "📝 Next: Run migrations with: npm run db:migrate" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to start database container" -ForegroundColor Red
    exit 1
}

