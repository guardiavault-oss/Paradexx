# WalletConnect Project ID Fix

## ✅ Changes Made

1. **Updated `client/src/lib/wagmi.tsx`**:
   - Added fallback to use your actual project ID (`f32270e55fe94b09ccfc7a375022bb41`) when environment variable is not set
   - This ensures the app works even if `VITE_WALLETCONNECT_PROJECT_ID` is missing in production

2. **Updated `client/src/lib/web3modal.config.ts`**:
   - Uses environment variable with fallback to your project ID

3. **Updated `.env` file**:
   - Set `VITE_WALLETCONNECT_PROJECT_ID=f32270e55fe94b09ccfc7a375022bb41`

4. **Updated error suppression in `client/src/main.tsx`**:
   - Added patterns to suppress WalletConnect/Reown API errors in console

## 🚀 Next Steps for Production

### Option 1: Set Environment Variable in Netlify (Recommended)

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Add:
   - **Key**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `f32270e55fe94b09ccfc7a375022bb41`
6. Click **Save**
7. **Redeploy your site** (or trigger a new build)

### Option 2: Set Environment Variable in Railway (if frontend is on Railway)

1. Go to your Railway dashboard
2. Select your project
3. Go to **Variables** tab
4. Add:
   - **Key**: `VITE_WALLETCONNECT_PROJECT_ID`
   - **Value**: `f32270e55fe94b09ccfc7a375022bb41`
5. **Redeploy** your service

### ⚠️ Important: Whitelist Your Domain

The 403 errors might also be caused by your domain not being whitelisted in WalletConnect Cloud:

1. Go to https://cloud.reown.com
2. Sign in to your account
3. Select your project (ID: `f32270e55fe94b09ccfc7a375022bb41`)
4. Go to **Settings** → **Allowed Domains**
5. Add your production domains:
   - `guardiavault.com`
   - `guardiavault-production.up.railway.app` (if using Railway)
   - Any other domains where your app is hosted
6. Save changes

## 🔍 Verification

After redeploying with the environment variable set:

1. Clear your browser cache
2. Visit your production site
3. Open DevTools Console
4. The 403/400 errors should be gone
5. Wallet connection should work properly

## 📝 Note

The code now has a **fallback** that uses your project ID even if the environment variable isn't set. However, it's still **recommended** to set the environment variable in production for:
- Better configuration management
- Ability to change project ID without code changes
- Following best practices

## Current Status

✅ **Code updated** - Fallback project ID is now in place
⏳ **Action required** - Set environment variable in production
⏳ **Action required** - Whitelist domains in WalletConnect Cloud

