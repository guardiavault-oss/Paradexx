# Complete Deployment Guide: Netlify + Railway

This document provides a complete overview of deploying GuardiaVault using Netlify (frontend) and Railway (backend).

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Netlify       │  ──────► │    Railway       │  ──────► │  PostgreSQL │
│   (Frontend)    │  API    │    (Backend)     │  DB      │  (Database)  │
└─────────────────┘         └──────────────────┘         └──────────────┘
     │                              │
     │                              │
     └──────────────────────────────┘
          User's Browser
```

- **Frontend**: Netlify hosts the React/Vite static site
- **Backend**: Railway hosts the Express.js API server
- **Database**: Railway PostgreSQL (or external)

## Quick Start Checklist

### Backend (Railway) - Do This First

1. [ ] Sign up for Railway account
2. [ ] Deploy backend from GitHub
3. [ ] Add PostgreSQL database service
4. [ ] Set all environment variables (see RAILWAY_DEPLOYMENT.md)
5. [ ] Run database migrations
6. [ ] Test API endpoints
7. [ ] Get Railway app URL (e.g., `https://your-app.up.railway.app`)

### Frontend (Netlify)

1. [ ] Sign up for Netlify account
2. [ ] Update `netlify.toml` with Railway backend URL
3. [ ] Connect GitHub repository
4. [ ] Set environment variables (VITE_*)
5. [ ] Deploy
6. [ ] Test frontend connection to backend

## Step-by-Step Deployment

### Phase 1: Backend Setup (Railway)

**Time: ~15 minutes**

1. **Create Railway Project**
   ```bash
   # Via Dashboard:
   # 1. Go to railway.app
   # 2. Click "New Project"
   # 3. Select "Deploy from GitHub repo"
   # 4. Choose your repository
   ```

2. **Add PostgreSQL Database**
   - Click "+ New" > "Database" > "PostgreSQL"
   - Railway creates database automatically
   - Note the connection string (shown in Variables)

3. **Configure Environment Variables**
   - Go to your service > Variables
   - Add all required variables (see RAILWAY_DEPLOYMENT.md)
   - **Critical ones:**
     - `DATABASE_URL` (from PostgreSQL service)
     - `SESSION_SECRET` (generate: `openssl rand -base64 32`)
     - `NODE_ENV=production`
     - `APP_URL=https://your-app.up.railway.app`

4. **Deploy & Verify**
   - Railway auto-deploys on push
   - Check logs for errors
   - Test: `curl https://your-app.up.railway.app/health`

5. **Run Database Migrations**
   ```bash
   # Using Railway CLI or dashboard shell
   railway run npm run db:push
   ```

### Phase 2: Frontend Setup (Netlify)

**Time: ~10 minutes**

1. **Update Configuration**
   ```bash
   # Edit netlify.toml
   # Change this line:
   to = "https://YOUR_APP_NAME.up.railway.app/api/:splat"
   # To your actual Railway URL
   ```

2. **Deploy to Netlify**
   ```bash
   # Option A: Via CLI
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod

   # Option B: Via GitHub (recommended)
   # 1. Push code to GitHub
   # 2. Go to netlify.com
   # 3. Import project from GitHub
   # 4. Configure build settings
   ```

3. **Set Environment Variables**
   - Go to Netlify Dashboard > Site settings > Environment variables
   - Add all `VITE_*` variables:
     - `VITE_GUARDIA_VAULT_ADDRESS`
     - `VITE_CHAIN_ID`
     - `VITE_SEPOLIA_RPC_URL`
     - `VITE_WALLETCONNECT_PROJECT_ID` (optional)
     - `VITE_SENTRY_DSN` (optional)

4. **Verify Deployment**
   - Visit your Netlify URL
   - Check browser console for errors
   - Test API calls to backend

### Phase 3: Configure CORS

**Important**: Update backend to allow Netlify domain

1. **Edit `server/index.ts` or `server/routes.ts`**
   ```typescript
   import cors from 'cors';
   
   app.use(cors({
     origin: [
       'https://your-app.netlify.app',
       'https://your-custom-domain.com',
       'http://localhost:5000', // for local dev
     ],
     credentials: true
   }));
   ```

2. **Redeploy to Railway**
   ```bash
   git push
   # Railway auto-deploys
   ```

## Environment Variables Reference

### Railway (Backend)

See `RAILWAY_DEPLOYMENT.md` for complete list. Essential ones:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=...
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-app.up.railway.app
```

### Netlify (Frontend)

All variables must start with `VITE_`:

```bash
VITE_GUARDIA_VAULT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://...
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_SENTRY_DSN=...
```

## URLs After Deployment

After deployment, you'll have:

- **Frontend**: `https://your-app.netlify.app`
- **Backend API**: `https://your-app.up.railway.app`
- **API Endpoints**: `https://your-app.netlify.app/api/*` (proxied to Railway)

## Testing Deployment

### 1. Test Backend Health

```bash
curl https://your-app.up.railway.app/health
curl https://your-app.up.railway.app/ready
```

Expected response:
```json
{"status":"ok","database":true}
```

### 2. Test Frontend

1. Visit Netlify URL
2. Open browser DevTools > Network tab
3. Try logging in or making an API call
4. Verify requests go to Railway backend

### 3. Test Database

```bash
# Using Railway CLI
railway run npm run db:studio
# Or connect via any PostgreSQL client using DATABASE_URL
```

## Custom Domain Setup

### Netlify (Frontend)

1. Go to Site settings > Domain management
2. Add custom domain
3. Configure DNS as instructed
4. SSL certificate auto-provisioned

### Railway (Backend)

1. Go to service > Settings > Networking
2. Add custom domain
3. Configure DNS (CNAME to Railway)
4. SSL certificate auto-provisioned

## Troubleshooting Common Issues

### Issue: API requests fail from frontend

**Solution:**
1. Check `netlify.toml` redirect URL is correct
2. Check Railway service is running
3. Check CORS configuration allows Netlify domain
4. Check browser console for CORS errors

### Issue: Database connection fails

**Solution:**
1. Verify `DATABASE_URL` in Railway variables
2. Check PostgreSQL service is running
3. Ensure migrations have run
4. Test connection: `railway run npm run db:studio`

### Issue: Build fails

**Solution:**
1. Check build logs in Railway/Netlify
2. Verify Node version (should be 20)
3. Check all dependencies in `package.json`
4. Clear cache and rebuild

### Issue: Environment variables not working

**Solution:**
1. Verify variable names (especially `VITE_` prefix for frontend)
2. Restart service after adding variables
3. Rebuild frontend after adding `VITE_*` variables
4. Check variable values don't have quotes/extra spaces

## Cost Estimate

### Free Tier (Hobby)

- **Netlify**: Free (100GB bandwidth/month)
- **Railway**: Free ($5 credit/month, ~500 hours)
- **Total**: **$0/month** for low traffic

### Paid (Production)

- **Netlify Pro**: $19/month (better features)
- **Railway**: Pay-as-you-go (~$5-20/month for small apps)
- **Total**: **~$25-40/month**

## Security Checklist

Before going to production:

- [ ] All `SESSION_SECRET` and encryption keys are strong random values
- [ ] `NODE_ENV=production` is set
- [ ] Database has strong password
- [ ] CORS only allows your frontend domain
- [ ] API rate limiting is enabled
- [ ] HTTPS is enabled (auto by Netlify/Railway)
- [ ] Error tracking (Sentry) is configured
- [ ] Logging is configured
- [ ] Database backups are enabled
- [ ] Private keys are secured (never in code)

## Monitoring

### Netlify

- Deploy logs: Dashboard > Deploys
- Analytics: Site settings > Analytics
- Function logs: Functions tab

### Railway

- Service logs: Dashboard > Service > Deployments
- Metrics: Dashboard > Service > Metrics
- Database logs: Database service > Logs

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Netlify
3. ✅ Configure CORS
4. ✅ Test everything
5. ✅ Set up custom domains (optional)
6. ✅ Configure monitoring
7. ✅ Set up backups
8. ✅ Go live! 🚀

## Support

- **Netlify**: [docs.netlify.com](https://docs.netlify.com)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **This Project**: Check README.md and other docs

## Related Documents

- `NETLIFY_DEPLOYMENT.md` - Detailed Netlify guide
- `RAILWAY_DEPLOYMENT.md` - Detailed Railway guide
- `README.md` - Project overview
- `ENV_SETUP_GUIDE.md` - Environment variables
