# AegisX iOS Build Guide

This guide covers building and releasing the AegisX wallet app for iOS/App Store.

## Prerequisites

- macOS (Monterey 12.0 or later)
- Xcode 14 or later
- Apple Developer Account ($99/year)
- Node.js 18+ and npm
- CocoaPods (`sudo gem install cocoapods`)

## Build Process

### Step 1: Prepare the Web Build

```bash
# Install dependencies
npm install

# Build the web app
npm run build

# Sync with iOS
npx cap sync ios
```

### Step 2: Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

### Step 3: Open in Xcode

```bash
npx cap open ios
```

This will open the iOS project in Xcode.

### Step 4: Configure Signing

1. In Xcode, select the "App" target
2. Go to "Signing & Capabilities" tab
3. Set your Team (Apple Developer account)
4. Set Bundle Identifier: `com.regenx.wallet`
5. Enable "Automatically manage signing"

### Step 5: Configure App Capabilities

Add these capabilities in Xcode:
- Face ID (for biometric auth)
- Push Notifications (optional)
- Background Modes (optional, for notifications)

### Step 6: Build for Release

1. In Xcode, select "Any iOS Device" as the destination
2. Go to Product > Archive
3. Once archived, click "Distribute App"
4. Choose "App Store Connect" for App Store distribution
5. Follow the upload wizard

## App Store Submission

### App Store Connect Setup

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "My Apps" > "+" > "New App"
3. Fill in:
   - Platform: iOS
   - Name: AegisX Wallet
   - Primary Language: English (US)
   - Bundle ID: com.regenx.wallet
   - SKU: AEGISX-WALLET-001

### Required Assets

| Asset | Size | Format |
|-------|------|--------|
| App Icon | 1024x1024 | PNG (no alpha) |
| iPhone Screenshots | 1290x2796 (6.7"), 1284x2778 (6.5") | PNG/JPEG |
| iPad Screenshots (optional) | 2048x2732 | PNG/JPEG |
| App Preview Videos (optional) | 1920x886 or similar | MOV/MP4 |

### Required Screenshots (minimum)

- iPhone 6.7" Display (2 screenshots minimum)
- iPhone 6.5" Display (2 screenshots minimum)

### App Information

**App Name:** AegisX Wallet

**Subtitle (30 chars):** Secure Crypto & Inheritance

**Keywords (100 chars):**
```
crypto,wallet,web3,inheritance,defi,ethereum,trading,security,guardian,blockchain
```

**Description:**
```
AegisX Wallet combines advanced crypto trading with robust digital legacy management.

KEY FEATURES:

DegenX Trading Platform:
• MEV protection against front-running
• Sniper bot for new token launches
• Cross-chain bridging across major networks
• Real-time whale tracking
• Advanced security scanning

GuardianX Inheritance System:
• Seedless wallet recovery with guardians
• Inheritance vaults with beneficiary management
• Smart will templates
• Secure legacy messages (text & video)

Security Features:
• Face ID & Touch ID authentication
• Wallet Guard monitoring
• Honeypot detection
• Rug pull protection
• Real-time threat alerts

SUBSCRIPTION TIERS:
• Free: Basic wallet features
• Pro ($9.99/month): MEV protection, wallet guard, security scans
• Inheritance Essential ($149 one-time): Basic vault
• Inheritance Premium ($299 one-time): Advanced legacy tools

Take control of your digital assets and legacy with AegisX.
```

### Privacy Information

**Privacy Policy URL:** https://guardiavault.com/privacy

**Data Collection:**
- Email Address (Account Features)
- Wallet Addresses (App Functionality)
- Device ID (Analytics)
- Biometric Data (Authentication, stored on device only)

### App Review Notes

```
Test Account:
Email: test@example.com
Password: test123456

This app is a crypto wallet that allows users to:
1. Store and manage cryptocurrency
2. Trade tokens across multiple chains
3. Set up inheritance vaults for beneficiaries

No real cryptocurrency is needed for testing - the app connects to test networks.
```

## Info.plist Configuration

Ensure these are set in `ios/App/App/Info.plist`:

```xml
<key>NSFaceIDUsageDescription</key>
<string>AegisX uses Face ID to secure your wallet access</string>

<key>NSCameraUsageDescription</key>
<string>AegisX needs camera access to scan QR codes and record legacy videos</string>

<key>CFBundleDisplayName</key>
<string>AegisX</string>

<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

## Version Management

Update these for each release:

1. **Xcode Project:**
   - Version (e.g., 1.0.0)
   - Build (increment for each submission)

2. **package.json:**
   - `version` field

## TestFlight Distribution

For beta testing before App Store release:

1. Archive the app in Xcode
2. Upload to App Store Connect
3. In App Store Connect:
   - Go to TestFlight
   - Add internal/external testers
   - Send invites

## Troubleshooting

### Build Errors

**CocoaPods issues:**
```bash
cd ios/App
pod deintegrate
pod install
```

**Signing issues:**
- Ensure your Apple Developer account is properly configured
- Check that the Bundle ID matches

**"No provisioning profile" error:**
- Enable "Automatically manage signing" in Xcode
- Make sure you're logged into your Apple Developer account

### Common Rejections

1. **Incomplete metadata** - Fill all required fields
2. **Missing privacy policy** - Add valid privacy policy URL
3. **Crash on launch** - Test on real device before submission
4. **Insufficient demo account** - Provide working test credentials
5. **Crypto compliance** - May require export compliance documentation

## CI/CD with Fastlane (Optional)

For automated builds, install Fastlane:

```bash
gem install fastlane
cd ios
fastlane init
```

Example `Fastfile`:

```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number
    build_app(
      scheme: "App",
      export_method: "app-store"
    )
    upload_to_testflight
  end
end
```

## Security Notes

- Never commit certificates or provisioning profiles
- Use Apple's automatic signing when possible
- Rotate signing certificates annually
- Keep your Apple Developer account credentials secure
