# ===========================================
# DEGENX DOCKER STARTUP SCRIPT (PowerShell)
# ===========================================

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Cyan "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Info "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Info "docker-compose is available"
} catch {
    Write-Error "docker-compose is not installed. Please install it first."
    exit 1
}

Write-Info "Starting DegenX development environment..."

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Warning ".env file not found. Creating from template..."
    Copy-Item .env.production .env
    Write-Warning "Please edit .env file with your API keys before running the application."
}

# Create necessary directories
New-Item -ItemType Directory -Force -Path logs | Out-Null
New-Item -ItemType Directory -Force -Path data/postgres | Out-Null
New-Item -ItemType Directory -Force -Path data/redis | Out-Null

# Stop any existing containers
Write-Info "Stopping existing containers..."
try {
    docker-compose down --remove-orphans | Out-Null
} catch {
    # Ignore errors if containers don't exist
}

# Build and start services
Write-Info "Building Docker images..."
docker-compose build --no-cache

Write-Info "Starting services..."
docker-compose up -d

# Wait for services to be ready
Write-Info "Waiting for services to be ready..."
Start-Sleep -Seconds 15

# Check service health
Write-Info "Checking service health..."

# Check PostgreSQL
try {
    $result = docker-compose exec -T postgres pg_isready -U degenx_user -d degenx
    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL is ready"
    } else {
        Write-Error "PostgreSQL is not ready"
    }
} catch {
    Write-Warning "PostgreSQL is still starting..."
}

# Check Redis
try {
    $result = docker-compose exec -T redis redis-cli ping
    if ($result -eq "PONG") {
        Write-Success "Redis is ready"
    } else {
        Write-Error "Redis is not ready"
    }
} catch {
    Write-Warning "Redis is still starting..."
}

# Check Backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "Backend API is ready"
    } else {
        Write-Warning "Backend API is still starting..."
    }
} catch {
    Write-Warning "Backend API is still starting..."
}

# Check Frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "Frontend is ready"
    } else {
        Write-Warning "Frontend is still starting..."
    }
} catch {
    Write-Warning "Frontend is still starting..."
}

# ===========================================
# DISPLAY ACCESS INFORMATION
# ===========================================

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "    DEGENX DEVELOPMENT ENVIRONMENT     " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 Frontend Application:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔧 Backend API:" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:3001" -ForegroundColor Yellow
Write-Host "   Health: http://localhost:3001/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "🗄️  Database Admin (pgAdmin):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:5050" -ForegroundColor Yellow
Write-Host "   Email: admin@degenx.com" -ForegroundColor Yellow
Write-Host "   Password: degenx_admin_2024" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔴 Redis Admin (Redis Commander):" -ForegroundColor Cyan
Write-Host "   URL: http://localhost:8081" -ForegroundColor Yellow
Write-Host ""

Write-Host "📊 Database Connection:" -ForegroundColor Cyan
Write-Host "   Host: localhost:5432" -ForegroundColor Yellow
Write-Host "   Database: degenx" -ForegroundColor Yellow
Write-Host "   User: degenx_user" -ForegroundColor Yellow
Write-Host "   Password: degenx_secure_password_2024" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔑 Sample Admin User:" -ForegroundColor Cyan
Write-Host "   Email: admin@degenx.com" -ForegroundColor Yellow
Write-Host "   Password: admin123" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "   Stop services: docker-compose down" -ForegroundColor Yellow
Write-Host "   Restart services: docker-compose restart" -ForegroundColor Yellow
Write-Host "   Access backend shell: docker-compose exec backend sh" -ForegroundColor Yellow
Write-Host "   Access database: docker-compose exec postgres psql -U degenx_user -d degenx" -ForegroundColor Yellow
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host "     🚀 DegenX is ready to use! 🚀      " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Show logs for a few seconds
Write-Info "Showing recent logs (will auto-stop after 15 seconds)..."
try {
    Start-Process -FilePath "docker-compose" -ArgumentList "logs", "-f", "--tail=20" -Wait -TimeoutSec 15
} catch {
    # Timeout is expected
}

Write-Success "DegenX Docker environment setup complete!"
