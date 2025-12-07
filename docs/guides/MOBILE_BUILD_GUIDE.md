# Paradox Mobile App Build Guide

## Prerequisites

### For Both Platforms

1. Node.js 18+ installed
2. Paradox dependencies installed (`npm install`)

### For Android

1. Android Studio installed
2. Android SDK installed (API 33+)
3. Set `ANDROID_HOME` environment variable
4. Accept Android SDK licenses: `sdkmanager --licenses`

### For iOS (Mac only)

1. Xcode 15+ installed
2. CocoaPods installed: `sudo gem install cocoapods`
3. Apple Developer Account ($99/year)

---

## Quick Build Commands

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Sync native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode (Mac only)
npx cap open ios
```

---

## Step-by-Step: Android Build

### 1. Generate App Icons

```bash
# Install sharp for icon generation
npm install sharp

# Generate icons (creates placeholder if no source icon exists)
node scripts/generate-icons.js
```

Place your 1024x1024 app icon as `icon-source.png` in the project root.

### 2. Create Release Keystore

```bash
keytool -genkey -v -keystore release-keystore.jks -alias paradox -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT**: Keep this keystore safe! You need it to update the app forever.

### 3. Set Environment Variables

Create `.env.local`:

```
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
```

### 4. Build Release

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 5. Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in store listing (use content from `docs/APP_STORE_LISTING.md`)
4. Upload AAB file
5. Submit for review

---

## Step-by-Step: iOS Build

### 1. Setup iOS Project

```bash
# Sync capacitor
npx cap sync ios

# Install CocoaPods dependencies
cd ios/App
pod install
cd ../..

# Open in Xcode
npx cap open ios
```

### 2. Configure Signing in Xcode

1. Select the project in Xcode
2. Go to "Signing & Capabilities"
3. Select your team
4. Ensure "Automatically manage signing" is checked

### 3. Set Bundle Identifier

Bundle ID: `io.paradox.wallet`

### 4. Archive for App Store

1. In Xcode: Product → Archive
2. When complete, click "Distribute App"
3. Choose "App Store Connect"
4. Upload to App Store Connect

### 5. Submit to App Store

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in app information (use content from `docs/APP_STORE_LISTING.md`)
4. Add screenshots
5. Submit for review

---

## App Store Requirements Checklist

### Apple App Store

- [ ] 1024x1024 app icon (no alpha, no rounded corners)
- [ ] Screenshots for all device sizes (6.5", 5.5", iPad)
- [ ] Privacy Policy URL (<https://paradox.io/privacy>)
- [ ] App description (4000 chars max)
- [ ] Keywords (100 chars max)
- [ ] Support URL
- [ ] Marketing URL
- [ ] Age rating questionnaire
- [ ] Export compliance (encryption)

### Google Play Store

- [ ] 512x512 app icon
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] Privacy Policy URL
- [ ] Full description (4000 chars max)
- [ ] Short description (80 chars)
- [ ] Content rating questionnaire
- [ ] Data safety section
- [ ] Target audience declaration

---

## Troubleshooting

### Android: "SDK location not found"

Set ANDROID_HOME:

```bash
# Windows
set ANDROID_HOME=C:\Users\YOUR_USER\AppData\Local\Android\Sdk

# Mac/Linux
export ANDROID_HOME=$HOME/Android/Sdk
```

### iOS: "No signing certificate"

1. Open Xcode
2. Preferences → Accounts
3. Add your Apple ID
4. Download certificates

### Build fails: "Could not find capacitor"

```bash
npm install @capacitor/core @capacitor/cli
npx cap sync
```

### Icons not showing

Ensure icons are generated:

```bash
node scripts/generate-icons.js
npx cap sync
```

---

## Version Management

Update version in:

1. `package.json` - version field
2. `android/app/build.gradle` - versionCode & versionName
3. Xcode - MARKETING_VERSION & CURRENT_PROJECT_VERSION

---

## Support

Questions? Contact: <support@paradox.io>
