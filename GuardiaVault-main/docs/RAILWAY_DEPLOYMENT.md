# Railway Deployment Guide for GuardiaVault Backend

This guide walks you through deploying the GuardiaVault Express backend to Railway.

## Prerequisites

1. A Railway account ([sign up here](https://railway.app))
2. GitHub account (for connecting repository)
3. PostgreSQL database (Railway PostgreSQL or external)

## Quick Start

### Step 1: Prepare Your Repository

1. **Ensure `railway.json` exists** (already created)
2. **Ensure `.env.example` has all variables documented**
3. **Push code to GitHub**

### Step 2: Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)

1. **Create New Project**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Railway Auto-Detection**
   - Railway will detect Node.js
   - It will run `npm install` and `npm run build`
   - Start command will be detected from `package.json`

3. **Add PostgreSQL Database**
   - Click "+ New" > "Database" > "PostgreSQL"
   - Railway will create a PostgreSQL instance
   - Copy the connection string (we'll use it in environment variables)

4. **Configure Environment Variables**
   - Click on your service
   - Go to "Variables" tab
   - Add all required environment variables (see below)

5. **Deploy**
   - Railway will automatically deploy on every push to main
   - Or trigger manual deploy from dashboard

#### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize**
   ```bash
   railway init
   ```

4. **Link to project**
   ```bash
   railway link
   ```

5. **Set environment variables**
   ```bash
   railway variables set DATABASE_URL=$DATABASE_URL
   railway variables set SESSION_SECRET=$SESSION_SECRET
   # ... etc
   ```

6. **Deploy**
   ```bash
   railway up
   ```

## Required Environment Variables

Set these in Railway Dashboard > Your Service > Variables:

### Core Required Variables

```bash
# Database (from Railway PostgreSQL)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Session & Security
SESSION_SECRET=generate-random-secret-here
NODE_ENV=production

# Server Configuration
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-railway-app.up.railway.app

# Encryption Keys (generate secure values)
SSN_SALT=generate-with-openssl-rand-base64-16
ENCRYPTION_KEY=generate-with-openssl-rand-hex-32
```

### Payment Services (Optional)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Notification Services (Optional)

```bash
# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Telegram
TELEGRAM_BOT_TOKEN=xxx
```

### Error Tracking (Optional)

```bash
# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Blockchain (After Contract Deployment)

```bash
# Smart Contracts
GUARDIA_VAULT_ADDRESS=0x...
SUBSCRIPTION_ESCROW_ADDRESS=0x...

# Network
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your-deployment-private-key
ETHERSCAN_API_KEY=your-etherscan-key
```

## Generating Secure Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate SSN_SALT
openssl rand -base64 16

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

## Database Setup

### Using Railway PostgreSQL

1. **Add PostgreSQL Service**
   - Click "+ New" > "Database" > "PostgreSQL"
   - Railway creates the database automatically
   - Connection string is available in Variables

2. **Run Migrations**
   ```bash
   # SSH into Railway service or use Railway CLI
   railway run npm run db:push
   ```
   Or use Railway's built-in shell from dashboard

### Using External PostgreSQL

1. **Get Connection String**
   - Format: `postgresql://user:pass@host:port/dbname`
   - Add to Railway environment variables as `DATABASE_URL`

2. **Run Migrations Locally**
   ```bash
   DATABASE_URL=your-external-db-url npm run db:push
   ```

## Domain Configuration

### Custom Domain (Optional)

1. Go to your service > Settings > Networking
2. Click "Generate Domain" to get Railway domain
3. Or click "Custom Domain" to add your own
4. Railway provides SSL automatically

### CORS Configuration

Update your backend to allow Netlify domain:

```typescript
// In server/index.ts or server/routes.ts
app.use(cors({
  origin: [
    'https://your-netlify-app.netlify.app',
    'https://your-custom-domain.com',
    // Add other allowed origins
  ],
  credentials: true
}));
```

## Build & Deploy Settings

Railway auto-detects from `railway.json` and `package.json`:

- **Build Command**: `npm run build` (from railway.json)
- **Start Command**: `npm start` (from package.json)
- **Node Version**: Auto-detected from `.nvmrc` or `package.json`

### Manual Configuration

If auto-detection doesn't work:

1. Go to Settings > Deploy
2. Set Build Command: `npm run build`
3. Set Start Command: `npm start`

## Monitoring & Logs

### View Logs

1. **Railway Dashboard**
   - Click on your service
   - Go to "Deployments" tab
   - Click on a deployment to view logs

2. **Railway CLI**
   ```bash
   railway logs
   ```

### Health Checks

Railway automatically monitors your service. Ensure these endpoints exist:

- `/health` - Basic health check
- `/ready` - Readiness check (checks database)

## Troubleshooting

### Build Fails

- **Check logs**: View deployment logs in Railway dashboard
- **Check Node version**: Ensure Node 20 is used
- **Check dependencies**: Verify all npm packages install correctly
- **Check build command**: Should be `npm run build`

### Service Crashes

- **Check logs**: View runtime logs for errors
- **Check database**: Ensure `DATABASE_URL` is correct
- **Check environment variables**: All required vars should be set
- **Check PORT**: Should be `PORT` env var (Railway sets this automatically)

### Database Connection Issues

- **Check connection string**: Ensure `DATABASE_URL` is correct
- **Check SSL**: Railway PostgreSQL requires SSL
- **Check firewall**: Railway DB should accept connections from Railway services
- **Test connection**: Use Railway's built-in database browser

### API Not Accessible

- **Check domain**: Use Railway-provided domain or custom domain
- **Check CORS**: Ensure frontend domain is allowed
- **Check routes**: Verify `/api/*` routes are working

## Cost Optimization

### Free Tier Limits

- **500 hours/month** of compute time (free)
- **5GB** storage (free)
- **PostgreSQL**: 512MB database (free tier)

### Tips to Reduce Costs

1. **Use Railway PostgreSQL** (included, vs external)
2. **Optimize build times** (use caching)
3. **Monitor usage** in Railway dashboard
4. **Scale down** when not in use (pause service)

## Scaling

### Horizontal Scaling

1. Go to Settings > Scaling
2. Enable "Auto Deploy"
3. Set resource limits (CPU/Memory)

### Vertical Scaling

1. Adjust instance size in Settings
2. Railway auto-scales based on load

## Backup & Recovery

### Database Backups

Railway PostgreSQL includes automatic backups:
- Go to Database service
- View backup history
- Restore from backup if needed

### Manual Backup

```bash
# Using Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql
```

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Set up PostgreSQL database
3. ✅ Configure environment variables
4. ✅ Run database migrations
5. ✅ Test API endpoints
6. ✅ Configure CORS for Netlify frontend
7. ✅ Deploy frontend to Netlify (see `NETLIFY_DEPLOYMENT.md`)

## Support

- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)

## Environment Variables Checklist

Use this checklist to ensure all variables are set:

```
Core:
[ ] DATABASE_URL
[ ] SESSION_SECRET
[ ] NODE_ENV=production
[ ] PORT
[ ] HOST=0.0.0.0
[ ] APP_URL
[ ] SSN_SALT
[ ] ENCRYPTION_KEY

Payments (if using):
[ ] STRIPE_SECRET_KEY
[ ] STRIPE_PUBLISHABLE_KEY

Notifications (if using):
[ ] SENDGRID_API_KEY
[ ] SENDGRID_FROM_EMAIL
[ ] TWILIO_ACCOUNT_SID
[ ] TWILIO_AUTH_TOKEN
[ ] TWILIO_PHONE_NUMBER
[ ] TELEGRAM_BOT_TOKEN

Blockchain (after deployment):
[ ] GUARDIA_VAULT_ADDRESS
[ ] SUBSCRIPTION_ESCROW_ADDRESS
[ ] SEPOLIA_RPC_URL
[ ] PRIVATE_KEY
[ ] ETHERSCAN_API_KEY

Monitoring (optional):
[ ] SENTRY_DSN
```

