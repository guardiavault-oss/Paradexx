# GuardiaVault Mobile App - Enhanced Features

This document describes the enhanced mobile app with wallet connection and native features.

## 🚀 New Features

### 1. Wallet Connection (WalletConnect v2)
- **Multi-wallet support** via WalletConnect protocol
- **Secure session management** with automatic restoration
- **QR code scanning** for wallet pairing
- **Transaction signing** and message signing support

### 2. Native Biometric Authentication
- **Face ID** (iOS)
- **Touch ID** (iOS)
- **Fingerprint** (Android)
- **Secure authentication** for check-ins and sensitive operations

### 3. Push Notifications
- **Check-in reminders** before vault deadline
- **Vault warnings** when grace period is active
- **Vault activation alerts** when inheritance triggers
- **Recovery notifications** for beneficiaries

### 4. Navigation Structure
- **Bottom tab navigation** for main sections
- **Stack navigation** for detailed views
- **Modal screens** for wallet connection
- **Deep linking** support for wallet callbacks

## 📁 Project Structure

```
mobile/
├── services/
│   ├── walletService.ts          # WalletConnect integration
│   ├── biometricService.ts       # Face ID / Touch ID / Fingerprint
│   ├── notificationService.ts    # Push notifications
│   └── deepLinkingService.ts     # Deep link handling
├── screens/
│   ├── HomeScreen.tsx            # Main dashboard
│   ├── WalletConnectScreen.tsx   # Wallet connection UI
│   ├── CheckInScreen.tsx         # Vault check-in with biometric
│   ├── VaultStatusScreen.tsx     # Vault management
│   ├── SettingsScreen.tsx        # App settings
│   └── RecoveryScreen.tsx        # Recovery features
└── navigation/
    └── AppNavigator.tsx          # Navigation structure
```

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure WalletConnect

1. Get a WalletConnect Project ID from [cloud.reown.com](https://cloud.reown.com)
2. Add to your `.env` file:
   ```
   EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

### 3. Configure App Permissions

The app.json file includes necessary permissions for:
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Push notifications
- Camera (for QR code scanning)

### 4. Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 🔐 Security Features

### Secure Storage
- Wallet sessions stored in Expo SecureStore (encrypted)
- Private keys never stored (handled by wallet apps)
- Biometric data never leaves device

### Authentication Flow
1. User initiates action (check-in, transaction)
2. Biometric authentication requested
3. Wallet signature requested via WalletConnect
4. Transaction submitted to blockchain

## 📱 Usage

### Connecting a Wallet

1. Navigate to Settings or tap "Connect Wallet" on home screen
2. Tap "Connect Wallet" button
3. Authenticate with biometrics (if enabled)
4. Scan QR code with your wallet app (MetaMask, Trust Wallet, etc.)
5. Approve connection in wallet app

### Performing Check-In

1. Navigate to Check-In screen
2. Ensure wallet is connected
3. Tap "Check In" button
4. Authenticate with biometrics
5. Sign message in wallet app
6. Check-in confirmed!

### Enabling Notifications

1. Navigate to Settings
2. Toggle "Push Notifications" switch
3. Grant permissions when prompted
4. Receive reminders and alerts

## 🔗 Deep Linking

The app supports deep links for:
- Wallet callback URLs: `guardiavault://walletconnect/callback?sessionId=...`
- Direct navigation to specific screens
- Recovery process initiation

## 🧪 Testing

### Test Biometric Authentication
- iOS Simulator: Settings > Face ID & Passcode > Enroll Face ID
- Android Emulator: Settings > Security > Fingerprint

### Test Push Notifications
- Requires physical device (emulators don't support push)
- Test notification scheduling with local notifications

### Test Wallet Connection
- Install MetaMask or Trust Wallet on device
- Use WalletConnect flow to connect
- Test transaction signing

## 📋 Environment Variables

Required environment variables:
- `EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- `EXPO_PUBLIC_API_URL` - Backend API URL (default: http://localhost:5000)
- `EXPO_PUBLIC_CHAIN_ID` - Blockchain network ID (default: 11155111 for Sepolia)

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure WalletConnect Project ID is configured
- Check network connectivity
- Try disconnecting and reconnecting

### Biometric Authentication Not Working
- Verify biometrics are enrolled in device settings
- Check app permissions in device settings
- Ensure expo-local-authentication plugin is configured

### Notifications Not Received
- Verify notification permissions granted
- Check device notification settings
- Ensure Expo notifications plugin is configured

## 🚀 Production Build

### iOS
```bash
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [WalletConnect Docs](https://docs.walletconnect.com)
- [React Navigation](https://reactnavigation.org)
- [Expo Local Authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

