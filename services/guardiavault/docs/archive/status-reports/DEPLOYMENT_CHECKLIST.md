# 🚀 GuardiaVault Production Deployment Checklist

Complete these steps to deploy GuardiaVault to production.

---

## ✅ Pre-Deployment Checklist

### 1. Third-Party Services Setup

- [ ] **SendGrid** (Email - REQUIRED)
  - Sign up at https://sendgrid.com
  - Get API key from Settings > API Keys
  - Verify sender email: noreply@guardiavault.com

- [ ] **Stripe** (Payments - REQUIRED)
  - Sign up at https://stripe.com
  - Get API keys from Dashboard > Developers > API Keys
  - Use test keys for Sepolia, live keys for mainnet

- [ ] **Twilio** (SMS - Optional but recommended)
  - Sign up at https://twilio.com
  - Get Account SID, Auth Token, and phone number

- [ ] **Sentry** (Error Tracking - Recommended)
  - Sign up at https://sentry.io
  - Create two projects (backend + frontend)
  - Get DSN for each project

---

## 🚂 Railway Backend Deployment

### Step 1: Add PostgreSQL Database

1. Open Railway dashboard
2. Go to your project: **airy-light**
3. Click "New" > "Database" > "Add PostgreSQL"
4. Railway will auto-set DATABASE_URL variable

### Step 2: Set Environment Variables

**Option A: Use Railway Dashboard**
1. Go to your service > Variables tab
2. Copy values from `RAILWAY_ENV_VARS.txt`
3. Click "Add Variable" for each one

**Option B: Use Railway CLI (Faster)**
```bash
cd C:\Users\ADMIN\Desktop\GuardiaVault-2

# Set all core variables at once (copy from RAILWAY_ENV_VARS.txt)
railway variables --set NODE_ENV="production"
railway variables --set PORT="5000"
# ... (see RAILWAY_ENV_VARS.txt for full list)

# Add your third-party API keys
railway variables --set SENDGRID_API_KEY="your_key"
railway variables --set STRIPE_SECRET_KEY="your_key"
railway variables --set TWILIO_ACCOUNT_SID="your_sid"
railway variables --set TWILIO_AUTH_TOKEN="your_token"
```

### Step 3: Deploy to Railway

```bash
cd C:\Users\ADMIN\Desktop\GuardiaVault-2
railway up
```

### Step 4: Run Database Migrations

```bash
railway run npm run db:migrate
```

### Step 5: Verify Backend Deployment

```bash
# Test health endpoint
curl https://guardiavault-production.up.railway.app/health

# Should return: {"status":"ok",...}
```

✅ **Backend deployment complete!**

---

## 🎨 Netlify Frontend Deployment

### Step 1: Set Environment Variables

1. Go to Netlify dashboard
2. Open your site: **guardiavault.netlify.app**
3. Go to **Site Settings > Environment Variables**
4. Click "Add a variable"
5. Copy each variable from `NETLIFY_ENV_VARS.txt`

**Key variables to add:**
- `VITE_API_URL` = https://guardiavault-production.up.railway.app
- `VITE_GUARDIA_VAULT_ADDRESS` = 0x3D853c85Df825EA3CEd26040Cba0341778eAA891
- `VITE_YIELD_VAULT_ADDRESS` = 0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
- `VITE_LIFETIME_ACCESS_ADDRESS` = 0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
- `VITE_CHAIN_ID` = 11155111
- `VITE_SEPOLIA_RPC_URL` = https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
- `VITE_WALLETCONNECT_PROJECT_ID` = f32270e55fe94b09ccfc7a375022bb41
- `NODE_ENV` = production

### Step 2: Configure Build Settings

In Netlify: **Site Settings > Build & Deploy > Build settings**

```
Build command: npm run build
Publish directory: dist
Base directory: client
```

### Step 3: Trigger Deployment

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Configure production environment"
git push origin main
```

**Option B: Manual Deploy via Dashboard**
1. Go to **Deploys** tab
2. Click "Trigger deploy" > "Clear cache and deploy site"

### Step 4: Configure Custom Domain

1. In Netlify: **Domain Settings > Add custom domain**
2. Add: `guardiavault.com`
3. Configure DNS at your domain registrar:
   ```
   A record: @ -> 75.2.60.5
   CNAME: www -> 690a2a303b76e10008718246--guardiavault.netlify.app
   ```
4. Wait for DNS propagation (5-30 minutes)
5. Netlify will auto-provision SSL certificate

✅ **Frontend deployment complete!**

---

## 🧪 Post-Deployment Verification

### 1. Test Backend Health

```bash
curl https://guardiavault-production.up.railway.app/health
```
Expected: `{"status":"ok","timestamp":"...","uptime":...}`

### 2. Test API Documentation

Visit: https://guardiavault-production.up.railway.app/api-docs

Should see Swagger UI with all API endpoints

### 3. Test Frontend

1. Visit: https://guardiavault.com
2. Open browser console (F12)
3. Check for errors (should be minimal/none)
4. Verify API calls go to Railway backend

### 4. Test Wallet Connection

1. Install MetaMask (if not already)
2. Switch to Sepolia Test Network
3. Connect wallet on https://guardiavault.com
4. Verify contract addresses match:
   - GuardiaVault: 0x3D853c85Df825EA3CEd26040Cba0341778eAA891
   - YieldVault: 0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
   - LifetimeAccess: 0x01eFA1b345f806cC847aa434FC99c255CDc02Da1

### 5. Test Core Features

- [ ] User registration
- [ ] User login
- [ ] Wallet connection
- [ ] Create vault
- [ ] Add guardian
- [ ] View dashboard
- [ ] Email notifications (requires SendGrid setup)
- [ ] SMS notifications (requires Twilio setup)

---

## 📊 Monitoring Setup

### Railway Logs
```bash
# View live logs
railway logs

# Or check Railway dashboard > Deployments > View Logs
```

### Netlify Logs
- Netlify Dashboard > Deploys > [Latest Deploy] > Deploy Log
- Functions tab for serverless function logs (if using)

### Sentry Error Tracking
1. Check Sentry dashboard for errors
2. Set up alerts for critical errors
3. Monitor error rates daily

---

## 🔒 Security Checklist

- [✅] All `.env` files in `.gitignore`
- [✅] Production secrets generated (not using defaults)
- [✅] HTTPS enabled (Railway + Netlify auto-provision SSL)
- [ ] SendGrid domain authentication configured
- [ ] Stripe webhook configured (if using subscriptions)
- [ ] Rate limiting enabled (check Express config)
- [ ] CORS properly configured
- [ ] Database backups enabled (Railway auto-backups)
- [ ] Regular security audits scheduled

---

## 🐛 Common Issues & Fixes

### Backend won't start
**Symptom:** Railway shows "Crashed" status
**Fix:**
1. Check Railway logs: `railway logs`
2. Verify DATABASE_URL is set
3. Ensure all required env vars are present
4. Run migrations: `railway run npm run db:migrate`

### Frontend can't connect to backend
**Symptom:** CORS errors or 404s in browser console
**Fix:**
1. Verify `VITE_API_URL` in Netlify env vars
2. Check `ALLOWED_ORIGINS` in Railway includes Netlify URL
3. Clear browser cache and hard reload (Ctrl+Shift+R)

### Contract interaction fails
**Symptom:** "Wrong network" or transaction errors
**Fix:**
1. Verify MetaMask is on Sepolia (Chain ID: 11155111)
2. Check contract addresses match deployment
3. Ensure wallet has Sepolia ETH for gas

### Email notifications not working
**Symptom:** Users not receiving emails
**Fix:**
1. Verify SendGrid API key is correct
2. Check sender email is verified in SendGrid
3. View Railway logs for email errors
4. Check SendGrid dashboard for delivery stats

---

## 📈 Next Steps

After deployment is verified:

1. **Monitor for 24 hours**
   - Check error rates in Sentry
   - Monitor Railway logs
   - Test all user flows

2. **Set up monitoring alerts**
   - Uptime Robot for health endpoint
   - Sentry alerts for critical errors
   - Railway notifications for deploy failures

3. **Configure backup strategy**
   - Railway auto-backups PostgreSQL
   - Consider additional backup service
   - Document restore procedures

4. **Plan for mainnet migration**
   - When ready, deploy new contracts to Ethereum mainnet
   - Update contract addresses
   - Switch VITE_CHAIN_ID to 1
   - Use Stripe live keys

5. **Optimize performance**
   - Enable caching strategies
   - Optimize database queries
   - Consider CDN for assets

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app
- **Netlify Docs:** https://docs.netlify.com
- **GuardiaVault Docs:** See `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Smart Contracts:** See `SEPOLIA_DEPLOYMENT.md`

---

## ✅ Deployment Status

Current status:
- ✅ Smart contracts deployed to Sepolia
- ✅ Contracts verified on Etherscan
- ✅ Environment files configured
- ⏳ Railway backend deployment (pending)
- ⏳ Netlify frontend deployment (pending)
- ⏳ Third-party services setup (pending)

**Next action:** Set up third-party services, then deploy to Railway!
