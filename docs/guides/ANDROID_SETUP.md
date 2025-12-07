# Android Development Setup Guide

## 🚨 Android SDK Missing Error

The error `ERR_SDK_NOT_FOUND: No valid Android SDK root found` means Android Studio and the Android SDK are not installed on your system.

## 📥 Installation Steps

### Step 1: Download Android Studio

1. Go to: <https://developer.android.com/studio>
2. Download the latest version for Windows
3. Run the installer and follow the setup wizard

### Step 2: Install Android SDK

During Android Studio installation:

- ✅ Check "Android SDK"
- ✅ Check "Android SDK Platform"
- ✅ Check "Android Virtual Device" (for emulator)

### Step 3: Set Environment Variables

After installation, set these environment variables:

```cmd
# Add to your System Environment Variables:
ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
PATH = %PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin
```

### Step 4: Install SDK Components

1. Open Android Studio
2. Go to **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
3. Install these components:
   - ✅ SDK Platforms: Android 13.0 (API 33)
   - ✅ SDK Tools: Android SDK Build-Tools, Android Emulator, Android SDK Platform-Tools
   - ✅ SDK Tools: Android SDK Command-line Tools

### Step 5: Create Android Virtual Device (AVD)

1. In Android Studio: **Tools** → **Device Manager**
2. Click **Create device**
3. Choose a device (e.g., Pixel 7)
4. Select system image (API 33, Android 13)
5. Complete setup

### Step 6: Verify Installation

```cmd
# Check if SDK is found
npx cap run android --list

# Should show something like:
# Available android targets:
#   - Pixel_7_API_33 (emulator)
```

## 🔧 Alternative: Use Android Emulator Only

If you don't want to install the full Android Studio:

1. Download Android Studio (required for SDK)
2. Create AVD as above
3. Use emulator: `npx cap run android --target="Pixel_7_API_33"`

## 📱 Test Your Mobile App

Once SDK is set up:

```bash
# List available devices
npx cap run android --list

# Run on specific device/emulator
npx cap run android --target="YOUR_DEVICE_ID"

# Or run on emulator
npx cap run android
```

## 🆘 Troubleshooting

### "Android SDK not found" persists

```cmd
# Check environment variables
echo %ANDROID_HOME%
echo %JAVA_HOME%

# Verify SDK location exists
dir "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
```

### Emulator won't start

- Ensure virtualization is enabled in BIOS
- Try different AVD configuration
- Check for sufficient RAM/disk space

### Build fails

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

## ✅ Success Check

After setup, you should be able to:

- ✅ List Android devices: `npx cap run android --list`
- ✅ Run app on device: `npx cap run android --target="device_id"`
- ✅ Open in Android Studio: `npx cap open android`

## 📞 Need Help?

If you encounter issues:

1. Verify Android Studio installation
2. Check environment variables
3. Ensure AVD is created and working
4. Try restarting your computer

Once Android SDK is properly installed, you'll be able to test your AegisX mobile app! 🚀📱
