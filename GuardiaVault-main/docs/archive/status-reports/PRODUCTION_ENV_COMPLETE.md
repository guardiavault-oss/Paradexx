# 🚀 Complete Production Environment Variables

## All Required & Recommended Variables for Railway

Copy these into Railway's **Variables** tab:

---

## 🔴 **REQUIRED** (App won't work without these)

```env
# Core Configuration
NODE_ENV=production
HOST=0.0.0.0
APP_URL=https://your-domain.com

# Security (Already Generated)
SESSION_SECRET=wcOWQL+E6TRFkhx//1QHwAxpQ0Qtbdf+WzEUpKcJB7Y=
JWT_SECRET=99Ksnm3KpphJsDtpf/FlEGiM8Xy7Y6xuOzyA1f2fM/w=
ENCRYPTION_KEY=d07d9d2f637482f2d687e4c0305e2857c1d106d930151f1da65a8efbf19eec8d
SSN_SALT=6b48651a0a53ee5a039382daa033fb78
NOTIFY_HMAC_SECRET=zJlkfas6qGRxY9Yl78DAQkq808fK3GzklMfr4wyG8go=
TOTP_ENCRYPTION_KEY=7a307ee0cdfb070ea37307ddcdb6757d3ac1f59cc81e6cf86d915838a2065120
WIZARD_ENCRYPTION_KEY=c667ecf6f6e2af9a8eeb70328b5bc5faf7164ac616cc85241a06501733ab6572

# Database (Railway provides automatically when you add PostgreSQL)
# DATABASE_URL=postgresql://... (Railway sets this)

# Stripe Payments (REQUIRED for payments)
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_STRIPE_PUBLISHABLE_KEY
```

---

## 🟡 **REQUIRED FOR WALLET CONNECTIONS**

### WalletConnect Project ID
```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Setup:**
1. Go to https://cloud.reown.com (formerly WalletConnect Cloud)
2. Sign up (free)
3. Create a new project
4. Copy the Project ID (looks like: `abc123def456ghi789...`)
5. Paste into `VITE_WALLETCONNECT_PROJECT_ID`

**Why it's needed:**
- Enables WalletConnect, Coinbase Wallet, and other wallet connections
- Without it, wallet features will be limited or broken
- Free tier available

---

## 🟡 **HIGHLY RECOMMENDED** (Core functionality)

### Email (SendGrid)
```env
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY
SENDGRID_FROM_EMAIL=noreply@your-domain.com
```

**Setup:**
1. Go to https://sendgrid.com
2. Sign up (free tier available)
3. Settings → API Keys → Create API Key
4. Verify sender email domain

### SMS (Twilio)
```env
TWILIO_ACCOUNT_SID=AC_YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Setup:**
1. Go to https://www.twilio.com/try-twilio
2. Sign up (free trial available)
3. Console → Account Info → Copy Account SID
4. Console → Account → API Keys → Copy Auth Token
5. Console → Phone Numbers → Buy a Number

### Blockchain RPC (Alchemy or Infura)
```env
# Option 1: Alchemy (Recommended)
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Option 2: Infura (Alternative)
# MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
# VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

**Alchemy Setup:**
1. Go to https://alchemy.com
2. Sign up (free tier available)
3. Create App → Select Ethereum Mainnet
4. Copy API Key → Use format: `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY`

**Infura Setup:**
1. Go to https://infura.io
2. Sign up (free tier available)
3. Create Project → Select Ethereum Mainnet
4. Copy Project ID → Use format: `https://mainnet.infura.io/v3/YOUR_PROJECT_ID`

### Error Tracking (Sentry)
```env
SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
SENTRY_ENVIRONMENT=production
```

**Setup:**
1. Go to https://sentry.io
2. Sign up (free tier available)
3. Create project → Select Node.js
4. Copy DSN

---

## 🟢 **OPTIONAL** (Additional features)

### CORS
```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Logging
```env
LOG_LEVEL=info
```

### Feature Flags
```env
DEATH_VERIFICATION_ENABLED=true
WEB3_INTEGRATION_ENABLED=true
ENABLE_API_DOCS=false
```

### WalletConnect (REQUIRED for wallet connections)
```env
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Setup:**
1. Go to https://cloud.reown.com (formerly WalletConnect Cloud)
2. Sign up (free)
3. Create a new project
4. Copy the Project ID (looks like: `abc123def456ghi789...`)
5. Paste into `VITE_WALLETCONNECT_PROJECT_ID`

**Why it's needed:**
- Enables WalletConnect, Coinbase Wallet, and other wallet connections
- Without it, wallet features will be limited
- Free tier available

---

## 📋 Quick Setup Checklist

### Step 1: Get API Keys

- [ ] **WalletConnect**: https://cloud.reown.com → Create Project → Copy Project ID
- [ ] **Stripe**: https://dashboard.stripe.com/apikeys (LIVE keys)
- [ ] **SendGrid**: https://sendgrid.com → Settings → API Keys
- [ ] **Twilio**: https://www.twilio.com → Console → Get Account SID & Auth Token
- [ ] **Alchemy**: https://alchemy.com → Create App → Get API Key
- [ ] **Sentry**: https://sentry.io → Create Project → Get DSN

### Step 2: Add to Railway

1. Go to Railway dashboard
2. Your project → **Variables** tab
3. Add each variable above
4. Replace all `YOUR_*` placeholders

### Step 3: Verify

- [ ] All required variables are set
- [ ] No `YOUR_*` placeholders remain
- [ ] Using LIVE Stripe keys (not test)
- [ ] RPC URLs are valid (test with curl)

---

## 🧪 Testing Your Setup

### Test Stripe
```bash
curl https://your-domain.com/api/payments/create-checkout-session
# Should not return "Stripe is not configured"
```

### Test RPC
```bash
curl -X POST https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Should return block number
```

### Test Health
```bash
curl https://your-domain.com/health
# Should return: {"status":"ok",...}
```

---

## 💡 Tips

1. **Alchemy vs Infura**: Both work great. Alchemy has better free tier limits.
2. **Twilio Free Trial**: Includes $15 credit - enough for testing
3. **SendGrid Free Tier**: 100 emails/day free
4. **Sentry Free Tier**: 5,000 events/month free

---

## 🔐 Security Reminders

- ✅ Never commit `.env` to git
- ✅ Use different keys for dev/prod
- ✅ Rotate secrets regularly
- ✅ Store backups in password manager
- ✅ Use Railway's built-in secrets management

---

**All variables ready! Just copy to Railway and replace placeholders.** 🚀

