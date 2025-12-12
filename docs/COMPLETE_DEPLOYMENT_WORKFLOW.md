# Complete Deployment Workflow

**Step-by-step guide to deploy backend and mobile app**

## 🎯 Overview

1. **Deploy Backend to Railway** (Required first!)
2. **Update Mobile App Config** with Railway URL
3. **Build Mobile App** (AAB for Play Store)
4. **Upload to Google Play Store**

---

## Step 1: Deploy Backend to Railway ⚠️ REQUIRED FIRST

### 1.1 Create Railway Project

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository

### 1.2 Add PostgreSQL Database

1. Click **"+ New"** > **"Database"** > **"PostgreSQL"**
2. Copy `DATABASE_URL` from Variables tab

### 1.3 Set Environment Variables

Go to service > **Variables** tab:

**Required:**
```bash
DATABASE_URL=postgresql://... (from Railway)
NODE_ENV=production
PORT=3001
SESSION_SECRET=<generate-random>
JWT_SECRET=<generate-random>
ENCRYPTION_KEY=<generate-random>
```

**Generate secrets (PowerShell):**
```powershell
# SESSION_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# JWT_SECRET  
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# ENCRYPTION_KEY
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### 1.4 Deploy

Railway auto-deploys using `railway.json`:
- Build: `cd src/backend && npm install && npx prisma generate && npm run build`
- Start: `cd src/backend && npm start`

### 1.5 Get Railway URL

After deployment, Railway provides:
```
https://your-app-name.up.railway.app
```

**Copy this URL!**

### 1.6 Verify Backend

```bash
curl https://your-app-name.up.railway.app/health
```

Should return: `{"status":"ok"}`

---

## Step 2: Update Mobile App Configuration

### Option A: Environment Variable (Recommended)

Create `.env.production`:
```bash
VITE_API_URL=https://your-app-name.up.railway.app
VITE_WS_URL=wss://your-app-name.up.railway.app
```

### Option B: Update Config File

Edit `src/services/config.ts`:
```typescript
if (import.meta.env.PROD) {
    return 'https://your-app-name.up.railway.app';
}
```

### Option C: Capacitor Config

Edit `capacitor.config.ts`:
```typescript
server: {
    // For production, remove url or set to Railway URL
    url: 'https://your-app-name.up.railway.app',
    androidScheme: 'https',
}
```

---

## Step 3: Rebuild and Sync Mobile App

```bash
# 1. Rebuild web app with production config
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Verify dist folder has latest build
```

---

## Step 4: Build Release AAB

```bash
cd android

# Create keystore (first time only)
keytool -genkey -v -keystore release-keystore.jks \
  -alias paradox \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Build AAB
.\gradlew bundleRelease
```

**Output**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 5: Upload to Google Play Store

1. Go to https://play.google.com/console
2. Create app (if not exists)
3. Upload AAB file
4. Complete store listing (see `docs/PLAY_STORE_LISTING.md`)
5. Submit for review

---

## ✅ Complete Checklist

### Backend Deployment
- [ ] Railway account created
- [ ] Project created from GitHub
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Health endpoint working
- [ ] Railway URL copied

### Mobile App Configuration
- [ ] Railway URL added to config
- [ ] `.env.production` created (or config updated)
- [ ] Web app rebuilt
- [ ] Capacitor synced
- [ ] Production API URL verified

### Mobile App Build
- [ ] Release keystore created
- [ ] AAB built successfully
- [ ] AAB tested (optional)

### Play Store Submission
- [ ] App created in Play Console
- [ ] Store listing completed
- [ ] AAB uploaded
- [ ] Submitted for review

---

## 🔄 Update Workflow

For future updates:

1. **Update backend** (if needed)
   - Push code to GitHub
   - Railway auto-deploys

2. **Update mobile app**
   - Update code
   - Rebuild: `npm run build`
   - Sync: `npx cap sync android`
   - Build AAB: `cd android && .\gradlew bundleRelease`
   - Upload new AAB to Play Console

---

## 📚 Documentation

- **Backend Deployment**: `docs/DEPLOY_BACKEND_FIRST.md`
- **Mobile Deployment**: `docs/DEPLOY_TO_PLAY_STORE_NOW.md`
- **Store Listing**: `docs/PLAY_STORE_LISTING.md`
- **Railway Config**: `railway.json`

---

## 🆘 Troubleshooting

### Backend not deploying?
- Check Railway build logs
- Verify environment variables
- Check `railway.json` configuration

### Mobile app can't connect?
- Verify Railway URL is correct
- Check CORS settings in backend
- Test API endpoint directly

### AAB build fails?
- Check Android SDK installed
- Verify keystore exists
- Check Gradle build logs

---

**Ready?** Start with Step 1: Deploy Backend to Railway!
