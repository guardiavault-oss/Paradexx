# Mobile App Troubleshooting Guide

## Common Issues and Solutions

### 1. "Something went wrong" when scanning QR code

**Problem**: The app crashes when loading in Expo Go.

**Solutions**:

#### A. API URL Issue (Most Common)
The app is trying to connect to `http://localhost:5000`, which won't work on your phone. You need to use your computer's IP address.

**Fix**:
1. Find your computer's IP address:
   - Windows: Open PowerShell and run `ipconfig`
   - Look for "IPv4 Address" under your active network adapter
   - Example: `192.168.1.100`

2. Update `mobile/app.json`:
   ```json
   "extra": {
     "apiUrl": "http://192.168.1.100:5000"
   }
   ```

3. Make sure your backend server is running and accessible:
   ```bash
   npm run dev
   ```

4. Restart Expo:
   ```bash
   cd mobile
   npm start
   # Press 'r' to reload
   ```

#### B. Network Connection
- Make sure your phone and computer are on the same Wi-Fi network
- Try using tunnel mode: `npx expo start --tunnel`
- Check firewall settings on your computer

#### C. Check Console Logs
Look at the terminal where you ran `npm start` - it will show the actual error message.

### 2. Metro Bundler Errors

**Problem**: Metro can't find modules or has path resolution issues.

**Solution**: 
- Clear cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### 3. Authentication Not Working

**Problem**: Can't login or signup.

**Solutions**:
- Check that backend is running on the correct port
- Verify API URL in `app.json` matches your backend
- Check backend CORS settings allow your phone's IP
- Look at network tab in Expo Go for API errors

### 4. Import Errors

**Problem**: "Cannot find module" errors.

**Solution**:
- Make sure `metro.config.js` exists and is configured correctly
- Check that all dependencies are installed: `npm install`
- Restart Metro bundler: `npx expo start -c`

## Quick Fixes

### Clear Everything and Reinstall
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start -c
```

### Check Backend is Running
```bash
# In project root
npm run dev
# Should see: Server running on http://localhost:5000
```

### Update API URL for Your Network
1. Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update `mobile/app.json` with your IP
3. Restart Expo

## Getting More Information

### Enable Debug Logging
The app logs errors to console. Check:
- Terminal where `npm start` is running
- Expo Go app logs (shake device → "Show Dev Menu" → "Debug Remote JS")

### Check Network Requests
In Expo Go:
1. Shake device
2. "Show Dev Menu"
3. "Debug Remote JS"
4. Open browser DevTools to see network requests

## Still Having Issues?

1. Check the terminal output when scanning QR code
2. Look for specific error messages
3. Verify backend is accessible from your phone's browser: `http://YOUR_IP:5000/api/auth/me`

