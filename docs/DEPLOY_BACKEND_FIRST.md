# Deploy Backend to Railway First

**⚠️ IMPORTANT**: Before deploying to Google Play Store, deploy the backend API to Railway so the mobile app has a working server to connect to.

## Why Deploy Backend First?

The mobile app needs production API endpoints to function:
- User authentication
- Wallet operations
- Trading & swaps
- Market data
- All backend services

Without a deployed backend, the mobile app won't work!

## 🚀 Quick Deployment Steps

### Step 1: Prepare Railway Account

1. **Sign up**: https://railway.app
2. **Connect GitHub**: Link your repository

### Step 2: Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `paradexwallet` repository
5. Railway will auto-detect Node.js

### Step 3: Add PostgreSQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** > **"PostgreSQL"**
3. Railway creates database automatically
4. **Copy the `DATABASE_URL`** from Variables tab

### Step 4: Configure Environment Variables

Go to your service > **Variables** tab and add:

#### Required Core Variables

```bash
# Database (from Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Core Settings
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Security (GENERATE THESE!)
SESSION_SECRET=<generate-random-32-chars>
JWT_SECRET=<generate-random-32-chars>
ENCRYPTION_KEY=<generate-random-64-chars>
```

#### Generate Secrets (Windows PowerShell)

```powershell
# SESSION_SECRET (32 random bytes, base64)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# JWT_SECRET (32 random bytes, base64)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# ENCRYPTION_KEY (64 random hex chars)
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

#### Optional API Keys

```bash
# External APIs
ONEINCH_API_KEY=your_1inch_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
COINGECKO_API_KEY=your_coingecko_api_key

# CORS (add your frontend URLs)
ALLOWED_ORIGINS=https://your-app.netlify.app,capacitor://localhost,ionic://localhost

# Email (if using)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Error Tracking (optional)
SENTRY_DSN=your_sentry_dsn
```

### Step 5: Deploy

Railway will automatically:
1. Run `cd src/backend && npm install --legacy-peer-deps`
2. Run `npx prisma generate`
3. Run `npm run build`
4. Start with `npm start`

**Monitor deployment**:
- Go to **Deployments** tab
- Watch build logs
- Check for errors

### Step 6: Get Railway URL

After deployment, Railway provides a URL:
```
https://your-app-name.up.railway.app
```

**Copy this URL** - you'll need it for the mobile app!

### Step 7: Verify Backend is Working

Test the health endpoint:
```bash
curl https://your-app-name.up.railway.app/health
```

Should return: `{"status":"ok"}`

## 📱 Update Mobile App Configuration

After backend is deployed, update the mobile app to use production API:

### Option 1: Update capacitor.config.ts

```typescript
const config: CapacitorConfig = {
  appId: 'io.paradox.wallet',
  appName: 'Paradox',
  webDir: 'dist',
  server: {
    // For production, remove this or set to your Railway URL
    // url: 'https://your-app-name.up.railway.app',
    androidScheme: 'https',
  },
  // ...
};
```

### Option 2: Set Environment Variable (Recommended)

Create `.env.production`:
```bash
VITE_API_URL=https://your-app-name.up.railway.app
VITE_WS_URL=wss://your-app-name.up.railway.app
```

Then rebuild:
```bash
npm run build
npx cap sync android
```

### Option 3: Update src/services/config.ts

The config already defaults to Railway production URL:
```typescript
const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;
    
    if (import.meta.env.PROD) {
        return 'https://paradexx-production.up.railway.app'; // Update this!
    }
    
    return 'http://localhost:3001';
};
```

**Update the production URL** to your Railway URL.

## ✅ Verification Checklist

Before building mobile app:

- [ ] Backend deployed to Railway
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Database migrations run (`npx prisma db push`)
- [ ] Environment variables set
- [ ] Railway URL copied
- [ ] Mobile app config updated with Railway URL
- [ ] Test API endpoints work

## 🔄 After Backend Deployment

1. **Update mobile app config** with Railway URL
2. **Rebuild web app**: `npm run build`
3. **Sync Capacitor**: `npx cap sync android`
4. **Build AAB**: `cd android && .\gradlew bundleRelease`
5. **Upload to Play Store**

## 📚 Related Documentation

- **Railway Config**: `railway.json`
- **Backend Config**: `src/backend/railway.json`
- **Environment Variables**: `.env.example`
- **Deployment Guide**: `docs/DEPLOYMENT_AUDIT.md`

---

**Next Step**: After backend is deployed, follow `docs/DEPLOY_TO_PLAY_STORE_NOW.md`
