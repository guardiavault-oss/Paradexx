# Setup Java and Build AAB
# This script helps find Java and build the AAB

Write-Host "Setting up Java and Building AAB" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Find Java installation
Write-Host "`nSearching for Java installation..." -ForegroundColor Yellow

$javaPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Eclipse Foundation",
    "$env:LOCALAPPDATA\Programs\Eclipse Adoptium",
    "$env:ProgramFiles\Java",
    "$env:ProgramFiles(x86)\Java"
)

$foundJava = $null

foreach ($basePath in $javaPaths) {
    if (Test-Path $basePath) {
        Write-Host "Checking: $basePath" -ForegroundColor Gray
        $jdkDirs = Get-ChildItem $basePath -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "jdk|java" }
        foreach ($jdkDir in $jdkDirs) {
            $javaExe = Join-Path $jdkDir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                $foundJava = $jdkDir.FullName
                Write-Host "Found Java: $foundJava" -ForegroundColor Green
                break
            }
        }
        if ($foundJava) { break }
    }
}

# Also check if java is in PATH
if (-not $foundJava) {
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $javaExePath = $javaCmd.Path
        $foundJava = Split-Path (Split-Path $javaExePath)
        Write-Host "Found Java in PATH: $foundJava" -ForegroundColor Green
    }
}

if (-not $foundJava) {
    Write-Host "`nJava not found automatically!" -ForegroundColor Red
    Write-Host "Please provide the Java installation path:" -ForegroundColor Yellow
    Write-Host "Example: C:\Program Files\Java\jdk-21" -ForegroundColor Gray
    $foundJava = Read-Host "Enter Java/JDK path"
    
    if (-not (Test-Path "$foundJava\bin\java.exe")) {
        Write-Host "ERROR: Java not found at that path!" -ForegroundColor Red
        exit 1
    }
}

# Set JAVA_HOME
Write-Host "`nSetting JAVA_HOME..." -ForegroundColor Yellow
$env:JAVA_HOME = $foundJava
$env:PATH = "$foundJava\bin;$env:PATH"

Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

# Verify Java
Write-Host "`nVerifying Java installation..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host $javaVersion -ForegroundColor Cyan

# Build AAB
Write-Host "`nBuilding AAB..." -ForegroundColor Yellow
Write-Host "Package name: com.paradex.wallet" -ForegroundColor Green

Push-Location android

Write-Host "`nCleaning previous build..." -ForegroundColor Yellow
.\gradlew clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Clean failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "`nBuilding release AAB..." -ForegroundColor Yellow
Write-Host "This may take several minutes..." -ForegroundColor Gray

.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Verify AAB
$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $file = Get-Item $aabPath
    Write-Host "`nSUCCESS: AAB built successfully!" -ForegroundColor Green
    Write-Host "Location: $($file.FullName)" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Package: com.paradex.wallet" -ForegroundColor Green
    Write-Host "Last Modified: $($file.LastWriteTime)" -ForegroundColor Gray
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://play.google.com/console" -ForegroundColor White
    Write-Host "   2. Create NEW app with package: com.paradex.wallet" -ForegroundColor White
    Write-Host "   3. Upload AAB file" -ForegroundColor White
} else {
    Write-Host "`nERROR: AAB file not found!" -ForegroundColor Red
    exit 1
}
