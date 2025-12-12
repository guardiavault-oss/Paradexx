# PowerShell script to deploy Paradox Wallet to Google Play Store
# Run this script from the project root directory

Write-Host "🚀 Paradox Wallet - Google Play Store Deployment" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if Android SDK is installed
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = "$env:LOCALAPPDATA\Android\Sdk"
    if (-not (Test-Path $androidHome)) {
        Write-Host "⚠️  ANDROID_HOME not set. Please install Android Studio and set ANDROID_HOME" -ForegroundColor Yellow
        Write-Host "   Expected location: $androidHome" -ForegroundColor Gray
    }
}

# Check Node.js version
Write-Host "`n🔍 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
$nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
if ($nodeMajor -lt 22) {
    Write-Host "⚠️  Node.js version $nodeVersion detected" -ForegroundColor Yellow
    Write-Host "   Capacitor 8 requires Node.js 22+" -ForegroundColor Yellow
    Write-Host "   Options:" -ForegroundColor Yellow
    Write-Host "   1. Upgrade Node.js to 22+ (recommended)" -ForegroundColor White
    Write-Host "   2. Use Capacitor 7 (compatible with Node 20)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Install Capacitor 7 instead? (y/n)"
    if ($choice -eq 'y' -or $choice -eq 'Y') {
        Write-Host "   Installing Capacitor 7..." -ForegroundColor Gray
        pnpm add -D @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7 @capacitor/ios@7 @capacitor/splash-screen@7 @capacitor/status-bar@7 @capacitor/keyboard@7 @capacitor/app@7
    } else {
        Write-Host "   Please upgrade Node.js to 22+ and run this script again" -ForegroundColor Yellow
        Write-Host "   Download: https://nodejs.org/" -ForegroundColor Cyan
        exit 1
    }
} else {
    Write-Host "✅ Node.js version $nodeVersion is compatible" -ForegroundColor Green
}

# Step 1: Install dependencies
Write-Host "`n📦 Step 1: Installing Dependencies..." -ForegroundColor Yellow
npm install

# Check if Capacitor is installed
Write-Host "`n🔍 Checking Capacitor installation..." -ForegroundColor Yellow
$capacitorInstalled = npm list @capacitor/core 2>$null
if (-not $capacitorInstalled) {
    Write-Host "📦 Installing Capacitor..." -ForegroundColor Yellow
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
}

# Step 2: Build web app
Write-Host "`n🏗️  Step 2: Building Web App..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

# Set production environment
$env:NODE_ENV = "production"
$env:VITE_API_URL = if ($env:VITE_API_URL) { $env:VITE_API_URL } else { "https://paradexx-production.up.railway.app" }

npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed! dist folder not found." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Web app built successfully" -ForegroundColor Green

# Step 3: Add Android platform if not exists
Write-Host "`n📱 Step 3: Setting up Android Platform..." -ForegroundColor Yellow

if (-not (Test-Path "android")) {
    Write-Host "   Adding Android platform..." -ForegroundColor Gray
    npx cap add android
} else {
    Write-Host "✅ Android platform already exists" -ForegroundColor Green
}

# Step 4: Sync Capacitor
Write-Host "`n🔄 Step 4: Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android

# Step 5: Generate app icons (if script exists)
if (Test-Path "scripts\generate-icons.js") {
    Write-Host "`n🎨 Step 5: Generating App Icons..." -ForegroundColor Yellow
    if (Test-Path "icon-source.png") {
        node scripts/generate-icons.js
        Write-Host "✅ Icons generated" -ForegroundColor Green
    } else {
        Write-Host "⚠️  icon-source.png not found. Using default icons." -ForegroundColor Yellow
        Write-Host "   Place a 1024x1024 PNG icon as 'icon-source.png' in the project root" -ForegroundColor Gray
    }
}

# Step 6: Create release keystore if not exists
Write-Host "`n🔐 Step 6: Setting up Release Keystore..." -ForegroundColor Yellow

if (-not (Test-Path "android\release-keystore.jks")) {
    Write-Host "   Creating release keystore..." -ForegroundColor Gray
    Write-Host "   ⚠️  IMPORTANT: You will be prompted for keystore information" -ForegroundColor Yellow
    Write-Host "   Keep this keystore safe - you will need it for all future updates!" -ForegroundColor Yellow
    
    $keystorePassword = Read-Host "Enter keystore password (min 6 chars)" -AsSecureString
    $keyPassword = Read-Host "Enter key password (can be same as keystore)" -AsSecureString
    
    $keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword)
    )
    $keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword)
    )
    
    # Create keystore
    keytool -genkey -v -keystore android\release-keystore.jks `
        -alias paradox `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $keystorePasswordPlain `
        -keypass $keyPasswordPlain `
        -dname "CN=Paradox Wallet, OU=Development, O=Paradox, L=City, ST=State, C=US"
    
    Write-Host "✅ Keystore created successfully" -ForegroundColor Green
    Write-Host "   ⚠️  SAVE THESE PASSWORDS SECURELY!" -ForegroundColor Red
    
    # Save passwords to .env.local (gitignored)
    @"
ANDROID_KEYSTORE_PASSWORD=$keystorePasswordPlain
ANDROID_KEY_PASSWORD=$keyPasswordPlain
"@ | Out-File -FilePath ".env.local" -Encoding utf8
    
    Write-Host "   Passwords saved to .env.local (gitignored)" -ForegroundColor Gray
} else {
    Write-Host "✅ Release keystore already exists" -ForegroundColor Green
}

# Step 7: Configure build.gradle
Write-Host "`n⚙️  Step 7: Configuring Android Build..." -ForegroundColor Yellow

$buildGradlePath = "android\app\build.gradle"
if (Test-Path $buildGradlePath) {
    Write-Host "✅ Build configuration found" -ForegroundColor Green
} else {
    Write-Host "⚠️  build.gradle not found. Android project may need setup." -ForegroundColor Yellow
}

# Step 8: Build release AAB
Write-Host "`n📦 Step 8: Building Release AAB (Android App Bundle)..." -ForegroundColor Yellow
Write-Host "   This will take several minutes..." -ForegroundColor Gray

Push-Location android

# Load keystore passwords from .env.local if exists
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

# Build AAB
.\gradlew bundleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Check the error messages above." -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    $fileSize = (Get-Item $aabPath).Length / 1MB
    Write-Host "`n✅ Release AAB built successfully!" -ForegroundColor Green
    Write-Host "   Location: $aabPath" -ForegroundColor Cyan
    Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ AAB file not found at expected location" -ForegroundColor Red
    exit 1
}

# Step 9: Summary and next steps
Write-Host "`n" + "=" * 80 -ForegroundColor Cyan
Write-Host "✅ BUILD COMPLETE!" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host "`n📋 Next Steps for Google Play Store:" -ForegroundColor Yellow
Write-Host "   1. Go to https://play.google.com/console" -ForegroundColor White
Write-Host "   2. Create a new app (if not already created)" -ForegroundColor White
Write-Host "   3. Fill in store listing information:" -ForegroundColor White
Write-Host "      - App name: Paradox Wallet" -ForegroundColor Gray
Write-Host "      - Package name: io.paradox.wallet" -ForegroundColor Gray
Write-Host "      - Category: Finance" -ForegroundColor Gray
Write-Host "   4. Upload the AAB file: $aabPath" -ForegroundColor White
Write-Host "   5. Complete content rating questionnaire" -ForegroundColor White
Write-Host "   6. Add privacy policy URL" -ForegroundColor White
Write-Host "   7. Add screenshots and feature graphic" -ForegroundColor White
Write-Host "   8. Submit for review" -ForegroundColor White

Write-Host "`n📝 Required Assets:" -ForegroundColor Yellow
Write-Host "   - App icon: 512x512 PNG" -ForegroundColor White
Write-Host "   - Feature graphic: 1024x500 PNG" -ForegroundColor White
Write-Host "   - Screenshots: Phone (min 2, max 8) and Tablet (optional)" -ForegroundColor White
Write-Host "   - Privacy Policy URL (required)" -ForegroundColor White

Write-Host "`n📄 Documentation:" -ForegroundColor Yellow
Write-Host "   See docs/GOOGLE_PLAY_STORE_DEPLOYMENT.md for detailed guide" -ForegroundColor White

Write-Host "`n" + "=" * 80 -ForegroundColor Cyan

