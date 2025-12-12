# Google Play Store Deployment Guide

**Complete guide for deploying Paradox Wallet to Google Play Store**

## Prerequisites

### 1. Google Play Developer Account
- **Cost**: $25 one-time registration fee
- **Sign up**: [play.google.com/console](https://play.google.com/console)
- **Required**: Google account, payment method

### 2. Development Tools
- ✅ Node.js 18+ (already installed)
- ✅ Android Studio (download from [developer.android.com](https://developer.android.com/studio))
- ✅ Android SDK (API 33+)
- ✅ Java Development Kit (JDK 11+)

### 3. Environment Setup

#### Windows
```powershell
# Set ANDROID_HOME (if not set automatically)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Add to PATH
$env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"
```

#### Verify Installation
```powershell
# Check Android SDK
adb version

# Check Java
java -version
```

## Quick Deployment

### Automated Script (Recommended)

```powershell
# Run the deployment script
.\scripts\deploy-android-playstore.ps1
```

This script will:
1. ✅ Install dependencies
2. ✅ Build web app
3. ✅ Set up Android platform
4. ✅ Create release keystore (if needed)
5. ✅ Build release AAB file
6. ✅ Provide next steps

### Manual Steps

If you prefer manual control:

```bash
# 1. Install dependencies
npm install

# 2. Build web app
npm run build

# 3. Add Android platform (if not exists)
npx cap add android

# 4. Sync Capacitor
npx cap sync android

# 5. Create release keystore (first time only)
keytool -genkey -v -keystore android/release-keystore.jks \
  -alias paradox \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 6. Build release AAB
cd android
./gradlew bundleRelease
cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## App Configuration

### App Information

- **App Name**: Paradox Wallet
- **Package Name**: `io.paradox.wallet` (from capacitor.config.ts)
- **Version**: `1.0.0` (update in `package.json` and `android/app/build.gradle`)
- **Category**: Finance
- **Content Rating**: Everyone (with financial services warning)

### Version Management

Update version in these files:

1. **package.json**:
   ```json
   {
     "version": "1.0.0"
   }
   ```

2. **android/app/build.gradle**:
   ```gradle
   android {
       defaultConfig {
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

3. **capacitor.config.ts**:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'io.paradox.wallet',
     appName: 'Paradox',
     // ...
   };
   ```

## Release Keystore Setup

### Create Keystore (First Time Only)

```bash
keytool -genkey -v -keystore android/release-keystore.jks \
  -alias paradox \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YOUR_STORE_PASSWORD \
  -keypass YOUR_KEY_PASSWORD \
  -dname "CN=Paradox Wallet, OU=Development, O=Paradox, L=City, ST=State, C=US"
```

**⚠️ CRITICAL**: 
- Save the keystore file securely
- Save passwords securely
- You'll need this keystore for ALL future updates
- If lost, you CANNOT update the app on Play Store

### Configure Signing

The keystore is already configured in `capacitor.config.ts`:
```typescript
android: {
  buildOptions: {
    keystorePath: 'release-keystore.jks',
    keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
    keystoreAlias: 'paradox',
    keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
    releaseType: 'AAB',
  },
}
```

Set environment variables:
```powershell
$env:ANDROID_KEYSTORE_PASSWORD = "your_keystore_password"
$env:ANDROID_KEY_PASSWORD = "your_key_password"
```

Or create `.env.local`:
```
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_PASSWORD=your_key_password
```

## Building Release AAB

### Using Gradle (Recommended)

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Using Android Studio

1. Open project: `npx cap open android`
2. Build → Generate Signed Bundle / APK
3. Select "Android App Bundle"
4. Choose keystore and enter passwords
5. Build → Release

## Google Play Console Setup

### Step 1: Create App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:
   - **App name**: Paradox Wallet
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Accept terms

### Step 2: Complete Store Listing

#### Required Information

1. **App name**: Paradox Wallet
2. **Short description** (80 chars max):
   ```
   Secure Web3 wallet with MEV protection, DeFi tools, and AI-powered insights
   ```

3. **Full description** (4000 chars max):
   ```
   Paradox Wallet is a next-generation Web3 wallet platform that combines 
   advanced security features with powerful DeFi tools and AI-powered insights.
   
   🔐 Security Features:
   • MEV Protection - Shield transactions from front-running and sandwich attacks
   • Wallet Guard - Advanced wallet monitoring and threat detection
   • Bridge Security - Real-time security scoring for cross-chain bridges
   • Biometric Authentication - Secure access with fingerprint or face ID
   
   💎 DeFi Tools:
   • Multi-chain Swaps - Seamless token swaps across major networks
   • Yield Opportunities - AI-curated yield farming and staking
   • Limit Orders & DCA - Advanced trading automation
   • Sniper Bot - Meme token detection and early entry tools
   
   🤖 AI-Powered:
   • Scarlette AI - Intelligent assistant for DeFi navigation
   • Risk Analysis - Smart contract and token risk assessment
   • Portfolio Insights - AI-driven portfolio optimization suggestions
   
   🌐 Multi-Chain Support:
   • Ethereum, Polygon, Arbitrum, Optimism, Base, BNB Chain, Avalanche
   
   Start your Web3 journey with the most secure and feature-rich wallet available.
   ```

4. **App icon**: 512x512 PNG (no transparency)
5. **Feature graphic**: 1024x500 PNG
6. **Screenshots**: 
   - Phone: Minimum 2, maximum 8 (required)
   - Tablet: Optional but recommended
   - Sizes: 16:9 or 9:16 aspect ratio

7. **Privacy Policy URL** (REQUIRED):
   ```
   https://paradox.io/privacy
   ```
   Or use: `https://paradox.io/legal/privacy-policy`

8. **Support URL**:
   ```
   https://paradox.io/support
   ```

### Step 3: Content Rating

1. Complete content rating questionnaire
2. Select appropriate categories
3. Answer questions about:
   - Financial services (Yes - app handles payments)
   - User-generated content (No)
   - Location sharing (Optional)
   - Sensitive content (No)

**Expected Rating**: Everyone (with financial services warning)

### Step 4: Data Safety

Complete the Data Safety section:

- **Data Collection**: 
  - Financial info (wallet addresses, transaction history)
  - Personal info (email for account)
  - App activity (usage analytics)
  
- **Data Sharing**: 
  - With third parties (analytics providers)
  - For security (threat detection)
  
- **Security Practices**:
  - Data encrypted in transit
  - Data encrypted at rest
  - Users can request data deletion

### Step 5: Target Audience

- **Target age**: 18+ (financial app)
- **Content**: Suitable for all ages (with financial services)

### Step 6: Upload AAB

1. Go to "Production" → "Create new release"
2. Upload the AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
3. Add release notes:
   ```
   Initial release of Paradox Wallet
   
   Features:
   - Secure Web3 wallet with multi-chain support
   - MEV protection and advanced security
   - DeFi tools and trading features
   - AI-powered insights and recommendations
   ```
4. Review and roll out

### Step 7: Review and Submit

1. Review all sections:
   - ✅ Store listing complete
   - ✅ Content rating done
   - ✅ Data safety completed
   - ✅ AAB uploaded
   - ✅ Release notes added

2. Click "Submit for review"
3. Wait for Google review (typically 1-3 days)

## Required Assets

### App Icon
- **Size**: 512x512 pixels
- **Format**: PNG
- **Requirements**: 
  - No transparency
  - No rounded corners (Google adds them)
  - High quality

### Feature Graphic
- **Size**: 1024x500 pixels
- **Format**: PNG
- **Requirements**: 
  - Promotional image for Play Store
  - Should represent your app

### Screenshots

#### Phone Screenshots (Required)
- **Minimum**: 2 screenshots
- **Maximum**: 8 screenshots
- **Aspect ratio**: 16:9 or 9:16
- **Recommended sizes**:
  - 1080x1920 (portrait)
  - 1920x1080 (landscape)

#### Tablet Screenshots (Optional)
- **Aspect ratio**: 16:9 or 9:16
- **Recommended size**: 1920x1200

### Screenshot Ideas

1. Dashboard/home screen
2. Wallet overview with balances
3. Swap interface
4. Security features (MEV protection)
5. DeFi features (yield farming)
6. Settings/preferences

## Pre-Submission Checklist

### Code Quality
- [ ] All console.log statements removed (or wrapped in production check)
- [ ] No test/debug code in production build
- [ ] Production API URLs configured
- [ ] Error handling implemented
- [ ] Loading states for all async operations

### Security
- [ ] No hardcoded API keys or secrets
- [ ] SSL pinning configured (recommended)
- [ ] Biometric authentication working
- [ ] Secure storage for sensitive data
- [ ] Privacy policy accessible

### Functionality
- [ ] All features tested on real devices
- [ ] App works offline (where applicable)
- [ ] No crashes during testing
- [ ] Performance optimized
- [ ] Battery usage reasonable

### Legal
- [ ] Privacy Policy URL added
- [ ] Terms of Service URL added (if applicable)
- [ ] GDPR compliance (if EU users)
- [ ] Age restrictions set correctly

### Store Listing
- [ ] App name set
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App icon uploaded (512x512)
- [ ] Feature graphic uploaded (1024x500)
- [ ] Screenshots uploaded (min 2)
- [ ] Support URL added
- [ ] Privacy Policy URL added

### Technical
- [ ] AAB file built successfully
- [ ] Version code incremented
- [ ] Version name set
- [ ] Release notes prepared
- [ ] Keystore backed up securely

## Post-Submission

### Monitoring

1. **Check Review Status**
   - Go to Play Console → App → Production
   - Monitor review status
   - Address any rejection reasons

2. **Crash Reports**
   - Set up Firebase Crashlytics or Sentry
   - Monitor crash rates
   - Fix critical issues quickly

3. **User Reviews**
   - Respond to user reviews
   - Address common issues
   - Update app based on feedback

### Updates

When releasing updates:

1. Increment version:
   - `versionCode` (always increment)
   - `versionName` (semantic versioning)

2. Build new AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. Upload to Play Console:
   - Create new release
   - Upload new AAB
   - Add release notes
   - Submit for review

## Troubleshooting

### Build Fails: "SDK location not found"

Set ANDROID_HOME:
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### Build Fails: "Keystore not found"

Ensure keystore exists:
```bash
# Check if keystore exists
Test-Path android/release-keystore.jks

# If not, create it (see Release Keystore Setup above)
```

### Build Fails: "Gradle sync failed"

```bash
cd android
./gradlew clean
./gradlew build
```

### AAB Too Large

Optimize assets:
- Compress images
- Remove unused assets
- Enable ProGuard/R8 code shrinking
- Use Android App Bundle (already using AAB)

### App Rejected: "Missing Privacy Policy"

Ensure privacy policy URL is:
- Accessible (no login required)
- Complete and accurate
- Linked in Play Console

## Support

For issues or questions:
- **Documentation**: See `docs/` folder
- **Build Issues**: Check `docs/TROUBLESHOOTING.md`
- **Play Console Help**: [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)

## Next Steps After Deployment

1. ✅ Monitor crash reports
2. ✅ Respond to user reviews
3. ✅ Plan feature updates
4. ✅ Monitor analytics
5. ✅ Prepare iOS version (if desired)

---

**Ready to deploy?** Run: `.\scripts\deploy-android-playstore.ps1`

