# Start Backend Services
Write-Host "🚀 Starting Backend Services..." -ForegroundColor Yellow

# Start main FastAPI server
Write-Host "Starting main API server on port 8000..." -ForegroundColor Cyan
$mainApi = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.api.main_comprehensive:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru -NoNewWindow

Write-Host "✅ Main API server started (PID: $($mainApi.Id))" -ForegroundColor Green
Write-Host "   URL: http://localhost:8000" -ForegroundColor Gray

# Wait for server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check health
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
    Write-Host "   Services available:" -ForegroundColor Gray
    $healthCheck.services.PSObject.Properties | ForEach-Object {
        $status = if ($_.Value) { "✅" } else { "❌" }
        Write-Host "   $status $($_.Name)" -ForegroundColor $(if ($_.Value) { "Green" } else { "Red" })
    }
} catch {
    Write-Host "⚠️  Server may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend services are running!" -ForegroundColor Green
Write-Host "To stop: Stop-Process -Id $($mainApi.Id)" -ForegroundColor Gray

# Return process ID for later use
return $mainApi.Id

