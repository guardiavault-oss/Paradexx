# Build AAB File - Instructions

## ⚠️ Java/JDK Required

Building Android AAB requires Java JDK. Here are your options:

## Option 1: Build in Android Studio (Easiest)

### Steps:

1. **Open Android Studio**
   - If not installed: Download from https://developer.android.com/studio

2. **Open Project**
   - File → Open
   - Select: `C:\Users\ADMIN\Desktop\paradexwallet\android`
   - Wait for Gradle sync

3. **Build Release AAB**
   - Build → Generate Signed Bundle / APK
   - Select: **Android App Bundle**
   - Click Next

4. **Select Keystore**
   - Keystore: `android\release-keystore.jks`
   - Key alias: `paradox`
   - Enter passwords (from `.env.local` or your saved passwords)

5. **Build**
   - Click Finish
   - Wait for build to complete

6. **Output**
   - Location: `android\app\build\outputs\bundle\release\app-release.aab`
   - Package name: `com.paradex.wallet` ✅

## Option 2: Set JAVA_HOME and Use Gradle CLI

### Find Java Location

**If Android Studio is installed:**
```
C:\Program Files\Android\Android Studio\jbr
```

**Or check:**
```
C:\Program Files\Java\jdk-XX
```

### Set JAVA_HOME (PowerShell)

```powershell
# Find Java location first
$javaPath = "C:\Program Files\Android\Android Studio\jbr"
# Or: $javaPath = "C:\Program Files\Java\jdk-XX"

# Set JAVA_HOME
$env:JAVA_HOME = $javaPath
$env:PATH = "$javaPath\bin;$env:PATH"

# Verify
java -version
```

### Build AAB

```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

## Option 3: Use Android Studio Terminal

1. Open Android Studio
2. Open project: `android` folder
3. Open Terminal (bottom panel)
4. Run:
   ```bash
   .\gradlew bundleRelease
   ```
   (JAVA_HOME is already set in Android Studio terminal)

## ✅ Verify Build

After build completes:

```powershell
# Check if AAB exists
Test-Path "android\app\build\outputs\bundle\release\app-release.aab"

# Get file info
Get-Item "android\app\build\outputs\bundle\release\app-release.aab" | 
  Select-Object Name, Length, LastWriteTime
```

## 📦 Package Name

**New Package Name**: `com.paradex.wallet`

This AAB will have the correct package name for Google Play Store.

## 🚀 Upload to Play Store

After building:

1. Go to https://play.google.com/console
2. Create NEW app (package name: `com.paradex.wallet`)
3. Upload AAB file
4. Complete store listing
5. Submit for review

---

**Recommended**: Use Android Studio (Option 1) - it's the easiest!

