# Redeploy Backend to Railway

## Current Railway Project

- **Project**: `ideal-success`
- **Service**: `Paradexx`
- **Environment**: `production`
- **URL**: `https://paradexx-production.up.railway.app`

## ✅ Backend Status

The backend is currently **running** and healthy. Logs show the service is active.

## 🔄 Redeploy Options

### Option 1: Redeploy from Railway Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select project: **ideal-success**
3. Click on service: **Paradexx**
4. Go to **Deployments** tab
5. Click **"Redeploy"** on the latest deployment
6. Or click **"Deploy"** to trigger a new deployment from GitHub

### Option 2: Trigger via GitHub Push

Railway auto-deploys on push to main branch:

```bash
# Make a small change (like updating a comment)
git add .
git commit -m "Trigger Railway redeploy"
git push origin main
```

Railway will automatically detect the push and redeploy.

### Option 3: Railway CLI (if files are small)

```bash
# Note: CLI upload failed due to file size (227MB)
# Use GitHub deployment instead

# Check status
railway status

# View logs
railway logs --tail 50

# View domain
railway domain
```

## 📋 Current Configuration

**Railway Config**: `railway.json`
- Build: `cd src/backend && npm install --legacy-peer-deps && npx prisma generate && npm run build`
- Start: `cd src/backend && npx prisma db push --accept-data-loss && npm start`
- Health Check: `/health`

## ✅ Verify Deployment

After redeploy, verify:

```bash
# Health check
curl https://paradexx-production.up.railway.app/health

# Should return: {"status":"ok"}
```

## 🔗 Railway Dashboard

**Direct Links**:
- Dashboard: https://railway.app/dashboard
- Project: https://railway.app/project/ideal-success
- Service: https://railway.app/project/ideal-success/service/paradexx

## 📱 Update Mobile App

After backend is redeployed:

1. **Verify backend URL**: `https://paradexx-production.up.railway.app`
2. **Update mobile app config** (if needed):
   - Set `VITE_API_URL=https://paradexx-production.up.railway.app`
   - Or update `src/services/config.ts`
3. **Rebuild mobile app**:
   ```bash
   npm run build
   npx cap sync android
   ```
4. **Build AAB**:
   ```bash
   cd android
   .\gradlew bundleRelease
   ```

## 🆘 Troubleshooting

### Deployment Fails
- Check Railway build logs
- Verify environment variables are set
- Check database connection

### Backend Not Responding
- Check Railway logs: `railway logs`
- Verify health endpoint: `curl https://paradexx-production.up.railway.app/health`
- Check Railway dashboard for errors

### File Too Large Error
- Use GitHub deployment (Railway pulls from GitHub)
- Or exclude large files in `.railwayignore`

---

**Quick Redeploy**: Go to Railway Dashboard → Project → Service → Deployments → Redeploy
