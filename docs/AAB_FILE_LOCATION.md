# Android App Bundle (AAB) Location

## 📦 AAB File Location

**Path**: `android/app/build/outputs/bundle/release/app-release.aab`

**Full Path**: `C:\Users\ADMIN\Desktop\paradexwallet\android\app\build\outputs\bundle\release\app-release.aab`

## 📋 File Information

This is the **Android App Bundle (AAB)** file ready for Google Play Store submission.

### File Details
- **Format**: Android App Bundle (.aab)
- **Type**: Release build (signed for production)
- **Purpose**: Upload to Google Play Console

## 🚀 How to Build AAB (if needed)

If the AAB file doesn't exist or you need to rebuild:

### Step 1: Ensure Release Keystore Exists

```bash
cd android
keytool -genkey -v -keystore release-keystore.jks \
  -alias paradox \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Step 2: Build Release AAB

```bash
cd android
.\gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

## 📤 Upload to Google Play Store

1. Go to https://play.google.com/console
2. Select your app (or create new)
3. Go to **Production** → **Create new release**
4. Click **Upload** and select:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
5. Add release notes
6. Submit for review

## ✅ Verify AAB File

Check if AAB exists and is valid:

```powershell
# Check if file exists
Test-Path "android\app\build\outputs\bundle\release\app-release.aab"

# Get file info
Get-Item "android\app\build\outputs\bundle\release\app-release.aab" | 
  Select-Object Name, Length, LastWriteTime
```

## 📁 Alternative Locations

If AAB is not in the expected location, check:

1. **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
2. **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`
3. **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab` ✅

## 🔄 Rebuild AAB

If you need to rebuild:

```bash
# 1. Clean previous builds
cd android
.\gradlew clean

# 2. Build new AAB
.\gradlew bundleRelease

# 3. Verify
Test-Path "app\build\outputs\bundle\release\app-release.aab"
```

## 📝 Notes

- **AAB vs APK**: AAB is required for Play Store, APK is for direct installation
- **File Size**: AAB files are typically 20-100MB
- **Signing**: AAB must be signed with release keystore
- **Version**: Check version in `android/app/build.gradle`

---

**Quick Access**: The AAB file is at `android/app/build/outputs/bundle/release/app-release.aab`

