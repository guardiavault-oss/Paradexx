# Fix Port 5000 Already in Use
# This script finds and kills processes using port 5000

Write-Host "Checking for processes on port 5000..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

if ($connections) {
    Write-Host "Found processes using port 5000:" -ForegroundColor Red
    $connections | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  PID: $($_.OwningProcess) - $($process.ProcessName) - Started: $($process.StartTime)" -ForegroundColor Red
        }
    }
    
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    Write-Host "`nKilling processes..." -ForegroundColor Yellow
    
    foreach ($pid in $pids) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Write-Host "  ✅ Killed process $pid" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Failed to kill process $pid : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n✅ Port 5000 should now be free!" -ForegroundColor Green
    Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "✅ Port 5000 is free - no processes found" -ForegroundColor Green
}

