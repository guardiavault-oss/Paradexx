# Netlify Deployment Guide for GuardiaVault Frontend

This guide walks you through deploying the GuardiaVault React frontend to Netlify.

## Prerequisites

1. A Netlify account ([sign up here](https://app.netlify.com/signup))
2. Your Railway backend deployed (see `RAILWAY_DEPLOYMENT.md`)
3. Your Railway backend URL (e.g., `https://your-app.up.railway.app`)

## Quick Start

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize your site**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Give it a name (e.g., `guardiavault`)
   - Choose your team
   - Set build command: `npm run build`
   - Set publish directory: `dist/public`

4. **Update netlify.toml** with your Railway backend URL
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://YOUR_RAILWAY_APP.up.railway.app/api/:splat"
     status = 200
     force = true
   ```

5. **Set environment variables in Netlify**
   ```bash
   netlify env:set VITE_GUARDIA_VAULT_ADDRESS=0x...
   netlify env:set VITE_CHAIN_ID=11155111
   netlify env:set VITE_SEPOLIA_RPC_URL=https://...
   netlify env:set VITE_WALLETCONNECT_PROJECT_ID=your-project-id
   netlify env:set VITE_SENTRY_DSN=your-sentry-dsn
   ```
   Or set them in the Netlify dashboard under Site settings > Environment variables

6. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via Git (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect your Git provider
   - Select your repository

3. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist/public`
   - Node version: `20`

4. **Set environment variables**
   Go to Site settings > Environment variables and add:
   ```
   VITE_GUARDIA_VAULT_ADDRESS=0x...
   VITE_CHAIN_ID=11155111
   VITE_SEPOLIA_RPC_URL=https://...
   VITE_WALLETCONNECT_PROJECT_ID=your-project-id
   VITE_SENTRY_DSN=your-sentry-dsn
   ```

5. **Update netlify.toml** with your Railway backend URL (see above)

6. **Deploy**
   - Netlify will automatically deploy on every push to main
   - Or trigger a deploy manually from the dashboard

## Required Environment Variables

Set these in Netlify Dashboard > Site settings > Environment variables:

### Frontend Configuration
```bash
# Smart Contract Address
VITE_GUARDIA_VAULT_ADDRESS=0xYourContractAddress

# Blockchain Network
VITE_CHAIN_ID=11155111  # Sepolia testnet (or 1 for mainnet)

# RPC URL
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# WalletConnect (optional but recommended)
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# Sentry Error Tracking (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
```

## Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow instructions to configure DNS
4. Netlify will provide SSL certificate automatically

## Updating Backend URL

When your Railway backend URL changes:

1. Update `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://NEW_RAILWAY_URL/api/:splat"
   ```

2. Redeploy: `netlify deploy --prod` or push to trigger auto-deploy

## Troubleshooting

### Build Fails

- **Check Node version**: Ensure Node 20 is selected
- **Check build command**: Should be `npm run build`
- **Check dependencies**: Make sure `package.json` has all required deps
- **View build logs**: Check Netlify deploy logs for errors

### API Requests Fail

- **Check redirect**: Ensure Railway URL is correct in `netlify.toml`
- **Check CORS**: Ensure Railway backend allows your Netlify domain
- **Check Network**: Open browser console and check Network tab

### Static Assets Not Loading

- **Check publish directory**: Should be `dist/public`
- **Check paths**: Ensure asset paths are relative, not absolute
- **Clear cache**: Hard refresh browser (Ctrl+Shift+R)

## Monitoring

- **Deploy logs**: View in Netlify dashboard > Deploys
- **Function logs**: Netlify Functions logs (if using)
- **Analytics**: Enable Netlify Analytics in site settings

## Next Steps

1. ✅ Deploy backend to Railway (see `RAILWAY_DEPLOYMENT.md`)
2. ✅ Update `netlify.toml` with Railway URL
3. ✅ Set all environment variables
4. ✅ Test deployment
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring

## Support

- [Netlify Docs](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)

