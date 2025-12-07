# Quick Deploy Guide: Netlify + Railway

**Estimated Time: 30 minutes**

## Prerequisites

- ✅ GitHub repository with your code
- ✅ Netlify account (free)
- ✅ Railway account (free)

## Step 1: Deploy Backend to Railway (15 min)

### 1.1 Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** > **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect Node.js

### 1.2 Add PostgreSQL Database
1. Click **"+ New"** > **"Database"** > **"PostgreSQL"**
2. Railway creates database automatically
3. **Copy the `DATABASE_URL`** from the Variables tab

### 1.3 Set Environment Variables

Go to your service > **Variables** tab and add:

```bash
# Required - Core
DATABASE_URL=postgresql://... (from Railway PostgreSQL)
SESSION_SECRET=generate-random-here  # Use: openssl rand -base64 32
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-app.up.railway.app

# Required - Security
SSN_SALT=generate-here  # Use: openssl rand -base64 16
ENCRYPTION_KEY=generate-here  # Use: openssl rand -hex 32

# Optional - Payments (if using Stripe)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Optional - Notifications (if using)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Optional - Error Tracking
SENTRY_DSN=https://...
```

**Generate secrets:**
```bash
# SESSION_SECRET
openssl rand -base64 32

# SSN_SALT  
openssl rand -base64 16

# ENCRYPTION_KEY
openssl rand -hex 32
```

### 1.4 Run Database Migrations

```bash
# Using Railway CLI
railway login
railway link
railway run npm run db:push
```

Or use Railway dashboard shell: Service > Connect > Shell

### 1.5 Get Railway URL

After deployment, Railway provides a URL like:
```
https://your-app.up.railway.app
```

**Copy this URL - you'll need it for Netlify!**

## Step 2: Deploy Frontend to Netlify (10 min)

### 2.1 Update netlify.toml

Edit `netlify.toml` and update the Railway URL:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_APP_NAME.up.railway.app/api/:splat"
  status = 200
  force = true
```

Replace `YOUR_APP_NAME` with your actual Railway app name.

### 2.2 Deploy to Netlify

#### Option A: Via GitHub (Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Click **"Add new site"** > **"Import an existing project"**
3. Connect GitHub and select your repository
4. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/public`
5. Click **"Deploy site"**

#### Option B: Via CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts:
# - Create & configure new site
# - Build command: npm run build
# - Publish: dist/public
netlify deploy --prod
```

### 2.3 Set Environment Variables

Go to Netlify Dashboard > **Site settings** > **Environment variables**

Add:
```bash
VITE_GUARDIA_VAULT_ADDRESS=0xYourContractAddress
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
VITE_SENTRY_DSN=https://...  # optional
```

### 2.4 Update Railway CORS (Important!)

Add your Netlify URL to Railway environment variables:

In Railway > Variables, add:
```bash
ALLOWED_ORIGINS=https://your-app.netlify.app,https://your-custom-domain.com
```

Or update `server/index.ts` CORS to include your Netlify domain.

## Step 3: Configure CORS (5 min)

### Update Railway Backend

Add to Railway environment variables:
```bash
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

This allows your Netlify frontend to make API calls to Railway.

**Redeploy Railway** (or just wait for auto-deploy)

## Step 4: Test Everything (5 min)

### Test Backend
```bash
curl https://your-app.up.railway.app/health
# Should return: {"status":"ok",...}
```

### Test Frontend
1. Visit your Netlify URL
2. Open browser DevTools > Network
3. Try logging in
4. Check that API calls go to Railway backend

## That's It! 🎉

Your app should now be live:
- **Frontend:** `https://your-app.netlify.app`
- **Backend:** `https://your-app.up.railway.app`
- **API:** `https://your-app.netlify.app/api/*` (proxied to Railway)

## Troubleshooting

### "API requests fail"
- ✅ Check `netlify.toml` has correct Railway URL
- ✅ Check Railway CORS allows Netlify domain
- ✅ Check Railway service is running

### "Database connection fails"
- ✅ Check `DATABASE_URL` in Railway variables
- ✅ Check PostgreSQL service is running
- ✅ Run migrations: `railway run npm run db:push`

### "Build fails"
- ✅ Check Node version (should be 20)
- ✅ Check all dependencies in `package.json`
- ✅ View build logs in Railway/Netlify dashboard

## Need Help?

- **Railway Docs:** https://docs.railway.app
- **Netlify Docs:** https://docs.netlify.com
- **Detailed Guides:** See `NETLIFY_DEPLOYMENT.md` and `RAILWAY_DEPLOYMENT.md`

