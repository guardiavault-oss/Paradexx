# Final AAB Build Script
# Uses Java from Desktop and Gradle wrapper

Write-Host "Building AAB with Package: com.paradex.wallet" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Set Java
$env:JAVA_HOME = "C:\Users\ADMIN\Desktop\jdk-21.0.5+11"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "`nJava Configuration:" -ForegroundColor Yellow
Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host "  Java: $javaVersion" -ForegroundColor Gray

# Navigate to android directory
Push-Location "c:\Users\ADMIN\Desktop\paradexwallet\android"

Write-Host "`nGradle Configuration:" -ForegroundColor Yellow
.\gradlew --version 2>&1 | Select-Object -First 5

Write-Host "`nCleaning previous build..." -ForegroundColor Yellow
.\gradlew clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Clean failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "`nBuilding Release AAB..." -ForegroundColor Yellow
Write-Host "Package name: com.paradex.wallet" -ForegroundColor Green
Write-Host "This will take 3-5 minutes..." -ForegroundColor Gray
Write-Host ""

.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location

# Verify AAB
$aabPath = "c:\Users\ADMIN\Desktop\paradexwallet\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $file = Get-Item $aabPath
    $fileAge = (Get-Date) - $file.LastWriteTime
    
    Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
    Write-Host "SUCCESS: AAB Built Successfully!" -ForegroundColor Green
    Write-Host "=" * 80 -ForegroundColor Cyan
    
    Write-Host "`nFile Details:" -ForegroundColor Yellow
    Write-Host "  Location: $($file.FullName)" -ForegroundColor White
    Write-Host "  Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor White
    Write-Host "  Package: com.paradex.wallet" -ForegroundColor Green
    Write-Host "  Modified: $($file.LastWriteTime)" -ForegroundColor White
    Write-Host "  Age: $($fileAge.Minutes) minutes ago" -ForegroundColor Gray
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to https://play.google.com/console" -ForegroundColor White
    Write-Host "  2. Create NEW app with package: com.paradex.wallet" -ForegroundColor White
    Write-Host "  3. Upload AAB file" -ForegroundColor White
    Write-Host "  4. Complete store listing" -ForegroundColor White
    Write-Host "  5. Submit for review" -ForegroundColor White
    
    Write-Host "`nAAB File Ready for Upload!" -ForegroundColor Green
} else {
    Write-Host "`nERROR: AAB file not found!" -ForegroundColor Red
    Write-Host "Build may have failed. Check errors above." -ForegroundColor Yellow
    exit 1
}
