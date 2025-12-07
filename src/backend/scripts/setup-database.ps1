# Quick Database Setup Script
Write-Host "Setting up PostgreSQL database..." -ForegroundColor Cyan

# Check if Docker is available
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "`n🐳 Docker detected - Starting PostgreSQL container..." -ForegroundColor Yellow
    
    # Check if container already exists
    $existing = docker ps -a --filter "name=regenx-postgres" --format "{{.Names}}"
    
    if ($existing -eq "regenx-postgres") {
        Write-Host "   Container exists, starting it..." -ForegroundColor Yellow
        docker start regenx-postgres
    } else {
        Write-Host "   Creating new PostgreSQL container..." -ForegroundColor Yellow
        docker run -d `
            --name regenx-postgres `
            -e POSTGRES_PASSWORD=regenx123 `
            -e POSTGRES_DB=regenx `
            -p 5432:5432 `
            postgres:15
        
        Write-Host "   Waiting for PostgreSQL to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    Write-Host "`n✅ PostgreSQL container started!" -ForegroundColor Green
    Write-Host "   Connection string:" -ForegroundColor Cyan
    Write-Host "   DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx" -ForegroundColor White
    
    Write-Host "`n📝 Update your .env file with:" -ForegroundColor Yellow
    Write-Host "   DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx" -ForegroundColor White
    
} else {
    Write-Host "`n⚠️  Docker not found" -ForegroundColor Yellow
    Write-Host "`nAlternative options:" -ForegroundColor Cyan
    Write-Host "   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "   2. Install PostgreSQL locally: https://www.postgresql.org/download/" -ForegroundColor White
    Write-Host "   3. Use Railway/Supabase database URL" -ForegroundColor White
    Write-Host "`nFor Railway:" -ForegroundColor Cyan
    Write-Host "   - Add PostgreSQL service in Railway" -ForegroundColor White
    Write-Host "   - Copy DATABASE_URL from Railway dashboard" -ForegroundColor White
    Write-Host "   - Update .env file" -ForegroundColor White
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "   1. Update DATABASE_URL in .env" -ForegroundColor White
Write-Host "   2. Run: npx prisma migrate dev" -ForegroundColor White
Write-Host "   3. Run: npm run test:vault:complete" -ForegroundColor White

