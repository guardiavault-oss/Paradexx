# Build AAB using Java from Desktop

Write-Host "Building AAB with Desktop Java" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Find Java on Desktop
Write-Host "`nSearching for Java on Desktop..." -ForegroundColor Yellow

$desktopPath = "$env:USERPROFILE\Desktop"
$javaDirs = Get-ChildItem $desktopPath -Directory -ErrorAction SilentlyContinue | Where-Object {
    $binPath = Join-Path $_.FullName "bin\java.exe"
    Test-Path $binPath
}

if ($javaDirs) {
    Write-Host "Found Java installations:" -ForegroundColor Green
    $index = 1
    foreach ($javaDir in $javaDirs) {
        Write-Host "  $index. $($javaDir.FullName)" -ForegroundColor Cyan
        $index++
    }
    
    if ($javaDirs.Count -eq 1) {
        $javaPath = $javaDirs[0].FullName
        Write-Host "`nUsing: $javaPath" -ForegroundColor Green
    } else {
        Write-Host "`nMultiple Java installations found. Using the first one." -ForegroundColor Yellow
        $javaPath = $javaDirs[0].FullName
    }
} else {
    Write-Host "Java not found on Desktop!" -ForegroundColor Red
    Write-Host "Please provide the Java folder path:" -ForegroundColor Yellow
    $javaPath = Read-Host "Enter Java/JDK folder path (e.g., C:\Users\ADMIN\Desktop\jdk-21)"
    
    if (-not (Test-Path "$javaPath\bin\java.exe")) {
        Write-Host "ERROR: Java not found at $javaPath\bin\java.exe" -ForegroundColor Red
        exit 1
    }
}

# Set JAVA_HOME
Write-Host "`nSetting JAVA_HOME..." -ForegroundColor Yellow
$env:JAVA_HOME = $javaPath
$env:PATH = "$javaPath\bin;$env:PATH"

Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

# Verify Java
Write-Host "`nVerifying Java..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host $javaVersion -ForegroundColor Cyan

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Java verification failed!" -ForegroundColor Red
    exit 1
}

# Navigate to project
Push-Location "c:\Users\ADMIN\Desktop\paradexwallet\android"

# Clean build
Write-Host "`nCleaning previous build..." -ForegroundColor Yellow
.\gradlew clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Clean failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Build AAB
Write-Host "`nBuilding release AAB..." -ForegroundColor Yellow
Write-Host "Package name: com.paradex.wallet" -ForegroundColor Green
Write-Host "This may take several minutes..." -ForegroundColor Gray

.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Verify AAB
$aabPath = "c:\Users\ADMIN\Desktop\paradexwallet\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $file = Get-Item $aabPath
    Write-Host "`nSUCCESS: AAB built successfully!" -ForegroundColor Green
    Write-Host "Location: $($file.FullName)" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Package: com.paradex.wallet" -ForegroundColor Green
    Write-Host "Last Modified: $($file.LastWriteTime)" -ForegroundColor Gray
    
    Write-Host "`nReady to upload to Google Play Store!" -ForegroundColor Green
} else {
    Write-Host "`nERROR: AAB file not found!" -ForegroundColor Red
    exit 1
}
