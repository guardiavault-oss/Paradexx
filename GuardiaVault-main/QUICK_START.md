# 🚀 GuardiaVault Production - Quick Start Guide

## Current Status

✅ **Backend (Railway):** https://guardiavault-production.up.railway.app - **LIVE & HEALTHY**
✅ **Frontend (Netlify):** https://guardiavault.com - **LIVE**
✅ **Smart Contracts:** Deployed to Sepolia Testnet - **VERIFIED**

---

## ⚡ What You Need To Do NOW

### 1. Configure Railway Environment Variables (5 minutes)

Your Railway backend is running but needs environment variables configured.

**Quick Setup using CLI:**

```bash
cd C:\Users\ADMIN\Desktop\GuardiaVault-2

# Copy and paste these commands (they're pre-configured with your values):
railway variables --set NODE_ENV="production"
railway variables --set HOST="0.0.0.0"
railway variables --set APP_URL="https://guardiavault-production.up.railway.app"
railway variables --set ALLOWED_ORIGINS="https://guardiavault.com,https://www.guardiavault.com,https://690a2a303b76e10008718246--guardiavault.netlify.app"
railway variables --set SESSION_SECRET="3B7Y0KHrat510XqGgJeRqhjsXBdpbFSHlt/FGK4PCiA="
railway variables --set SSN_SALT="91b96a5de21a466856d6c89889e0cd0a"
railway variables --set ENCRYPTION_KEY="4e62628381e25c3a55535bd60ec190748b676a25669512c290c6c703dafacf2d"
railway variables --set NOTIFY_HMAC_SECRET="VHwDdmMCfYydME+JeXXBmCaWj7/S+lWMMlmF3VLc7pw="
railway variables --set VITE_GUARDIA_VAULT_ADDRESS="0x3D853c85Df825EA3CEd26040Cba0341778eAA891"
railway variables --set YIELD_VAULT_ADDRESS="0xe63b2eaaE33fbe61C887235668ec0705bCFb463e"
railway variables --set VITE_LIFETIME_ACCESS_ADDRESS="0x01eFA1b345f806cC847aa434FC99c255CDc02Da1"
railway variables --set VITE_CHAIN_ID="11155111"
railway variables --set SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE"
railway variables --set VITE_SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE"
railway variables --set VITE_WALLETCONNECT_PROJECT_ID="f32270e55fe94b09ccfc7a375022bb41"
railway variables --set PRIVATE_KEY="0x82da6f42acceda8c644074bd21581a088b55442b2b85e7a4e075b023da47c7ea"
railway variables --set ETHERSCAN_API_KEY="SBHWY68WVXPC58XJB7FC812MK73192WY6V"
railway variables --set LOG_LEVEL="info"
railway variables --set DEBUG="false"
```

### 2. Add Third-Party API Keys to Railway (10 minutes)

You MUST add these for full functionality:

```bash
# SendGrid (REQUIRED for email notifications)
railway variables --set SENDGRID_API_KEY="YOUR_SENDGRID_KEY"
railway variables --set SENDGRID_FROM_EMAIL="noreply@guardiavault.com"

# Stripe (REQUIRED for payments)
railway variables --set STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
railway variables --set STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"

# Twilio (Optional - for SMS)
railway variables --set TWILIO_ACCOUNT_SID="YOUR_TWILIO_SID"
railway variables --set TWILIO_AUTH_TOKEN="YOUR_TWILIO_TOKEN"
railway variables --set TWILIO_PHONE_NUMBER="+1234567890"

# Sentry (Optional - for error tracking)
railway variables --set SENTRY_DSN="YOUR_SENTRY_DSN"
railway variables --set SENTRY_ENVIRONMENT="production"
```

**Where to get these:**
- SendGrid: https://sendgrid.com → Settings > API Keys
- Stripe: https://dashboard.stripe.com/apikeys
- Twilio: https://console.twilio.com
- Sentry: https://sentry.io → Project Settings > Client Keys

### 3. Configure Netlify Environment Variables (3 minutes)

Go to: https://app.netlify.com → Your Site → Site Settings → Environment Variables

Add these (copy-paste from `NETLIFY_ENV_VARS.txt`):

```
VITE_API_URL=https://guardiavault-production.up.railway.app
VITE_GUARDIA_VAULT_ADDRESS=0x3D853c85Df825EA3CEd26040Cba0341778eAA891
VITE_YIELD_VAULT_ADDRESS=0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
VITE_LIFETIME_ACCESS_ADDRESS=0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
VITE_WALLETCONNECT_PROJECT_ID=f32270e55fe94b09ccfc7a375022bb41
NODE_ENV=production
```

### 4. Redeploy Both Services

```bash
# Redeploy Railway backend
railway up

# Redeploy Netlify frontend (triggers automatically or manually)
cd client
netlify deploy --prod
```

---

## 🧪 Test Your Deployment

### Test Backend
```bash
curl https://guardiavault-production.up.railway.app/health
# Should return: {"status":"ok",...}
```

### Test Frontend
1. Visit: https://guardiavault.com
2. Open browser console (F12)
3. Should see no major errors
4. Connect MetaMask (Sepolia network)
5. Test wallet connection

---

## 📁 Reference Files Created

All configuration files are ready in your project:

1. **PRODUCTION_DEPLOYMENT_GUIDE.md** - Complete deployment guide
2. **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist
3. **RAILWAY_ENV_VARS.txt** - All Railway environment variables
4. **NETLIFY_ENV_VARS.txt** - All Netlify environment variables
5. **SEPOLIA_DEPLOYMENT.md** - Smart contract deployment details
6. **client/.env.production** - Frontend production config

---

## 🎯 Priority Actions (Do These First)

**High Priority (Do NOW):**
1. ✅ Railway environment variables → Use commands above
2. ✅ Get SendGrid API key → Email notifications
3. ✅ Get Stripe API key → Payment processing
4. ✅ Configure Netlify env vars → Frontend-backend connection
5. ✅ Redeploy both services

**Medium Priority (Do Soon):**
- Set up Twilio for SMS notifications
- Configure Sentry for error tracking
- Set up domain email authentication (SendGrid)
- Run database migrations on Railway

**Low Priority (Can wait):**
- Monitor error rates
- Set up automated backups
- Configure CI/CD pipeline
- Plan mainnet migration

---

## 📊 Your Deployment Summary

### Smart Contracts (Sepolia Testnet)
- **GuardiaVault:** 0x3D853c85Df825EA3CEd26040Cba0341778eAA891
- **YieldVault:** 0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
- **LifetimeAccess:** 0x01eFA1b345f806cC847aa434FC99c255CDc02Da1

All contracts are **verified on Etherscan** ✅

### Production URLs
- **Backend:** https://guardiavault-production.up.railway.app
- **Frontend:** https://guardiavault.com
- **Preview:** https://690a2a303b76e10008718246--guardiavault.netlify.app

### Deployer Wallet
- **Address:** 0x774876375C50636CDcf2879863C3F5AEB29AF9E1
- **Balance:** 0.59 Sepolia ETH
- **Network:** Sepolia Testnet (Chain ID: 11155111)

---

## 🆘 Need Help?

### Common Issues

**Backend not working after env var update?**
```bash
# Redeploy Railway
railway up

# Check logs
railway logs
```

**Frontend not connecting to backend?**
- Check VITE_API_URL in Netlify
- Verify ALLOWED_ORIGINS in Railway includes Netlify URL
- Clear browser cache (Ctrl+Shift+R)

**Database errors?**
```bash
# Run migrations
railway run npm run db:migrate
```

### Support Resources
- Railway Docs: https://docs.railway.app
- Netlify Docs: https://docs.netlify.com
- Check project logs: `railway logs`

---

## ✅ Final Checklist

Before going live:

- [ ] Railway environment variables configured
- [ ] SendGrid API key added
- [ ] Stripe API keys added
- [ ] Netlify environment variables configured
- [ ] Both services redeployed
- [ ] Health endpoint responding
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] Test user registration
- [ ] Test email notifications
- [ ] Test payment processing

---

**🎉 You're almost there! Complete the steps above and your GuardiaVault will be fully functional in production!**
