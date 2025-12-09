# Run Database Migration via API
# Usage: .\run-migration.ps1 -Token "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$Url = "https://guardiavault-production.up.railway.app/api/admin/migrate"
)

Write-Host "🚀 Triggering database migration..." -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Method Post -Uri $Url `
        -Headers @{"X-Migration-Token"=$Token} `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 10
    
    if ($response.success) {
        Write-Host ""
        Write-Host "📋 Migration Output:" -ForegroundColor Cyan
        Write-Host $response.output -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Yellow
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

