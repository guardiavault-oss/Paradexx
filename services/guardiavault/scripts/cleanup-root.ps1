# Cleanup Root Directory
# Moves miscellaneous files to appropriate locations

Write-Host "Cleaning up root directory..." -ForegroundColor Cyan

# Move SQL migration files to migrations/ if they're in root
Get-ChildItem -Path . -Filter "*.sql" -File | Where-Object {
    $_.DirectoryName -eq (Resolve-Path .).Path
} | ForEach-Object {
    $target = Join-Path "migrations" $_.Name
    if (-not (Test-Path $target)) {
        Move-Item -Path $_.FullName -Destination $target -Force
        Write-Host "Moved $($_.Name) to migrations/" -ForegroundColor Green
    }
}

# Move PowerShell scripts to scripts/ if they're in root (except organize-docs.ps1)
Get-ChildItem -Path . -Filter "*.ps1" -File | Where-Object {
    $_.DirectoryName -eq (Resolve-Path .).Path -and
    $_.Name -ne "organize-docs.ps1"
} | ForEach-Object {
    $target = Join-Path "scripts" $_.Name
    if (-not (Test-Path $target)) {
        Move-Item -Path $_.FullName -Destination $target -Force
        Write-Host "Moved $($_.Name) to scripts/" -ForegroundColor Green
    }
}

# Move Shell scripts to scripts/
Get-ChildItem -Path . -Filter "*.sh" -File | Where-Object {
    $_.DirectoryName -eq (Resolve-Path .).Path
} | ForEach-Object {
    $target = Join-Path "scripts" $_.Name
    if (-not (Test-Path $target)) {
        Move-Item -Path $_.FullName -Destination $target -Force
        Write-Host "Moved $($_.Name) to scripts/" -ForegroundColor Green
    }
}

# Clean up duplicate/backup files
Get-ChildItem -Path . -File | Where-Object {
    $_.Name -like "*.bak" -or
    $_.Name -like "*.backup" -or
    $_.Name -like "*~"
} | Remove-Item -Force
Write-Host "Removed backup files" -ForegroundColor Yellow

Write-Host "`nRoot directory cleanup complete!" -ForegroundColor Cyan

