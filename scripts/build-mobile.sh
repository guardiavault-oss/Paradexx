#!/bin/bash
# Paradox Mobile App Build Script
# This script builds the app for iOS and Android

set -e

echo "🚀 Paradox Mobile Build Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print step
print_step() {
    echo -e "\n${GREEN}▶ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Install dependencies
print_step "Installing dependencies..."
npm install

# Step 2: Build web app
print_step "Building web app..."
npm run build

# Step 3: Generate app icons (if sharp is installed)
print_step "Generating app icons..."
if npm list sharp > /dev/null 2>&1; then
    node scripts/generate-icons.js
else
    print_warning "Sharp not installed. Run 'npm install sharp' to generate icons."
fi

# Step 4: Sync Capacitor
print_step "Syncing Capacitor..."
npx cap sync

# Step 5: Build for iOS (Mac only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_step "Building iOS app..."
    npx cap open ios
    echo "📱 Xcode opened. Build and archive from there."
else
    print_warning "iOS builds require macOS with Xcode"
fi

# Step 6: Build for Android
print_step "Building Android app..."

# Check if ANDROID_HOME is set
if [ -z "$ANDROID_HOME" ]; then
    print_warning "ANDROID_HOME not set. Please set it to your Android SDK path."
else
    cd android
    
    # Build debug APK
    print_step "Building debug APK..."
    ./gradlew assembleDebug
    
    # Build release AAB (for Play Store)
    if [ -f "release-keystore.jks" ]; then
        print_step "Building release AAB..."
        ./gradlew bundleRelease
        echo "📦 Release AAB: android/app/build/outputs/bundle/release/app-release.aab"
    else
        print_warning "No release keystore found. Skipping release build."
        echo "   Create a keystore with: keytool -genkey -v -keystore release-keystore.jks -alias paradox -keyalg RSA -keysize 2048 -validity 10000"
    fi
    
    cd ..
fi

echo ""
echo "================================"
echo "✅ Build complete!"
echo ""
echo "📁 Output locations:"
echo "   Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo "   Release AAB: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📝 Next steps:"
echo "   1. Test the debug APK on a real device"
echo "   2. Create app store screenshots"
echo "   3. Submit to App Store Connect and Google Play Console"
