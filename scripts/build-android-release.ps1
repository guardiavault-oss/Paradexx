# Build Android Release AAB for Google Play Store
# Simplified version that focuses on building

Write-Host "Building Android Release AAB" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Check if Android project exists
if (-not (Test-Path "android")) {
    Write-Host "ERROR: Android project not found!" -ForegroundColor Red
    Write-Host "   Run: npx cap add android" -ForegroundColor Yellow
    exit 1
}

# Check if dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "`nBuilding web app first..." -ForegroundColor Yellow
    npm run build
    
    if (-not (Test-Path "dist")) {
        Write-Host "ERROR: Build failed! dist folder not found." -ForegroundColor Red
        exit 1
    }
}

# Sync Capacitor
Write-Host "`nSyncing Capacitor..." -ForegroundColor Yellow
npx cap sync android

# Check for keystore
if (-not (Test-Path "android\release-keystore.jks")) {
    Write-Host "`nWARNING: Release keystore not found!" -ForegroundColor Yellow
    Write-Host "   Creating keystore..." -ForegroundColor Gray
    Write-Host "   You will be prompted for keystore information" -ForegroundColor Yellow
    
    $storePass = Read-Host "Enter keystore password (min 6 chars)" -AsSecureString
    $keyPass = Read-Host "Enter key password (can be same)" -AsSecureString
    
    $storePassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePass)
    )
    $keyPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPass)
    )
    
    keytool -genkey -v -keystore android\release-keystore.jks `
        -alias paradox `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $storePassPlain `
        -keypass $keyPassPlain `
        -dname "CN=Paradox Wallet, OU=Development, O=Paradox, L=City, ST=State, C=US"
    
    # Save to .env.local
    $envContent = "ANDROID_KEYSTORE_PASSWORD=$storePassPlain`nANDROID_KEY_PASSWORD=$keyPassPlain"
    $envContent | Out-File -FilePath ".env.local" -Encoding utf8
    
    Write-Host "SUCCESS: Keystore created and passwords saved to .env.local" -ForegroundColor Green
}

# Build AAB
Write-Host "`nBuilding Release AAB..." -ForegroundColor Yellow
Write-Host "   This may take several minutes..." -ForegroundColor Gray

Push-Location android

# Load passwords if .env.local exists
if (Test-Path "..\.env.local") {
    Get-Content "..\.env.local" | ForEach-Object {
        if ($_ -match "ANDROID_KEYSTORE_PASSWORD=(.+)") {
            $env:ANDROID_KEYSTORE_PASSWORD = $matches[1]
        }
        if ($_ -match "ANDROID_KEY_PASSWORD=(.+)") {
            $env:ANDROID_KEY_PASSWORD = $matches[1]
        }
    }
}

# Build
.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: Build failed! Check errors above." -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $fileSize = (Get-Item $aabPath).Length / 1MB
    Write-Host "`nSUCCESS: Release AAB built successfully!" -ForegroundColor Green
    Write-Host "   Location: $aabPath" -ForegroundColor Cyan
    Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    
    Write-Host "`nNext Steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to https://play.google.com/console" -ForegroundColor White
    Write-Host "   2. Create new app (if not exists)" -ForegroundColor White
    Write-Host "   3. Upload AAB file: $aabPath" -ForegroundColor White
    Write-Host "   4. Complete store listing (see docs/PLAY_STORE_LISTING.md)" -ForegroundColor White
    Write-Host "   5. Submit for review" -ForegroundColor White
} else {
    Write-Host "`nERROR: AAB file not found at expected location" -ForegroundColor Red
    exit 1
}
