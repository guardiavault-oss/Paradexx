# Complete Google Play Store Deployment Guide

**Everything you need to deploy Paradox Wallet to Google Play Store**

## 🎯 Quick Start

**Fastest way to deploy:**

```powershell
# Run the automated deployment script
.\scripts\deploy-android-playstore.ps1
```

This script handles everything automatically!

## 📋 Prerequisites

### 1. Google Play Developer Account
- **Cost**: $25 one-time fee
- **Sign up**: https://play.google.com/console
- **Time**: 1-2 days for approval

### 2. Development Tools
- ✅ Node.js 20+ (you have v20.19.5)
- ✅ Android Studio
- ✅ Android SDK (API 33+)
- ✅ Java JDK (11+)

### 3. App Information
- **App Name**: Paradox Wallet
- **Package Name**: `io.paradox.wallet`
- **Version**: 1.0.0

## 🚀 Deployment Steps

### Step 1: Setup Android Project

```powershell
# Install Capacitor (if not done)
pnpm add -D @capacitor/core@7 @capacitor/cli@7 @capacitor/android@7

# Build web app
npm run build

# Add Android platform
npx cap add android

# Sync Capacitor
npx cap sync android
```

### Step 2: Create Release Keystore

**⚠️ CRITICAL**: Save this keystore securely! You'll need it for ALL future updates.

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

**Save passwords to `.env.local`**:
```
ANDROID_KEYSTORE_PASSWORD=your_store_password
ANDROID_KEY_PASSWORD=your_key_password
```

### Step 3: Build Release AAB

```bash
cd android
./gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 4: Google Play Console Setup

#### 4.1 Create App

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: **Paradox Wallet**
   - Default language: English (United States)
   - App or game: **App**
   - Free or paid: **Free**
   - Declarations: Accept terms

#### 4.2 Complete Store Listing

**Use content from**: `docs/PLAY_STORE_LISTING.md`

**Required fields**:
- ✅ App name: Paradox Wallet
- ✅ Short description (80 chars)
- ✅ Full description (4000 chars)
- ✅ App icon (512x512)
- ✅ Feature graphic (1024x500)
- ✅ Screenshots (min 2, max 8)
- ✅ Privacy Policy URL (REQUIRED)
- ✅ Support URL

#### 4.3 Content Rating

1. Complete questionnaire
2. Answer questions about:
   - Financial services: **Yes**
   - User-generated content: **No**
   - Location sharing: **Optional**
   - Sensitive content: **No**

**Expected Rating**: Everyone (with financial services warning)

#### 4.4 Data Safety

Complete Data Safety section:
- Data collection: Financial info, personal info, app activity
- Data sharing: With third parties (analytics)
- Security: Encrypted in transit and at rest

#### 4.5 Upload AAB

1. Go to "Production" → "Create new release"
2. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
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

#### 4.6 Submit for Review

1. Review all sections
2. Click "Submit for review"
3. Wait 1-3 days for Google review

## 📸 Required Assets

### App Icon
- **Size**: 512x512 pixels
- **Format**: PNG
- **Requirements**: No transparency, high quality

### Feature Graphic
- **Size**: 1024x500 pixels
- **Format**: PNG
- **Purpose**: Promotional banner

### Screenshots

**Phone Screenshots** (Required, 2-8):
- Dashboard/home screen
- Swap interface
- Security features
- DeFi tools
- AI assistant
- Multi-chain support

**Tablet Screenshots** (Optional):
- Same as phone but optimized for tablet

**Sizes**:
- Portrait: 1080x1920
- Landscape: 1920x1080

## 📝 Store Listing Content

**See**: `docs/PLAY_STORE_LISTING.md` for complete content including:
- App name
- Short description
- Full description
- Keywords
- Screenshot descriptions
- Release notes

## ✅ Pre-Submission Checklist

### Code
- [x] Build succeeds
- [x] No console.logs in production
- [x] Production API URLs set
- [x] Error handling implemented

### Security
- [x] No hardcoded secrets
- [x] Privacy policy accessible
- [x] SSL/TLS for APIs

### Functionality
- [x] Swaps working
- [x] Prices accurate
- [x] Trending coins displaying
- [x] All features tested

### Assets
- [ ] App icon created
- [ ] Feature graphic created
- [ ] Screenshots created
- [ ] Privacy policy published

### Play Console
- [ ] App created
- [ ] Store listing complete
- [ ] Content rating done
- [ ] Data safety completed
- [ ] AAB uploaded
- [ ] Release notes added

## 🎨 Creating Assets

### App Icon

If you have a source icon (`icon-source.png`):

```bash
node scripts/generate-icons.js
```

Or create manually:
1. Design 1024x1024 icon
2. Export as PNG
3. Place in `android/app/src/main/res/mipmap-*/` folders

### Screenshots

**Recommended tools**:
- Android Studio Emulator
- Real device screenshots
- Design tools (Figma, etc.)

**Screenshot locations**:
- Dashboard: `src/components/DashboardNew.tsx`
- Swap: `src/components/SwapPageEnhanced.tsx`
- Security: `src/components/features/WalletGuard.tsx`

## 🐛 Troubleshooting

### Build Fails: "SDK location not found"

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### Build Fails: "Keystore not found"

Create keystore (see Step 2 above)

### AAB Too Large

- Enable ProGuard/R8
- Compress images
- Remove unused assets
- Use code splitting

### App Rejected: "Missing Privacy Policy"

Ensure privacy policy is:
- Publicly accessible (no login)
- Complete and accurate
- Linked in Play Console

## 📊 Post-Deployment

### Monitoring

1. **Crash Reports**
   - Set up Firebase Crashlytics
   - Monitor crash rates
   - Fix critical issues

2. **Analytics**
   - Google Analytics
   - User behavior tracking
   - Feature usage

3. **Reviews**
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
   - Upload AAB
   - Add release notes
   - Submit for review

## 📚 Documentation Files

- **Deployment Guide**: `docs/GOOGLE_PLAY_STORE_DEPLOYMENT.md`
- **Store Listing**: `docs/PLAY_STORE_LISTING.md`
- **Quick Start**: `docs/ANDROID_DEPLOYMENT_QUICK_START.md`
- **Checklist**: `docs/GOOGLE_PLAY_DEPLOYMENT_CHECKLIST.md`
- **Build Guide**: `docs/guides/MOBILE_BUILD_GUIDE.md`

## 🎉 Success!

Once approved, your app will be live on Google Play Store!

**App URL**: `https://play.google.com/store/apps/details?id=io.paradox.wallet`

---

**Ready?** Run: `.\scripts\deploy-android-playstore.ps1`

