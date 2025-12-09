# Ultimate Quantum Mempool Monitor - PowerShell Deployment Script
# Complete setup and deployment automation for Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "deploy",
    
    [Parameter(Position=1)]
    [string]$Service = "",
    
    [string]$ComposeFile = "docker-compose-ultimate.yml",
    [string]$EnvFile = ".env",
    [string]$LogLevel = "INFO"
)

# Colors for output
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "📊 $Message" -ForegroundColor Blue
}

# Header
Write-Host ""
Write-Info "🚀 Ultimate Quantum Mempool Monitor Deployment"
Write-Host "============================================================" -ForegroundColor Blue

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Status "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check if docker-compose is available
try {
    docker compose --version | Out-Null
    Write-Status "Docker Compose is available"
} catch {
    Write-Error "Docker Compose is not available."
    exit 1
}

# Function to wait for service to be ready
function Wait-ForService {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$Timeout = 60
    )
    
    Write-Host "⏳ Waiting for $ServiceName to be ready on port $Port..." -ForegroundColor Yellow
    for ($i = 1; $i -le $Timeout; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Status "$ServiceName is ready!"
                return $true
            }
        } catch {
            # Service not ready yet
        }
        Start-Sleep -Seconds 1
    }
    Write-Error "$ServiceName failed to start within $Timeout seconds"
    return $false
}

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$HealthUrl
    )
    
    Write-Host "🔍 Checking $ServiceName health..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 5
        if ($response.Content -match "healthy|ok|UP") {
            Write-Status "$ServiceName is healthy"
            return $true
        } else {
            Write-Warning "$ServiceName health check inconclusive"
            return $false
        }
    } catch {
        Write-Warning "$ServiceName health check failed: $($_.Exception.Message)"
        return $false
    }
}

# Create .env file if it doesn't exist
function New-EnvFile {
    if (-not (Test-Path $EnvFile)) {
        Write-Warning "Creating default .env file..."
        
        $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
        $jwtSecret = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
        
        $envContent = @"
# Ultimate Quantum Mempool Monitor Environment Configuration

# Database
POSTGRES_PASSWORD=quantum_secure_pass_$timestamp
REDIS_PASSWORD=redis_secure_pass_$timestamp

# Monitoring
GRAFANA_PASSWORD=grafana_admin_$timestamp
GRAFANA_SECRET_KEY=grafana_secret_$(New-Guid)

# Security
ELASTIC_PASSWORD=elastic_secure_pass_$timestamp

# Object Storage
MINIO_ROOT_USER=quantum_admin
MINIO_ROOT_PASSWORD=quantum_minio_$timestamp

# Application
QUANTUM_ENV=production
LOG_LEVEL=INFO
DEBUG=false

# Blockchain Configuration
ETHEREUM_RPC_URL=http://localhost:8545
BITCOIN_RPC_URL=http://localhost:8332
BITCOIN_RPC_USER=bitcoin_user
BITCOIN_RPC_PASSWORD=bitcoin_password

# JWT Configuration
JWT_SECRET=$jwtSecret
"@
        
        Set-Content -Path $EnvFile -Value $envContent
        Write-Status "Default environment file created: $EnvFile"
        Write-Warning "Please review and update the configuration in $EnvFile"
    }
}

# Deploy function
function Start-Deployment {
    Write-Status "Starting Ultimate Quantum Mempool Monitor deployment..."
    
    # Create .env file if needed
    New-EnvFile
    
    # Pull latest images
    Write-Info "📥 Pulling latest Docker images..."
    docker compose -f $ComposeFile pull
    
    # Build the application
    Write-Info "🏗️  Building application..."
    docker compose -f $ComposeFile build
    
    # Start infrastructure services first
    Write-Info "🗄️  Starting infrastructure services..."
    docker compose -f $ComposeFile up -d postgres redis elasticsearch
    
    # Wait for infrastructure to be ready
    $infrastructureReady = $true
    $infrastructureReady = $infrastructureReady -and (Wait-ForService "PostgreSQL" 5432)
    $infrastructureReady = $infrastructureReady -and (Wait-ForService "Redis" 6379)
    $infrastructureReady = $infrastructureReady -and (Wait-ForService "Elasticsearch" 9200)
    
    if (-not $infrastructureReady) {
        Write-Error "Infrastructure services failed to start properly"
        return
    }
    
    # Start monitoring services
    Write-Info "📊 Starting monitoring services..."
    docker compose -f $ComposeFile up -d prometheus grafana kibana
    
    # Wait for monitoring services
    Wait-ForService "Prometheus" 9091
    Wait-ForService "Grafana" 3000
    Wait-ForService "Kibana" 5601
    
    # Start the main application
    Write-Info "🎯 Starting Ultimate Quantum Mempool Monitor..."
    docker compose -f $ComposeFile up -d ultimate-quantum-monitor
    
    # Wait for main application
    Wait-ForService "Ultimate Quantum Monitor API" 8000
    Wait-ForService "WebSocket Server" 8765
    Wait-ForService "Dashboard" 8001
    
    # Start supporting services
    Write-Info "🔧 Starting supporting services..."
    docker compose -f $ComposeFile up -d nginx jaeger minio
    
    # Final health checks
    Write-Info "🏥 Performing health checks..."
    Start-Sleep -Seconds 10  # Allow services to stabilize
    
    Test-ServiceHealth "Ultimate Quantum Monitor" "http://localhost:8000/api/v1/health"
    Test-ServiceHealth "Grafana" "http://localhost:3000/api/health"
    Test-ServiceHealth "Kibana" "http://localhost:5601/api/status"
    
    Write-Status "Deployment completed successfully!"
    
    # Display service URLs
    Write-Host ""
    Write-Host "🎉 Ultimate Quantum Mempool Monitor is running!" -ForegroundColor Green
    Write-Host "==============================================================" -ForegroundColor Blue
    Write-Host "📊 Service URLs:" -ForegroundColor Blue
    Write-Host "  • Main Application API: http://localhost:8000"
    Write-Host "  • Interactive Dashboard: http://localhost:8001"
    Write-Host "  • WebSocket Feed: ws://localhost:8765"
    Write-Host "  • API Documentation: http://localhost:8000/docs"
    Write-Host "  • System Health: http://localhost:8000/api/v1/health"
    Write-Host ""
    Write-Host "📈 Monitoring & Analytics:" -ForegroundColor Blue
    Write-Host "  • Grafana Dashboards: http://localhost:3000"
    Write-Host "  • Prometheus Metrics: http://localhost:9091"
    Write-Host "  • Kibana Logs: http://localhost:5601"
    Write-Host "  • Jaeger Tracing: http://localhost:16686"
    Write-Host ""
    Write-Host "🛠️  Management:" -ForegroundColor Blue
    Write-Host "  • MinIO Object Storage: http://localhost:9001"
    Write-Host "  • Container Logs: docker compose -f $ComposeFile logs -f"
    Write-Host "  • System Status: docker compose -f $ComposeFile ps"
    Write-Host ""
    Write-Host "🔐 Default Credentials (change in production):" -ForegroundColor Yellow
    Write-Host "  • Check $EnvFile for all passwords"
    Write-Host "  • Grafana: admin / (see GRAFANA_PASSWORD in $EnvFile)"
    Write-Host "  • MinIO: (see MINIO_ROOT_USER/MINIO_ROOT_PASSWORD in $EnvFile)"
}

# Stop function
function Stop-Services {
    Write-Status "Stopping Ultimate Quantum Mempool Monitor..."
    docker compose -f $ComposeFile down
    Write-Status "All services stopped"
}

# Status function
function Show-Status {
    Write-Info "📊 Ultimate Quantum Mempool Monitor Status"
    Write-Host "=============================================="
    docker compose -f $ComposeFile ps
    
    Write-Host ""
    Write-Info "📈 Quick Health Check"
    Write-Host "======================"
    
    # Check main services
    $services = @(
        @{ Name = "Ultimate Quantum Monitor API"; Port = 8000; Path = "/api/v1/health" },
        @{ Name = "Dashboard"; Port = 8001; Path = "/" },
        @{ Name = "Grafana"; Port = 3000; Path = "/api/health" },
        @{ Name = "Prometheus"; Port = 9091; Path = "/-/healthy" },
        @{ Name = "Kibana"; Port = 5601; Path = "/api/status" }
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Status "$($service.Name) is running"
            } else {
                Write-Error "$($service.Name) is not responding"
            }
        } catch {
            Write-Error "$($service.Name) is not responding"
        }
    }
}

# Logs function
function Show-Logs {
    param([string]$ServiceName = "ultimate-quantum-monitor")
    
    Write-Info "📋 Showing logs for $ServiceName"
    docker compose -f $ComposeFile logs -f $ServiceName
}

# Cleanup function
function Remove-Everything {
    $response = Read-Host "This will remove all containers and volumes. Are you sure? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Status "Cleaning up all containers and volumes..."
        docker-compose -f $ComposeFile down -v --remove-orphans
        docker system prune -f
        Write-Status "Cleanup completed"
    } else {
        Write-Status "Cleanup cancelled"
    }
}

# Update function
function Update-Services {
    Write-Status "Updating Ultimate Quantum Mempool Monitor..."
    
    # Pull latest images
    docker-compose -f $ComposeFile pull
    
    # Rebuild and restart
    docker-compose -f $ComposeFile up -d --build
    
    Write-Status "Update completed"
}

# Main script logic
switch ($Command.ToLower()) {
    { $_ -in @("deploy", "start", "up") } {
        Start-Deployment
    }
    { $_ -in @("stop", "down") } {
        Stop-Services
    }
    "restart" {
        Stop-Services
        Start-Sleep -Seconds 5
        Start-Deployment
    }
    { $_ -in @("status", "ps") } {
        Show-Status
    }
    "logs" {
        Show-Logs -ServiceName $Service
    }
    { $_ -in @("cleanup", "clean") } {
        Remove-Everything
    }
    "update" {
        Update-Services
    }
    { $_ -in @("help", "-h", "--help") } {
        Write-Host "Ultimate Quantum Mempool Monitor Deployment Script"
        Write-Host ""
        Write-Host "Usage: .\deploy-ultimate.ps1 [COMMAND] [SERVICE]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  deploy, start, up    Deploy and start all services (default)"
        Write-Host "  stop, down           Stop all services"
        Write-Host "  restart              Restart all services"
        Write-Host "  status, ps           Show service status"
        Write-Host "  logs [service]       Show logs (optionally for specific service)"
        Write-Host "  update               Update and restart services"
        Write-Host "  cleanup, clean       Remove all containers and volumes"
        Write-Host "  help                 Show this help message"
        Write-Host ""
        Write-Host "Parameters:"
        Write-Host "  -ComposeFile         Docker compose file (default: docker-compose-ultimate.yml)"
        Write-Host "  -EnvFile             Environment file (default: .env)"
        Write-Host "  -LogLevel            Log level (default: INFO)"
    }
    default {
        Write-Error "Unknown command: $Command"
        Write-Host "Use '.\deploy-ultimate.ps1 help' for usage information"
        exit 1
    }
}
