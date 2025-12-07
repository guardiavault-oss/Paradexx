# Script to properly start the quantum monitor container

Write-Host "Starting Quantum Monitor Container..." -ForegroundColor Green

# Stop and remove any existing container
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker stop quantum-monitor 2>$null
docker rm quantum-monitor 2>$null

# Build the image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -f Dockerfile.ultimate -t ultimate-quantum-monitor:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Check if docker-compose.yml exists
if (Test-Path "docker-compose.yml") {
    Write-Host "Starting container using docker-compose..." -ForegroundColor Green
    docker compose up -d
} else {
    # Try different port combinations if compose file doesn't exist
    Write-Host "Starting container with available ports..." -ForegroundColor Green
    
    # Try different port combinations
    $portConfigs = @(
        "-p 8001:8000 -p 8081:8080 -p 3003:3000",
        "-p 8002:8000 -p 8082:8080 -p 3004:3000",
        "-p 9000:8000 -p 9080:8080 -p 4000:3000"
    )
    
    foreach ($config in $portConfigs) {
        Write-Host "Trying ports: $config" -ForegroundColor Yellow
        $cmd = "docker run -d $config --name quantum-monitor ultimate-quantum-monitor:latest"
        Invoke-Expression $cmd
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Container started successfully!" -ForegroundColor Green
            break
        } else {
            Write-Host "Failed with these ports, trying next combination..." -ForegroundColor Yellow
            docker rm -f quantum-monitor 2>$null
        }
    }
}

# Check container status
Start-Sleep -Seconds 2
$container = docker ps --filter "name=quantum-monitor" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "`nContainer Status:" -ForegroundColor Cyan
Write-Host $container

# Show logs
Write-Host "`nContainer Logs (last 20 lines):" -ForegroundColor Cyan
docker logs --tail 20 quantum-monitor
