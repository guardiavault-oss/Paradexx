# Build AAB with Java Setup

## ✅ Java/JDK Downloaded

Now you need to set up JAVA_HOME and build the AAB.

## 🔍 Step 1: Find Java Installation

Java is usually installed in one of these locations:

- `C:\Program Files\Java\jdk-XX`
- `C:\Program Files\Eclipse Adoptium\jdk-XX`
- `C:\Program Files\Eclipse Foundation\jdk-XX`
- `C:\Program Files\Android\Android Studio\jbr`

**To find it:**
1. Open File Explorer
2. Go to `C:\Program Files`
3. Look for folders containing "java", "jdk", or "adoptium"
4. Inside should be a `bin` folder with `java.exe`

## ⚙️ Step 2: Set JAVA_HOME

Open PowerShell and run:

```powershell
# Replace with your actual Java path
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
# Or: $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21"

# Add Java to PATH
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Verify Java works
java -version
```

You should see Java version info.

## 🔨 Step 3: Build AAB

```powershell
cd android
.\gradlew clean
.\gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

## 📦 Step 4: Verify AAB

```powershell
# Check if AAB exists
Test-Path "android\app\build\outputs\bundle\release\app-release.aab"

# Get file info
$file = Get-Item "android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "Size: $([math]::Round($file.Length / 1MB, 2)) MB"
Write-Host "Package: com.paradex.wallet"
```

## 🚀 Quick Build Script

If you know your Java path, you can run:

```powershell
# Set Java (replace with your path)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Build
cd android
.\gradlew clean
.\gradlew bundleRelease
```

## 📤 Upload to Play Store

After build completes:

1. Go to https://play.google.com/console
2. Create NEW app
3. Package name: `com.paradex.wallet`
4. Upload AAB file

---

**Need help finding Java?** Run: `.\scripts\find-and-setup-java.ps1`
