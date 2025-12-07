# AegisX Android Build Guide

This guide covers building and releasing the AegisX wallet app for Android/Play Store.

## Prerequisites

- Android Studio (Arctic Fox or later)
- JDK 11 or higher
- Android SDK with API level 34
- Node.js 18+ and npm

## Build Process

### Step 1: Prepare the Web Build

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Sync with Android
npx cap sync android
```

### Step 2: Open in Android Studio

```bash
npx cap open android
```

This will open the Android project in Android Studio.

### Step 3: Create a Release Keystore

For Play Store distribution, you need a signed release build:

```bash
keytool -genkey -v -keystore release-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias aegisx -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD
```

Store the keystore file securely and never commit it to version control.

### Step 4: Configure Signing

Create a `keystore.properties` file in the `android/` directory:

```properties
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=aegisx
storeFile=release-keystore.jks
```

### Step 5: Build Release APK/AAB

**For APK (testing/sideloading):**
```bash
cd android
./gradlew assembleRelease \
  -PANDROID_KEYSTORE_FILE=release-keystore.jks \
  -PANDROID_KEYSTORE_PASSWORD=YOUR_STORE_PASSWORD \
  -PANDROID_KEY_ALIAS=aegisx \
  -PANDROID_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

**For AAB (Play Store):**
```bash
cd android
./gradlew bundleRelease \
  -PANDROID_KEYSTORE_FILE=release-keystore.jks \
  -PANDROID_KEYSTORE_PASSWORD=YOUR_STORE_PASSWORD \
  -PANDROID_KEY_ALIAS=aegisx \
  -PANDROID_KEY_PASSWORD=YOUR_KEY_PASSWORD
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

## Play Store Submission

### App Information Required

- **App Name:** AegisX Wallet
- **Package Name:** com.regenx.wallet
- **Category:** Finance
- **Content Rating:** Everyone (no mature content)
- **Target Audience:** 18+ (financial app)

### Required Assets

| Asset | Size | Format |
|-------|------|--------|
| App Icon | 512x512 | PNG |
| Feature Graphic | 1024x500 | PNG/JPEG |
| Phone Screenshots | 1080x1920 (min 2, max 8) | PNG/JPEG |
| Tablet Screenshots (optional) | 1920x1200 (min 2) | PNG/JPEG |

### App Description Template

**Short Description (80 chars max):**
```
Secure Web3 crypto wallet with guardian recovery & inheritance vaults.
```

**Full Description:**
```
AegisX Wallet combines advanced crypto trading with robust digital legacy management.

KEY FEATURES:

DegenX Trading Platform:
- MEV protection against front-running
- Sniper bot for new token launches
- Cross-chain bridging
- Real-time whale tracking
- Advanced security scanning

GuardianX Inheritance System:
- Seedless wallet recovery with guardians
- Inheritance vaults with beneficiary management
- Smart will templates
- Secure legacy messages (text & video)

Security Features:
- Biometric authentication (Face ID/Touch ID)
- Wallet Guard monitoring
- Honeypot detection
- Rug pull protection
- Real-time threat alerts

SUBSCRIPTION TIERS:
- Free: Basic wallet features
- Pro ($9.99/month): MEV protection, wallet guard, security scans
- Inheritance Essential ($149 one-time): Basic vault
- Inheritance Premium ($299 one-time): Advanced legacy tools
```

### Privacy Policy & Terms

Ensure you have:
- Privacy Policy URL
- Terms of Service URL
- Data safety form completed

## Version Management

Update these files for each release:

1. `android/app/build.gradle`:
   - `versionCode` (increment by 1)
   - `versionName` (semantic versioning)

2. `package.json`:
   - `version` field

3. `capacitor.config.ts`:
   - No version field needed (uses web assets)

## Troubleshooting

### Build Errors

**Gradle sync failed:**
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

**Native dependencies missing:**
```bash
npx cap sync android
```

**Keystore issues:**
Verify keystore properties match exactly.

### Testing Release Builds

1. Enable Developer Mode on Android device
2. Enable USB Debugging
3. Install APK:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## CI/CD Integration

For automated builds, set these environment variables:
- `ANDROID_KEYSTORE_FILE`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## Security Notes

- Never commit keystores or passwords to version control
- Use GitHub Secrets or similar for CI/CD
- Keep multiple backups of your release keystore
- Document your keystore credentials securely (you'll need them forever)
