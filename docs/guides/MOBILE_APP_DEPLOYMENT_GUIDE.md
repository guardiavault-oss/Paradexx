# 📱 Mobile App Deployment Guide

## Overview

This guide covers deploying your crypto wallet as native mobile apps for **Apple App Store (iOS)** and **Google Play Store (Android)**.

---

## 🍎 iOS App Store Deployment

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)
   - Enroll in Apple Developer Program

2. **Development Tools**
   - macOS computer (required)
   - Xcode (latest version)
   - CocoaPods (for dependencies)

3. **App Information**
   - App name: "DegenX & GuardianX Wallet"
   - Bundle ID: `com.yourcompany.degenx` (unique identifier)
   - App Store Connect account

### Step 1: Set Up React Native / Capacitor

#### Option A: React Native (Recommended)

```bash
# Install React Native CLI
npm install -g react-native-cli

# Create new React Native project
npx react-native init DegenXWallet --template react-native-template-typescript

# Copy your React code to the new project
# Install dependencies
cd DegenXWallet
npm install
```

#### Option B: Capacitor (Easier Migration)

```bash
# Install Capacitor CLI
npm install -g @capacitor/cli

# Initialize Capacitor in your existing project
npx cap init "DegenX Wallet" "com.yourcompany.degenx"

# Add iOS platform
npx cap add ios

# Sync your web app to iOS
npx cap sync ios
```

### Step 2: Configure iOS Project

1. **Open in Xcode**:
   ```bash
   npx cap open ios
   ```

2. **Configure Bundle Identifier**:
   - Select project in Xcode
   - Go to "Signing & Capabilities"
   - Set Bundle Identifier: `com.yourcompany.degenx`
   - Enable "Automatically manage signing"
   - Select your Team

3. **Configure App Icons**:
   - Add app icons (1024x1024 for App Store)
   - Add launch screen images
   - Use Asset Catalog

4. **Set Version & Build**:
   - Version: `1.0.0`
   - Build: `1`

### Step 3: App Store Connect Setup

1. **Create App Record**:
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Click "+" → "New App"
   - Fill in:
     - Platform: iOS
     - Name: "DegenX & GuardianX Wallet"
     - Primary Language: English
     - Bundle ID: `com.yourcompany.degenx`
     - SKU: `degenx-wallet-001`

2. **App Information**:
   - Category: Finance
   - Subcategory: Cryptocurrency
   - Age Rating: 17+ (for crypto apps)
   - Privacy Policy URL: `https://yourdomain.com/privacy`

3. **App Store Listing**:
   - Screenshots (required):
     - iPhone 6.7" (1290 x 2796)
     - iPhone 6.5" (1284 x 2778)
     - iPhone 5.5" (1242 x 2208)
   - App Preview (optional)
   - Description (up to 4000 characters)
   - Keywords (up to 100 characters)
   - Support URL
   - Marketing URL (optional)

### Step 4: Build & Archive

1. **Build for Release**:
   ```bash
   # In Xcode:
   # Product → Scheme → Edit Scheme
   # Set Build Configuration to "Release"
   ```

2. **Archive**:
   - Product → Archive
   - Wait for archive to complete
   - Click "Distribute App"

3. **Upload to App Store**:
   - Select "App Store Connect"
   - Click "Upload"
   - Wait for processing

### Step 5: Submit for Review

1. **In App Store Connect**:
   - Go to your app → "App Store" tab
   - Click "+ Version or Platform"
   - Fill in version information
   - Add screenshots and description
   - Set pricing (Free or Paid)
   - Submit for Review

2. **Review Guidelines**:
   - Ensure compliance with App Store Review Guidelines
   - Crypto apps require additional documentation
   - Provide demo account if needed

### Step 6: App Review Process

- **Typical Timeline**: 1-3 days
- **Common Rejections**:
  - Missing privacy policy
  - Incomplete app functionality
  - Violation of crypto guidelines
  - Missing required permissions

---

## 🤖 Google Play Store Deployment

### Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up at [play.google.com/console](https://play.google.com/console)
   - Pay one-time registration fee

2. **Development Tools**
   - Android Studio
   - Java Development Kit (JDK)
   - Android SDK

3. **App Information**
   - App name: "DegenX & GuardianX Wallet"
   - Package name: `com.yourcompany.degenx`
   - Google Play Console account

### Step 1: Set Up Android Project

#### Option A: React Native

```bash
# Add Android platform
npx react-native run-android

# Or create new project
npx react-native init DegenXWallet --template react-native-template-typescript
```

#### Option B: Capacitor

```bash
# Add Android platform
npx cap add android

# Sync your web app to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### Step 2: Configure Android Project

1. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

2. **Configure Package Name**:
   - Open `android/app/build.gradle`
   - Set `applicationId`: `com.yourcompany.degenx`

3. **Set Version**:
   - `versionCode`: `1`
   - `versionName`: `"1.0.0"`

4. **Configure Signing**:
   - Create keystore:
     ```bash
     keytool -genkey -v -keystore degenx-release.keystore -alias degenx -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Add to `android/app/build.gradle`:
     ```gradle
     android {
         signingConfigs {
             release {
                 storeFile file('degenx-release.keystore')
                 storePassword 'your-password'
                 keyAlias 'degenx'
                 keyPassword 'your-password'
             }
         }
         buildTypes {
             release {
                 signingConfig signingConfigs.release
             }
         }
     }
     ```

### Step 3: Google Play Console Setup

1. **Create App**:
   - Go to [Google Play Console](https://play.google.com/console)
   - Click "Create app"
   - Fill in:
     - App name: "DegenX & GuardianX Wallet"
     - Default language: English
     - App or game: App
     - Free or paid: Free
     - Declarations: Check all applicable

2. **App Content**:
   - Privacy Policy URL: `https://yourdomain.com/privacy`
   - Target audience: 17+
   - Content rating questionnaire

3. **Store Listing**:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots:
     - Phone (at least 2, max 8)
     - Tablet (optional)
   - Short description (80 characters)
   - Full description (4000 characters)
   - Category: Finance

### Step 4: Build Release APK/AAB

1. **Generate Release Build**:
   ```bash
   cd android
   ./gradlew assembleRelease
   # Or for App Bundle:
   ./gradlew bundleRelease
   ```

2. **Output Location**:
   - APK: `android/app/build/outputs/apk/release/app-release.apk`
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Upload to Play Store

1. **Create Release**:
   - Go to Play Console → Your App → Production
   - Click "Create new release"
   - Upload AAB file (recommended) or APK
   - Add release notes

2. **Review Release**:
   - Check all sections are complete
   - Content rating completed
   - Privacy policy added
   - App access (if restricted)

3. **Submit for Review**:
   - Click "Review release"
   - Submit for review

### Step 6: App Review Process

- **Typical Timeline**: 1-7 days
- **Common Rejections**:
  - Missing privacy policy
  - Incomplete functionality
  - Policy violations
  - Security issues

---

## 🔧 Technical Requirements

### iOS Requirements

- **Minimum iOS Version**: iOS 13.0+
- **Device Support**: iPhone, iPad
- **Required Permissions**:
  - Camera (for QR codes)
  - Biometric authentication
  - Network access

### Android Requirements

- **Minimum Android Version**: Android 7.0 (API 24)
- **Target Android Version**: Android 14 (API 34)
- **Required Permissions**:
  - INTERNET
  - CAMERA (for QR codes)
  - BIOMETRIC authentication
  - VIBRATE

---

## 📋 Pre-Deployment Checklist

### Code Requirements

- [ ] Remove all console.log statements
- [ ] Remove test/debug code
- [ ] Set production API URLs
- [ ] Enable error tracking (Sentry)
- [ ] Configure analytics
- [ ] Test on real devices
- [ ] Test all features
- [ ] Performance optimization

### Legal Requirements

- [ ] Privacy Policy (required)
- [ ] Terms of Service
- [ ] Cookie Policy (if applicable)
- [ ] GDPR compliance (if EU users)
- [ ] Age restrictions set correctly

### App Store Requirements

- [ ] App icons (all sizes)
- [ ] Launch screens
- [ ] Screenshots (all required sizes)
- [ ] App description
- [ ] Keywords optimized
- [ ] Support URL
- [ ] Marketing URL (optional)

### Security

- [ ] API keys secured
- [ ] No hardcoded secrets
- [ ] SSL pinning (recommended)
- [ ] Code obfuscation (Android)
- [ ] App Transport Security (iOS)

---

## 🚀 Deployment Scripts

### iOS Build Script

```bash
#!/bin/bash
# build-ios.sh

echo "Building iOS app..."

# Install dependencies
npm install

# Build React Native
npm run build:ios

# Open in Xcode
open ios/DegenXWallet.xcworkspace

echo "Build complete! Archive in Xcode."
```

### Android Build Script

```bash
#!/bin/bash
# build-android.sh

echo "Building Android app..."

# Install dependencies
npm install

# Build React Native
npm run build:android

# Build release APK
cd android
./gradlew assembleRelease

echo "APK built at: android/app/build/outputs/apk/release/app-release.apk"
```

---

## 📊 Post-Deployment

### Monitoring

- **Crash Reports**: Firebase Crashlytics or Sentry
- **Analytics**: Google Analytics, Mixpanel
- **Performance**: Firebase Performance Monitoring
- **User Feedback**: In-app feedback system

### Updates

- **Version Management**: Increment version numbers
- **Changelog**: Document changes
- [ ] Test updates thoroughly
- [ ] Staged rollouts (recommended)
- [ ] Monitor crash rates

---

## 🆘 Troubleshooting

### Common iOS Issues

**Issue**: Code signing errors
- **Solution**: Check Team selection in Xcode

**Issue**: Archive fails
- **Solution**: Clean build folder (Cmd+Shift+K)

**Issue**: App rejected for crypto
- **Solution**: Provide detailed explanation and compliance docs

### Common Android Issues

**Issue**: Build fails
- **Solution**: Clean project: `./gradlew clean`

**Issue**: Keystore not found
- **Solution**: Check keystore path in build.gradle

**Issue**: App rejected for permissions
- **Solution**: Explain why permissions are needed

---

## 📚 Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [React Native Documentation](https://reactnative.dev/)
- [Capacitor Documentation](https://capacitorjs.com/)

---

## ✅ Next Steps

1. **Choose Framework**: React Native or Capacitor
2. **Set Up Development Environment**
3. **Create App Store Accounts**
4. **Build and Test**
5. **Submit for Review**
6. **Monitor and Iterate**

---

**Good luck with your app deployment! 🚀**

