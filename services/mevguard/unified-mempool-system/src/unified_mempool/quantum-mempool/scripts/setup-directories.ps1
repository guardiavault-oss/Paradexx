# Setup required directories for quantum mempool monitor

Write-Host "Setting up directory structure..." -ForegroundColor Green

# Create main directories
$directories = @(
    "data/postgres",
    "data/redis", 
    "data/prometheus",
    "data/grafana",
    "data/elasticsearch",
    "logs",
    "backups",
    "database/init",
    "config",
    "monitoring/prometheus/rules",
    "monitoring/grafana/provisioning/datasources",
    "monitoring/grafana/provisioning/dashboards",
    "monitoring/grafana/dashboards",
    "infrastructure/nginx/ssl",
    "security/reports"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Yellow
    } else {
        Write-Host "Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host "`nDirectory structure created successfully!" -ForegroundColor Green
