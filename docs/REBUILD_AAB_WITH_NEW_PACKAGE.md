# Rebuild AAB with New Package Name

## ✅ Package Name Updated

**New Package Name**: `com.paradex.wallet`

All configuration files have been updated. Now you need to rebuild the AAB file.

## 🔨 Rebuild Steps

### Step 1: Clean Previous Build

```bash
cd android
.\gradlew clean
```

### Step 2: Build New Release AAB

```bash
.\gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

### Step 3: Verify Package Name

The new AAB will have package name: `com.paradex.wallet`

## 📤 Upload to Google Play Store

### Important: Create NEW App

⚠️ **You must create a NEW app** in Google Play Console because:
- Package names cannot be changed for existing apps
- `com.paradex.wallet` is different from `io.paradox.wallet`

### Steps:

1. Go to https://play.google.com/console
2. Click **"Create app"**
3. Fill in:
   - **App name**: Paradox Wallet (or Paradex Wallet)
   - **Package name**: `com.paradex.wallet` ✅
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
4. Upload the new AAB file
5. Complete store listing
6. Submit for review

## ✅ Files Updated

- ✅ `capacitor.config.ts` → `com.paradex.wallet`
- ✅ `android/app/build.gradle` → `com.paradex.wallet`
- ✅ `android/app/src/main/java/com/paradex/wallet/MainActivity.java` → `com.paradex.wallet`
- ✅ `android/app/src/main/assets/capacitor.config.json` → `com.paradex.wallet`

## 🚀 Quick Command

```bash
cd android
.\gradlew clean
.\gradlew bundleRelease
```

Then upload: `android/app/build/outputs/bundle/release/app-release.aab`

---

**New Package Name**: `com.paradex.wallet`  
**Ready to rebuild!**

