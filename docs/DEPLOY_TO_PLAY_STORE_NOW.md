# Deploy to Google Play Store - Step by Step

**Ready to deploy? Follow these steps:**

## ✅ Current Status

- ✅ **Web app builds successfully**
- ✅ **Android platform added**
- ✅ **Capacitor synced**
- ✅ **Build configuration ready**

## 🚀 Deployment Steps

### Step 1: Build Web App (Already Done ✅)

```bash
npm run build
```

✅ **Status**: Already built (dist folder exists)

### Step 2: Sync Capacitor

```bash
npx cap sync android
```

✅ **Status**: Already synced

### Step 3: Create Release Keystore

**⚠️ IMPORTANT**: Do this ONCE and save securely!

```bash
cd android
keytool -genkey -v -keystore release-keystore.jks ^
  -alias paradox ^
  -keyalg RSA ^
  -keysize 2048 ^
  -validity 10000
```

**When prompted**:
- Enter keystore password (remember this!)
- Enter key password (can be same)
- Fill in your details

**Save passwords** to `.env.local`:
```
ANDROID_KEYSTORE_PASSWORD=your_password_here
ANDROID_KEY_PASSWORD=your_password_here
```

### Step 4: Build Release AAB

```bash
cd android
.\gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 5: Google Play Console Setup

#### 5.1 Create Developer Account
- Go to: https://play.google.com/console
- Pay $25 one-time fee
- Wait for approval (1-2 days)

#### 5.2 Create App
1. Click "Create app"
2. Fill in:
   - **App name**: Paradox Wallet
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

#### 5.3 Complete Store Listing

**Use content from**: `docs/PLAY_STORE_LISTING.md`

**Required**:
- ✅ App name: Paradox Wallet
- ✅ Short description (80 chars)
- ✅ Full description (4000 chars)
- ✅ App icon (512x512 PNG)
- ✅ Feature graphic (1024x500 PNG)
- ✅ Screenshots (min 2, max 8)
- ✅ Privacy Policy URL (REQUIRED)
- ✅ Support URL

#### 5.4 Content Rating
- Complete questionnaire
- Rating: Everyone (with financial services)

#### 5.5 Data Safety
- Declare data collection
- Declare data sharing
- Security practices

#### 5.6 Upload AAB
1. Go to "Production" → "Create new release"
2. Upload: `android/app/build/outputs/bundle/release/app-release.aab`
3. Add release notes (see `docs/PLAY_STORE_LISTING.md`)
4. Submit for review

## 📋 Quick Command Reference

```bash
# 1. Build web app
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Create keystore (first time only)
cd android
keytool -genkey -v -keystore release-keystore.jks -alias paradox -keyalg RSA -keysize 2048 -validity 10000

# 4. Build AAB
.\gradlew bundleRelease

# 5. Upload to Play Console
# Go to https://play.google.com/console and upload the AAB file
```

## 📁 File Locations

- **AAB File**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Keystore**: `android/release-keystore.jks` (keep secure!)
- **Store Listing**: `docs/PLAY_STORE_LISTING.md`
- **Deployment Guide**: `docs/GOOGLE_PLAY_STORE_DEPLOYMENT.md`

## 🎨 Required Assets

Before submitting, create:

1. **App Icon**: 512x512 PNG
   - Place source icon as `icon-source.png`
   - Run: `node scripts/generate-icons.js`

2. **Feature Graphic**: 1024x500 PNG
   - Promotional banner for Play Store

3. **Screenshots**: 
   - Phone: 2-8 screenshots (1080x1920 or 1920x1080)
   - Tablet: Optional

4. **Privacy Policy**: 
   - Must be publicly accessible
   - URL required in Play Console

## ⚠️ Important Notes

1. **Keystore**: Save securely! You'll need it for ALL future updates
2. **Passwords**: Save keystore passwords securely
3. **Privacy Policy**: Must be accessible before submission
4. **Review Time**: Google review takes 1-3 days
5. **First Submission**: May take longer for initial review

## 🆘 Troubleshooting

### "SDK location not found"
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### "Gradle build failed"
```bash
cd android
.\gradlew clean
.\gradlew bundleRelease
```

### "Keystore not found"
Create keystore (see Step 3 above)

## 📞 Support

- **Documentation**: See `docs/` folder
- **Store Listing**: `docs/PLAY_STORE_LISTING.md`
- **Deployment Guide**: `docs/GOOGLE_PLAY_STORE_DEPLOYMENT.md`

---

## 🎯 Next Action

**Ready to build?** Run these commands:

```bash
# 1. Create keystore (if not exists)
cd android
keytool -genkey -v -keystore release-keystore.jks -alias paradox -keyalg RSA -keysize 2048 -validity 10000

# 2. Build AAB
.\gradlew bundleRelease

# 3. Upload to Play Console
# Go to https://play.google.com/console
```

**Your AAB will be at**: `android/app/build/outputs/bundle/release/app-release.aab`

