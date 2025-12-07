#!/usr/bin/env pwsh

# Ultimate Unified Scanner System Deployment Script
# Integrates Quantum Scanner, AI Orchestrator, Slither, Mythril, and Manticore

param(
    [switch]$FullDeploy,
    [switch]$QuickStart,
    [switch]$Status,
    [switch]$Stop,
    [switch]$Restart,
    [switch]$Logs,
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

# Colors for output
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Show-Banner {
    Write-ColorOutput @"
${Blue}
██╗   ██╗██╗  ████████╗██╗███╗   ███╗ █████╗ ████████╗███████╗
██║   ██║██║  ╚══██╔══╝██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║   ██║██║     ██║   ██║██╔████╔██║███████║   ██║   █████╗  
██║   ██║██║     ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  
╚██████╔╝███████╗██║   ██║██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
                                                                
        VULNERABILITY SCANNER SYSTEM v2.0
        Enterprise-Grade Quantum + AI Security
${Reset}
"@
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." $Blue
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-ColorOutput "✅ Docker: $dockerVersion" $Green
    }
    catch {
        Write-ColorOutput "❌ Docker is not installed or not running" $Red
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker compose --version
        Write-ColorOutput "✅ Docker Compose: $composeVersion" $Green
    }
    catch {
        Write-ColorOutput "❌ Docker Compose is not installed" $Red
        exit 1
    }
    
    # Check if .env file exists
    if (-not (Test-Path ".env.scanner")) {
        if (Test-Path ".env.scanner.example") {
            Write-ColorOutput "⚠️  Creating .env.scanner from example file..." $Yellow
            Copy-Item ".env.scanner.example" ".env.scanner"
            Write-ColorOutput "⚠️  Please edit .env.scanner with your actual configuration values" $Yellow
        }
        else {
            Write-ColorOutput "❌ .env.scanner file not found" $Red
            exit 1
        }
    }
    else {
        Write-ColorOutput "✅ Configuration file found" $Green
    }
}

function Initialize-Directories {
    Write-ColorOutput "📁 Creating necessary directories..." $Blue
    
    $directories = @(
        "logs",
        "data/scanner",
        "monitoring/scanner-grafana/provisioning/dashboards",
        "monitoring/scanner-grafana/provisioning/datasources",
        "monitoring/scanner-grafana/dashboards"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-ColorOutput "✅ Created directory: $dir" $Green
        }
    }
}

function Setup-Grafana-Provisioning {
    Write-ColorOutput "📊 Setting up Grafana provisioning..." $Blue
    
    # Create datasource configuration
    $datasourceConfig = @"
apiVersion: 1

datasources:
  - name: Scanner Prometheus
    type: prometheus
    access: proxy
    url: http://scanner-prometheus:9090
    isDefault: true
    editable: true
"@
    
    $datasourceConfig | Out-File -FilePath "monitoring/scanner-grafana/provisioning/datasources/prometheus.yml" -Encoding UTF8
    
    # Create dashboard provisioning
    $dashboardConfig = @"
apiVersion: 1

providers:
  - name: 'scanner-dashboards'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
"@
    
    $dashboardConfig | Out-File -FilePath "monitoring/scanner-grafana/provisioning/dashboards/dashboards.yml" -Encoding UTF8
    
    Write-ColorOutput "✅ Grafana provisioning configured" $Green
}

function Build-Images {
    Write-ColorOutput "🏗️  Building Docker images..." $Blue
    
    # Check if all required images exist
    $requiredImages = @(
        "scorpius-enterprise-scanner-ai-orchestrator:latest",
        "quantumscanner-quantum-scanner:latest",
        "scorpius-enterprise-scanner-slither:latest",
        "scorpius-enterprise-scanner-mythril:latest",
        "scorpius-enterprise-scanner-manticore:latest",
        "scorpius-enterprise-frontend:latest"
    )
    
    $missingImages = @()
    foreach ($image in $requiredImages) {
        try {
            docker image inspect $image | Out-Null
            Write-ColorOutput "✅ Image found: $image" $Green
        }
        catch {
            Write-ColorOutput "⚠️  Image missing: $image" $Yellow
            $missingImages += $image
        }
    }
    
    if ($missingImages.Count -gt 0) {
        Write-ColorOutput "⚠️  Some required images are missing. Please build them first." $Yellow
        Write-ColorOutput "Missing images:" $Yellow
        $missingImages | ForEach-Object { Write-ColorOutput "  - $_" $Yellow }
    }
}

function Deploy-Scanner-System {
    Write-ColorOutput "🚀 Deploying Ultimate Scanner System..." $Blue
    
    try {
        # Load environment variables
        if (Test-Path ".env.scanner") {
            Write-ColorOutput "📝 Loading environment variables..." $Blue
            Get-Content ".env.scanner" | ForEach-Object {
                if ($_ -match "^([^#][^=]+)=(.*)$") {
                    [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
                }
            }
        }
        
        # Deploy the scanner system
        docker compose -f docker-compose-ultimate-scanner.yml --env-file .env.scanner up -d
        
        Write-ColorOutput "✅ Scanner system deployment initiated" $Green
        
        # Wait for services to be healthy
        Write-ColorOutput "⏳ Waiting for services to become healthy..." $Blue
        Start-Sleep -Seconds 30
        
        # Check service health
        Show-ServiceStatus
        
    }
    catch {
        Write-ColorOutput "❌ Deployment failed: $($_.Exception.Message)" $Red
        exit 1
    }
}

function Show-ServiceStatus {
    Write-ColorOutput "📊 Scanner System Status:" $Blue
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $Blue
    
    $containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "ultimate-.*scanner" -or $_ -match "scanner-" }
    
    if ($containers) {
        $containers | ForEach-Object {
            if ($_ -match "healthy|Up") {
                Write-ColorOutput $_ $Green
            }
            elseif ($_ -match "unhealthy|Restarting") {
                Write-ColorOutput $_ $Red
            }
            else {
                Write-ColorOutput $_ $Yellow
            }
        }
    }
    else {
        Write-ColorOutput "No scanner containers found" $Yellow
    }
    
    Write-ColorOutput "" $Reset
    Write-ColorOutput "🌐 Access URLs:" $Blue
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $Blue
    Write-ColorOutput "📊 Scanner Dashboard:     http://localhost:82" $Green
    Write-ColorOutput "🎛️  Orchestrator API:     http://localhost:8900" $Green
    Write-ColorOutput "⚡ Quantum Scanner:       http://localhost:8910" $Green
    Write-ColorOutput "🔍 Slither Scanner:       http://localhost:8911" $Green
    Write-ColorOutput "🧙 Mythril Scanner:       http://localhost:8912" $Green
    Write-ColorOutput "🐍 Manticore Scanner:     http://localhost:8913" $Green
    Write-ColorOutput "📈 Grafana Monitoring:    http://localhost:3003" $Green
    Write-ColorOutput "📊 Prometheus Metrics:    http://localhost:9097" $Green
    Write-ColorOutput "📚 API Documentation:     http://localhost:82/docs" $Green
    Write-ColorOutput "" $Reset
}

function Show-Logs {
    param([string]$ServiceName = "")
    
    if ($ServiceName) {
        Write-ColorOutput "📝 Showing logs for $ServiceName..." $Blue
        docker compose -f docker-compose-ultimate-scanner.yml logs -f $ServiceName
    }
    else {
        Write-ColorOutput "📝 Showing all scanner system logs..." $Blue
        docker compose -f docker-compose-ultimate-scanner.yml logs -f
    }
}

function Stop-Scanner-System {
    Write-ColorOutput "🛑 Stopping Ultimate Scanner System..." $Blue
    docker compose -f docker-compose-ultimate-scanner.yml down
    Write-ColorOutput "✅ Scanner system stopped" $Green
}

function Restart-Scanner-System {
    Write-ColorOutput "🔄 Restarting Ultimate Scanner System..." $Blue
    docker compose -f docker-compose-ultimate-scanner.yml restart
    Write-ColorOutput "✅ Scanner system restarted" $Green
    Start-Sleep -Seconds 10
    Show-ServiceStatus
}

# Main execution logic
Show-Banner

if ($Status) {
    Show-ServiceStatus
    exit 0
}

if ($Stop) {
    Stop-Scanner-System
    exit 0
}

if ($Restart) {
    Restart-Scanner-System
    exit 0
}

if ($Logs) {
    Show-Logs -ServiceName $Service
    exit 0
}

if ($QuickStart) {
    Write-ColorOutput "⚡ Quick Start Mode - Basic health check and start" $Blue
    Test-Prerequisites
    Deploy-Scanner-System
    exit 0
}

# Full deployment process
Write-ColorOutput "🚀 Starting Full Ultimate Scanner System Deployment..." $Blue

Test-Prerequisites
Initialize-Directories
Setup-Grafana-Provisioning
Build-Images
Deploy-Scanner-System

Write-ColorOutput "" $Reset
Write-ColorOutput "${Green}🎉 Ultimate Scanner System Deployment Complete!${Reset}" $Green
Write-ColorOutput "" $Reset
Write-ColorOutput "Next steps:" $Blue
Write-ColorOutput "1. Access the dashboard at http://localhost:82" $Blue
Write-ColorOutput "2. Configure your API keys in .env.scanner" $Blue
Write-ColorOutput "3. Run your first vulnerability scan" $Blue
Write-ColorOutput "" $Reset
Write-ColorOutput "For help: .\deploy-ultimate-scanner.ps1 -?" $Blue
