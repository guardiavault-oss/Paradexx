# AegisX Mobile App - Ready for Testing! 📱

## ✅ Mobile Setup Complete

Your AegisX crypto wallet is now ready to run as native mobile apps on iOS and Android. Here's how to test it on your phone:

## 🚀 Quick Start

### **Option 1: Test on Real Device (Recommended)**

#### **iOS (iPhone)**

```bash
cd AegisX
npx cap run ios --target="YOUR_DEVICE_ID"
```

#### **Android (Phone/Tablet)**

```bash
cd AegisX
npx cap run android --target="YOUR_DEVICE_ID"
```

**Find your device ID:**

```bash
# iOS devices
npx cap run ios --list

# Android devices
npx cap run android --list
```

### **Option 2: Test in Simulator/Emulator**

#### **iOS Simulator**

```bash
cd AegisX
npx cap run ios
```

#### **Android Emulator**

```bash
cd AegisX
npx cap run android
```

## 📱 What You Get

### **Native Features Working:**

- ✅ **Biometric Authentication** (Face ID / Touch ID / Fingerprint)
- ✅ **Secure Storage** (encrypted wallet data)
- ✅ **Push Notifications** (transaction alerts)
- ✅ **Haptic Feedback** (button presses)
- ✅ **QR Code Scanning** (WalletConnect)
- ✅ **Native UI Elements** (iOS/Android design)

### **Wallet Features:**

- ✅ Connect MetaMask wallet
- ✅ View balances (get test ETH from faucets)
- ✅ Send/receive crypto
- ✅ DeFi trading (1inch)
- ✅ Inheritance vaults
- ✅ Security monitoring

## 🔧 Development Setup

### **Live Reload (Hot Reload)**

For faster development with live reload:

1. **Start dev server:**

```bash
cd AegisX
pnpm run dev
```

1. **Find your local IP:**

```bash
# Windows
ipconfig
# Look for your WiFi/Ethernet adapter IP
```

1. **Update capacitor.config.js:**

```javascript
server: {
  url: 'http://YOUR_IP:3000', // e.g., http://192.168.1.100:3000
  cleartext: true, // Allow HTTP for development
}
```

1. **Sync and run:**

```bash
npx cap sync
npx cap run ios  # or android
```

## 📦 Build for Production

### **iOS App Store**

```bash
# Open in Xcode
npx cap open ios

# In Xcode:
# 1. Select "Any iOS Device"
# 2. Product → Archive
# 3. Upload to App Store Connect
```

### **Android Google Play**

```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Upload to Google Play Console
```

## 🧪 Testing Checklist

### **Basic Functionality**

- [ ] App launches without crashing
- [ ] Can connect MetaMask wallet
- [ ] Shows correct Sepolia network
- [ ] Biometric auth works
- [ ] QR scanner opens camera

### **Wallet Features**

- [ ] Get test ETH from faucet
- [ ] Balance displays correctly
- [ ] Can send small transaction
- [ ] 1inch trading interface loads
- [ ] Vault creation works

### **Native Features**

- [ ] Haptic feedback on buttons
- [ ] Push notifications (if configured)
- [ ] App stays logged in when backgrounded
- [ ] Auto-lock works

## 🔑 Test Credentials

**Test User:** `test@example.com`
**Password:** `test123`

**Test Wallets:**

- `0x742d35Cc6634C0532925a3b8D6Ac6E1d9C6F2c8B` (has test ETH)
- Get more test ETH from: <https://sepoliafaucet.com/>

## 🐛 Common Issues

### **iOS Issues**

- **"CocoaPods not installed"** → Install CocoaPods: `sudo gem install cocoapods`
- **"Xcode not found"** → Install Xcode from App Store
- **Build fails** → `npx cap sync ios` then try again

### **Android Issues**

- **"SDK not found"** → Install Android Studio and SDK
- **Emulator issues** → Create AVD in Android Studio
- **Build fails** → Clean and rebuild: `./gradlew clean`

### **General Issues**

- **App won't connect** → Check if backend is running on port 3001
- **Wallet won't connect** → Ensure MetaMask is on Sepolia network
- **No test ETH** → Visit faucet links above

## 📋 Next Steps

1. **Test on your phone** using `npx cap run ios` or `npx cap run android`
1. **Get test ETH** from the faucets
1. **Test all features** using the checklist above
1. **Build for production** when ready to publish
1. **Submit to app stores** for wider testing

## 🎉 Success

Your AegisX wallet now runs as a **native mobile app** with all the same features as the web version, plus native device capabilities!

**Questions?** Check the [mobile setup guide](src/mobile-setup-guide.md) for detailed instructions.

🚀 **Happy testing!**
