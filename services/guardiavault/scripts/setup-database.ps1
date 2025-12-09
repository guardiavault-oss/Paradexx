# Setup Database Script
# This script sets up PostgreSQL and initializes the schema

Write-Host "🔵 Setting up GuardiaVault Database..." -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL container exists and is running
$containerStatus = docker ps -a --filter "name=guardiavault-db" --format "{{.Status}}" 2>&1

if ($containerStatus -match "Up") {
    Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
} elseif ($containerStatus -match "Exited") {
    Write-Host "⚠️  PostgreSQL container exists but is stopped. Starting..." -ForegroundColor Yellow
    docker start guardiavault-db
    Start-Sleep -Seconds 5
} else {
    Write-Host "🔵 Starting PostgreSQL container..." -ForegroundColor Cyan
    docker-compose up -d postgres
    Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Wait for PostgreSQL to be healthy
Write-Host "⏳ Waiting for PostgreSQL to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $health = docker inspect --format='{{.State.Health.Status}}' guardiavault-db 2>&1
    if ($health -eq "healthy") {
        Write-Host "✅ PostgreSQL is healthy" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 1
    $attempt++
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ PostgreSQL did not become healthy in time" -ForegroundColor Red
        exit 1
    }
} while ($true)

# Initialize database schema
Write-Host ""
Write-Host "🔵 Initializing database schema..." -ForegroundColor Cyan
Write-Host "⚠️  If prompted, type 'Yes' to confirm schema changes" -ForegroundColor Yellow
Write-Host ""

# Run db:push with automatic confirmation
$env:DATABASE_URL = "postgresql://guardiavault:changeme@localhost:5432/guardiavault"
echo "Yes" | pnpm run db:push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database schema initialized successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔵 Verifying database connection..." -ForegroundColor Cyan
    
    # Test the connection
    $response = Invoke-RestMethod -Uri "http://localhost:5000/ready" -ErrorAction SilentlyContinue
    if ($response.checks.database -eq $true) {
        Write-Host "✅ Database is connected and ready!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database container is running but app may need to reconnect" -ForegroundColor Yellow
        Write-Host "   Try restarting your development server: pnpm run dev" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "❌ Failed to initialize database schema" -ForegroundColor Red
    Write-Host "   Check the error messages above for details" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If your server is running, restart it to reconnect to the database" -ForegroundColor White
Write-Host "2. Try registering/logging in at http://localhost:5000" -ForegroundColor White

