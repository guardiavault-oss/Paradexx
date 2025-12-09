# GuardiaVault Production Deployment Guide

This guide will help you deploy GuardiaVault to production with Railway (backend) and Netlify (frontend).

## 🌐 Production URLs

- **Frontend (Netlify):** https://guardiavault.com
- **Frontend (Preview):** https://690a2a303b76e10008718246--guardiavault.netlify.app
- **Backend (Railway):** https://guardiavault-production.up.railway.app
- **Blockchain Network:** Sepolia Testnet (Chain ID: 11155111)

---

## 🚂 Part 1: Railway Backend Deployment

### Step 1: Set Environment Variables in Railway

Go to your Railway project dashboard and add these environment variables:

#### Core Settings
```bash
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://guardiavault-production.up.railway.app
ALLOWED_ORIGINS=https://guardiavault.com,https://www.guardiavault.com,https://690a2a303b76e10008718246--guardiavault.netlify.app
```

#### Database (Railway PostgreSQL)
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
# Railway will auto-populate this if you add PostgreSQL plugin
```

#### Security & Session (CRITICAL - Generate new values!)
```bash
SESSION_SECRET=<generate-with: openssl rand -base64 32>
SSN_SALT=<generate-with: openssl rand -hex 16>
ENCRYPTION_KEY=<generate-with: openssl rand -hex 32>
NOTIFY_HMAC_SECRET=<generate-with: openssl rand -base64 32>
```

**🔐 Generate Security Keys:**
```bash
# Run these commands to generate secure keys:
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -hex 16     # For SSN_SALT
openssl rand -hex 32     # For ENCRYPTION_KEY
openssl rand -base64 32  # For NOTIFY_HMAC_SECRET
```

#### Smart Contract Addresses (Sepolia)
```bash
VITE_GUARDIA_VAULT_ADDRESS=0x3D853c85Df825EA3CEd26040Cba0341778eAA891
YIELD_VAULT_ADDRESS=0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
VITE_LIFETIME_ACCESS_ADDRESS=0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
VITE_ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
```

#### Blockchain Configuration
```bash
VITE_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
VITE_WALLETCONNECT_PROJECT_ID=f32270e55fe94b09ccfc7a375022bb41
PRIVATE_KEY=0x82da6f42acceda8c644074bd21581a088b55442b2b85e7a4e075b023da47c7ea
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_HERE
```

#### Email Service (SendGrid - REQUIRED)
```bash
SENDGRID_API_KEY=<your-sendgrid-api-key>
SENDGRID_FROM_EMAIL=noreply@guardiavault.com
```

**📧 Get SendGrid API Key:**
1. Sign up at https://sendgrid.com
2. Go to Settings > API Keys > Create API Key
3. Verify sender email: noreply@guardiavault.com

#### SMS Service (Twilio - Optional but Recommended)
```bash
TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
```

#### Payment Processing (Stripe - REQUIRED for subscriptions)
```bash
STRIPE_SECRET_KEY=<your-stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
```

**💳 Get Stripe Keys:**
1. Sign up at https://stripe.com
2. Use test keys for Sepolia testnet
3. Switch to live keys when moving to mainnet

#### Error Tracking (Sentry - Recommended)
```bash
SENTRY_DSN=<your-backend-sentry-dsn>
SENTRY_ENVIRONMENT=production
```

#### Logging
```bash
LOG_LEVEL=info
DEBUG=false
```

### Step 2: Deploy to Railway

```bash
# From your project root
cd C:\Users\ADMIN\Desktop\GuardiaVault-2

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Deploy
railway up
```

### Step 3: Run Database Migrations

After deployment, run migrations:

```bash
# Option 1: Via Railway CLI
railway run npm run db:migrate

# Option 2: Via Railway dashboard
# Go to your service > Settings > Deploy Logs
# Add this to your start command: npm run db:migrate && npm start
```

---

## 🎨 Part 2: Netlify Frontend Deployment

### Step 1: Set Environment Variables in Netlify

Go to your Netlify site: **Site Settings > Environment Variables**

Add these variables:

```bash
# Backend API
VITE_API_URL=https://guardiavault-production.up.railway.app

# Smart Contracts (Sepolia)
VITE_GUARDIA_VAULT_ADDRESS=0x3D853c85Df825EA3CEd26040Cba0341778eAA891
VITE_YIELD_VAULT_ADDRESS=0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
VITE_LIFETIME_ACCESS_ADDRESS=0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
VITE_ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Blockchain Network
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=f32270e55fe94b09ccfc7a375022bb41

# Environment
NODE_ENV=production

# Sentry (Optional)
VITE_SENTRY_DSN=<your-frontend-sentry-dsn>
VITE_SENTRY_ENVIRONMENT=production
```

### Step 2: Configure Build Settings

In Netlify: **Site Settings > Build & Deploy**

```bash
Build command: npm run build
Publish directory: dist
```

### Step 3: Deploy

```bash
# Option 1: Git push (automatic deployment)
git push origin main

# Option 2: Manual deployment via Netlify CLI
cd client
netlify deploy --prod
```

---

## ✅ Part 3: Verification Checklist

### Backend (Railway) Verification

1. **Health Check:**
   ```bash
   curl https://guardiavault-production.up.railway.app/health
   ```
   Should return: `{"status":"ok",...}`

2. **API Docs:**
   Visit: https://guardiavault-production.up.railway.app/api-docs

3. **Database Connection:**
   Check Railway logs for: `✅ Database connection ready`

4. **CORS Configuration:**
   Open browser console on https://guardiavault.com and check for CORS errors

### Frontend (Netlify) Verification

1. **Site Loads:**
   Visit: https://guardiavault.com

2. **Environment Variables:**
   Open browser console and type:
   ```javascript
   console.log(import.meta.env)
   ```
   Verify all VITE_ variables are present

3. **Backend Connection:**
   Check Network tab for API calls to Railway backend

4. **Wallet Connection:**
   - Connect MetaMask (Sepolia network)
   - Verify contract addresses match deployment

### Smart Contract Verification

1. **GuardiaVault:** https://sepolia.etherscan.io/address/0x3D853c85Df825EA3CEd26040Cba0341778eAA891
2. **YieldVault:** https://sepolia.etherscan.io/address/0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
3. **LifetimeAccess:** https://sepolia.etherscan.io/address/0x01eFA1b345f806cC847aa434FC99c255CDc02Da1

---

## 🔧 Part 4: Post-Deployment Configuration

### Email Configuration (SendGrid)

1. Add sender email verification for: noreply@guardiavault.com
2. Set up domain authentication for guardiavault.com
3. Test email notifications

### Domain Configuration

#### For guardiavault.com (Netlify):
1. Go to Netlify: **Domain Settings**
2. Add custom domain: guardiavault.com
3. Configure DNS:
   ```
   A record: @ -> 75.2.60.5
   CNAME: www -> 690a2a303b76e10008718246--guardiavault.netlify.app
   ```

### SSL Certificates

- **Netlify:** Automatically provisions SSL (Let's Encrypt)
- **Railway:** Automatically provisions SSL

---

## 🚨 Important Security Notes

1. **Never commit .env files** - They are in .gitignore
2. **Rotate secrets regularly** - Especially in production
3. **Use separate wallets** - Don't use deployment wallet for user funds
4. **Monitor error logs** - Set up Sentry for both frontend and backend
5. **Backup database** - Railway auto-backups, but verify
6. **Rate limiting** - Configured in Express middleware
7. **Input validation** - Zod schemas validate all API inputs

---

## 📊 Monitoring & Logs

### Railway Logs
```bash
# View live logs
railway logs

# Or in Railway dashboard
```

### Netlify Logs
```bash
# View deploy logs in Netlify dashboard
# Or via CLI
netlify logs
```

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check Railway logs for errors
- Verify DATABASE_URL is set
- Ensure all required env vars are present

### Frontend Can't Connect to Backend
- Verify VITE_API_URL is correct
- Check CORS settings in Railway
- Inspect Network tab for 404/CORS errors

### Database Connection Issues
- Verify Railway PostgreSQL plugin is installed
- Check DATABASE_URL format
- Run migrations: `railway run npm run db:migrate`

### Contract Interaction Fails
- Verify MetaMask is on Sepolia network
- Check contract addresses match deployment
- Ensure wallet has Sepolia ETH

---

## 📈 Next Steps After Deployment

1. **Test all features** in production
2. **Monitor error rates** via Sentry
3. **Set up monitoring alerts** (Uptime Robot, etc.)
4. **Configure backup strategy**
5. **Plan mainnet migration** (when ready)
6. **Set up CI/CD pipeline** (GitHub Actions)
7. **Enable Stripe payment processing**
8. **Configure domain email** (SendGrid domain auth)

---

## 🎯 Quick Deploy Commands

```bash
# Backend (Railway)
railway up

# Frontend (Netlify)
cd client && netlify deploy --prod

# Database migrations
railway run npm run db:migrate

# Check health
curl https://guardiavault-production.up.railway.app/health
```

---

**🎉 Your GuardiaVault is ready for production!**
