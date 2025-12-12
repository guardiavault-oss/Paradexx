# Quick Build AAB Script
# Uses Java from Desktop

$env:JAVA_HOME = "C:\Users\ADMIN\Desktop\jdk-21.0.5+11"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Building AAB with package: com.paradex.wallet" -ForegroundColor Cyan
Write-Host "Java: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "This will take 3-5 minutes..." -ForegroundColor Yellow

cd android
.\gradlew bundleRelease

if ($LASTEXITCODE -eq 0) {
    $aabPath = "app\build\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        $file = Get-Item $aabPath
        Write-Host "`nSUCCESS!" -ForegroundColor Green
        Write-Host "Location: $($file.FullName)" -ForegroundColor Cyan
        Write-Host "Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Cyan
        Write-Host "Package: com.paradex.wallet" -ForegroundColor Green
    }
} else {
    Write-Host "`nBuild failed. Check errors above." -ForegroundColor Red
}
