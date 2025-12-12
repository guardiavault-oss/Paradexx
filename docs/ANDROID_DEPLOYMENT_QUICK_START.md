# Android Deployment - Quick Start Guide

**Get your app on Google Play Store in 3 steps!**

## Prerequisites Checklist

- [ ] **Google Play Developer Account** ($25 one-time fee)
  - Sign up at: https://play.google.com/console
- [ ] **Android Studio** installed
  - Download: https://developer.android.com/studio
- [ ] **Android SDK** (API 33+)
  - Installed via Android Studio
- [ ] **Java JDK** (11+)
  - Usually comes with Android Studio

## Quick Deployment (Automated)

### Option 1: Full Automated Script

```powershell
# Run the complete deployment script
.\scripts\deploy-android-playstore.ps1
```

This will:
1. ✅ Install dependencies
2. ✅ Build web app
3. ✅ Set up Android platform
4. ✅ Create release keystore (if needed)
5. ✅ Build release AAB file
6. ✅ Provide next steps

### Option 2: Step-by-Step

```powershell
# 1. Setup Android project
.\scripts\setup-android-deployment.ps1

# 2. Build and deploy
.\scripts\deploy-android-playstore.ps1
```

## Manual Deployment

If you prefer manual control:

### 1. Install Capacitor

```bash
pnpm add -D @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Build Web App

```bash
npm run build
```

### 3. Initialize Capacitor (if first time)

```bash
npx cap init "Paradox Wallet" "io.paradox.wallet" --web-dir=dist
```

### 4. Add Android Platform

```bash
npx cap add android
npx cap sync android
```

### 5. Create Release Keystore

```bash
keytool -genkey -v -keystore android/release-keystore.jks \
  -alias paradox \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**⚠️ IMPORTANT**: Save passwords securely! You'll need them for all future updates.

### 6. Build Release AAB

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 7. Upload to Play Store

1. Go to https://play.google.com/console
2. Create new app
3. Upload AAB file
4. Complete store listing (see `docs/PLAY_STORE_LISTING.md`)
5. Submit for review

## App Information

- **App Name**: Paradox Wallet
- **Package Name**: `io.paradox.wallet`
- **Version**: `1.0.0`
- **Category**: Finance

## Required Assets

Before submitting, prepare:

1. **App Icon**: 512x512 PNG
2. **Feature Graphic**: 1024x500 PNG
3. **Screenshots**: 
   - Phone: 2-8 screenshots (16:9 or 9:16)
   - Tablet: Optional
4. **Privacy Policy URL**: Required
5. **Store Listing**: See `docs/PLAY_STORE_LISTING.md`

## Troubleshooting

### "SDK location not found"

Set ANDROID_HOME:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### "Keystore not found"

Create keystore (see Step 5 above)

### Build fails

```bash
cd android
./gradlew clean
./gradlew bundleRelease
```

## Next Steps After Build

1. ✅ Test AAB on a real device (use internal testing track)
2. ✅ Prepare store listing materials
3. ✅ Upload to Play Console
4. ✅ Complete content rating
5. ✅ Submit for review

## Full Documentation

- **Deployment Guide**: `docs/GOOGLE_PLAY_STORE_DEPLOYMENT.md`
- **Store Listing**: `docs/PLAY_STORE_LISTING.md`
- **Build Guide**: `docs/guides/MOBILE_BUILD_GUIDE.md`

---

**Ready?** Run: `.\scripts\deploy-android-playstore.ps1`

