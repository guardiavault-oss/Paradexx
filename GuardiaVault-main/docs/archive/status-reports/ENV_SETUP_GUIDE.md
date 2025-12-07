# 🔐 Complete Environment Variables Setup Guide

This guide will help you set up all environment variables needed for GuardiaVault to run properly.

## 📋 Quick Start

1. Copy the example file:
   ```bash
   cp env.example .env
   ```

2. Fill in the required variables (see below)
3. Restart your server

---

## 🚨 **REQUIRED** Variables (Must Set)

These are **critical** - the app won't work without them:

### Core Server Configuration
```env
# Server Configuration
NODE_ENV=development  # or "production" for live
PORT=5000             # Server port (Railway will override this)
HOST=0.0.0.0          # Host binding (use 0.0.0.0 for production)

# Application URL (IMPORTANT for redirects and webhooks)
APP_URL=http://localhost:5000  # For production: https://yourdomain.com
```

### Security (CRITICAL for Production)
```env
# Session Secret - MUST be a long random string (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secret-random-string-here-change-this-immediately

# JWT Secret (for tokens)
JWT_SECRET=your-jwt-secret-random-string-here
```

---

## 💳 **Stripe Payment Setup** (Required for Payments)

### Step 1: Get Your Stripe Keys

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign up or log in
3. Go to **Developers > API Keys**
4. Copy your keys:

**For Development (Test Mode):**
```env
STRIPE_SECRET_KEY=sk_test_51S8Jk99WGaMBPmpWL...
STRIPE_PUBLISHABLE_KEY=pk_test_51S8Jk99WGaMBPmpWL...
```

**For Production (Live Mode):**
```env
STRIPE_SECRET_KEY=sk_live_51S8Jk99WGaMBPmpWL...
STRIPE_PUBLISHABLE_KEY=pk_live_51S8Jk99WGaMBPmpWL...
```

### Step 2: Test Stripe Integration

1. Add keys to `.env`
2. Restart server
3. Visit `http://localhost:5000/pricing`
4. Click any plan button
5. Use test card: `4242 4242 4242 4242` (any future date, any CVC)

---

## 🗄️ **Database Setup** (Choose One)

### Option 1: PostgreSQL (Recommended for Production)

```env
# PostgreSQL Connection String
DATABASE_URL=postgresql://username:password@localhost:5432/guardiavault

# Or individual components:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=guardiavault
# DB_PASSWORD=your_password
# DB_NAME=guardiavault
# DB_POOL_MAX=20
# DB_POOL_MIN=2
```

**For Railway/Production:**
- Railway will automatically provide `DATABASE_URL`
- Just make sure it's set in your Railway environment variables

### Option 2: In-Memory Storage (Development Only)

If `DATABASE_URL` is not set, the app will use in-memory storage (data lost on restart).

---

## 🔗 **Blockchain Configuration** (Optional - for Smart Contracts)

### Ethereum/Base Sepolia Testnet
```env
# RPC URL for Sepolia testnet
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# or
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Mainnet (Production)
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
```

### Smart Contract Addresses (Optional)
```env
# GuardiaVault Main Contract
GUARDIA_VAULT_CONTRACT_ADDRESS=0x...

# Subscription Escrow Contract
SUBSCRIPTION_ESCROW_CONTRACT_ADDRESS=0x...

# Yield Vault Contract
YIELD_VAULT_ADDRESS=0x...

# Smart Will Contract
SMARTWILL_CONTRACT_ADDRESS=0x...

# Protocol Adapters
LIDO_ADAPTER_ADDRESS=0x...
AAVE_ADAPTER_ADDRESS=0x...
```

### Wallet Keys (Keep Secure!)
```env
# Operator wallet for contract interactions
OPERATOR_PRIVATE_KEY=0x...  # NEVER commit this!

# Keeper wallet for yield automation
KEEPER_PRIVATE_KEY=0x...     # NEVER commit this!

# Oracle private key
ORACLE_PRIVATE_KEY=0x...     # NEVER commit this!
```

---

## 📧 **Email & Notifications** (Optional)

### SendGrid (Recommended)
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@guardiavault.com
```

### Twilio (SMS)
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_FROM=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxx
```

### Telegram (Optional)
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

---

## 🔍 **Death Verification Services** (Optional)

### VitalChek API
```env
VITALCHEK_API_URL=https://api.vitalchek.com/v1
VITALCHEK_API_KEY=your_api_key

# State-specific APIs
CA_VITAL_RECORDS_API=https://api.ca.gov/vital
CA_VITAL_RECORDS_KEY=your_key
TX_VITAL_RECORDS_API=https://api.tx.gov/vital
TX_VITAL_RECORDS_KEY=your_key
```

### Legacy.com / FindAGrave
```env
LEGACY_API_URL=https://api.legacy.com/v1
LEGACY_API_KEY=your_key
FINDAGRAVE_API_URL=https://www.findagrave.com/api
FINDAGRAVE_API_KEY=your_key
```

### Death Verification Settings
```env
DEATH_VERIFICATION_ENABLED=true
DEATH_VERIFICATION_MIN_CONFIDENCE=0.7  # 70% confidence threshold
DEATH_VERIFICATION_MIN_SOURCES=2        # Need 2+ sources
```

---

## 🔐 **Security & Authentication**

### WebAuthn (Biometric Auth)
```env
WEBAUTHN_RP_ID=guardiavault.com          # Your domain
ORIGIN=https://guardiavault.com          # Your app URL
```

### TOTP (Two-Factor Auth)
```env
TOTP_ENCRYPTION_KEY=your-encryption-key-here
```

### Wizard Encryption
```env
WIZARD_ENCRYPTION_KEY=your-wizard-encryption-key
```

---

## 📊 **Monitoring & Logging**

### Sentry (Error Tracking)
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

### Logging
```env
LOG_LEVEL=info  # Options: debug, info, warn, error
```

---

## 🗄️ **File Storage** (Optional)

### AWS S3 (For Evidence Storage)
```env
AWS_S3_BUCKET=guardiavault-evidence
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

---

## 🌐 **CORS & Frontend**

### Allowed Origins
```env
ALLOWED_ORIGINS=https://guardiavault.com,https://www.guardiavault.com

# Netlify (if using)
NETLIFY_SITE_URL=https://your-site.netlify.app
NETLIFY_DEPLOY_URL=https://deploy-preview-xxx.netlify.app
```

---

## 🎛️ **Feature Flags** (Optional)

Enable/disable specific features:

```env
# Web3 Integration
WEB3_INTEGRATION_ENABLED=true

# Hardware Security
HARDWARE_INTEGRATION_ENABLED=false

# AI Sentinel
AI_SENTINEL_ENABLED=false

# Death Verification
DEATH_VERIFICATION_ENABLED=true

# API Documentation (Swagger)
ENABLE_API_DOCS=false  # Set to true to enable /api-docs in production
ENABLE_SWAGGER=false   # Same as above
```

---

## 📝 **Complete Example .env File**

Here's a complete example for **development**:

```env
# ============================================
# CORE CONFIGURATION (REQUIRED)
# ============================================
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
APP_URL=http://localhost:5000

# ============================================
# SECURITY (REQUIRED - CHANGE THESE!)
# ============================================
SESSION_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# ============================================
# STRIPE PAYMENTS (REQUIRED FOR PAYMENTS)
# ============================================
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# ============================================
# DATABASE (REQUIRED FOR PRODUCTION)
# ============================================
# DATABASE_URL=postgresql://user:pass@localhost:5432/guardiavault
# Or leave empty to use in-memory storage (dev only)

# ============================================
# BLOCKCHAIN (OPTIONAL)
# ============================================
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# GUARDIA_VAULT_CONTRACT_ADDRESS=0x...
# SUBSCRIPTION_ESCROW_CONTRACT_ADDRESS=0x...

# ============================================
# EMAIL/NOTIFICATIONS (OPTIONAL)
# ============================================
# SENDGRID_API_KEY=SG.xxx
# SENDGRID_FROM_EMAIL=noreply@guardiavault.com
# TWILIO_ACCOUNT_SID=ACxxx
# TWILIO_AUTH_TOKEN=xxx

# ============================================
# FEATURE FLAGS (OPTIONAL)
# ============================================
DEATH_VERIFICATION_ENABLED=false
WEB3_INTEGRATION_ENABLED=false
ENABLE_API_DOCS=true
```

---

## 🚀 **Setting Up for Production (Railway)**

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add PostgreSQL database
4. Add environment variables (see below)

### Step 2: Add Environment Variables in Railway

Go to your Railway project → **Variables** tab and add:

**Required:**
- `NODE_ENV=production`
- `SESSION_SECRET` (generate with: `openssl rand -base64 32`)
- `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY=sk_live_...` (your LIVE Stripe key)
- `STRIPE_PUBLISHABLE_KEY=pk_live_...` (your LIVE Stripe key)
- `APP_URL=https://your-domain.com` (your production URL)

**Database:**
- Railway automatically provides `DATABASE_URL` when you add PostgreSQL

**Optional but Recommended:**
- `SENTRY_DSN` (for error tracking)
- `SENDGRID_API_KEY` (for emails)
- `LOG_LEVEL=info`

### Step 3: Deploy

Railway will automatically:
- Build your Docker image
- Run migrations
- Start your server
- Health check at `/health`

---

## ✅ **Verification Checklist**

After setting up, verify:

- [ ] Server starts without errors
- [ ] Can access `http://localhost:5000`
- [ ] Health endpoint works: `http://localhost:5000/health`
- [ ] Can register/login
- [ ] Stripe checkout works (test with test card)
- [ ] Database connection works (if using PostgreSQL)

---

## 🔒 **Security Best Practices**

1. **Never commit `.env` to git** (it's in `.gitignore`)
2. **Use strong random secrets**:
   ```bash
   openssl rand -base64 32
   ```
3. **Different secrets for dev/prod**
4. **Rotate secrets regularly**
5. **Use environment-specific keys** (test vs live Stripe keys)

---

## 🐛 **Troubleshooting**

### "Stripe is not configured"
- Check `STRIPE_SECRET_KEY` is set in `.env`
- Restart server after adding

### "Database connection failed"
- Check `DATABASE_URL` format
- Verify database is running
- Check credentials

### "Session secret missing"
- Set `SESSION_SECRET` in `.env`
- Generate with: `openssl rand -base64 32`

### Healthcheck failing
- Ensure `/health` endpoint is accessible
- Check server is listening on correct port
- Verify no middleware is blocking it

---

## 📚 **Additional Resources**

- [Stripe Setup Guide](./docs/STRIPE_SETUP.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Railway Deployment Guide](./docs/RAILWAY_DEPLOYMENT.md)

---

## 🆘 **Need Help?**

- Check server logs for errors
- Verify all required variables are set
- Test endpoints individually
- Check Railway logs if deployed

