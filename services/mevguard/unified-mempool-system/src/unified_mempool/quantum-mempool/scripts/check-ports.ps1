# Check which ports are currently in use
Write-Host "Checking port availability..." -ForegroundColor Yellow

$ports = @(3000, 3001, 3002, 3003, 8000, 8001, 8080, 8081)

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Port $port is IN USE by process ID: $($connection.OwningProcess)" -ForegroundColor Red
        $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Process Name: $($process.ProcessName)" -ForegroundColor Red
        }
    } else {
        Write-Host "Port $port is AVAILABLE" -ForegroundColor Green
    }
}

Write-Host "`nTo kill a process using a port, use: Stop-Process -Id <PID> -Force" -ForegroundColor Cyan
