# GuardiaVault Mobile App

React Native mobile application for GuardiaVault digital inheritance platform.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure API URL:**
   
   Update `app.json` with your computer's IP address:
   ```json
   "extra": {
     "apiUrl": "http://YOUR_IP_ADDRESS:5000"
   }
   ```
   
   To find your IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Scan QR code with Expo Go:**
   - Install Expo Go app on your phone
   - Scan the QR code shown in the terminal
   - Make sure your phone and computer are on the same Wi-Fi network

## Troubleshooting

### "Something went wrong" when scanning QR code

1. **Check API URL:**
   - Make sure `app.json` has your computer's IP address (not `localhost`)
   - Verify your backend is running: `npm run dev` (in project root)

2. **Check network:**
   - Phone and computer must be on the same Wi-Fi network
   - Try tunnel mode: `npx expo start --tunnel`

3. **Clear cache:**
   ```bash
   npx expo start --clear
   ```

### Metro bundler errors

If you see Metro errors:
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

### Backend connection issues

1. **Verify backend is running:**
   ```bash
   # In project root
   npm run dev
   ```

2. **Test API from phone browser:**
   Open `http://YOUR_IP:5000/health` in your phone's browser

3. **Check CORS settings:**
   The backend should allow requests from mobile apps. In development, this is automatic.

## Features

- ✅ Authentication (Login/Signup)
- ✅ Dashboard with real-time data
- ✅ Vault management
- ✅ Guardian management
- ✅ Beneficiary management
- ✅ Check-in system
- ✅ Recovery process
- ✅ Notifications
- ✅ Biometric authentication

## Development

### Running on different platforms

- **iOS Simulator:** `npm run ios`
- **Android Emulator:** `npm run android`
- **Web:** `npm run web`

### Project Structure

```
mobile/
├── screens/          # Screen components
├── navigation/      # Navigation setup
├── contexts/        # React contexts (Auth, etc.)
├── services/        # API client, services
├── components/      # Reusable components
└── app.json         # Expo configuration
```

## API Configuration

The mobile app connects to the backend API. Make sure:

1. Backend is running on port 5000
2. `app.json` has the correct API URL
3. Backend CORS allows mobile requests (automatic in development)

## Notes

- The app uses `@react-native-async-storage` for local storage
- Authentication tokens are stored securely
- API client handles both token-based and session-based auth
- Error boundaries catch and display errors gracefully
