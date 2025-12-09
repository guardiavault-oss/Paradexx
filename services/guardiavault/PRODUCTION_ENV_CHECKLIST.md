# Production Environment Variables Checklist

## ✅ **REQUIRED - Application Will NOT Start Without These**

These are **CRITICAL** and will cause the application to crash if missing or invalid:

### 1. **NODE_ENV** 
```env
NODE_ENV=production
```
- ✅ Must be set to `production` for production deployment
- ❌ Will fail if not set or invalid value

### 2. **SESSION_SECRET** 
```env
SESSION_SECRET=<your-generated-secret-here>
```
- ✅ Must be at least 32 characters
- ✅ Must NOT be a default/placeholder value
- ❌ Will fail if:
  - Not set
  - Less than 32 characters
  - Contains "dev-secret-change-in-production-PLEASE-CHANGE-THIS"
  - Contains "test-secret" or "development-secret"

**Generate:**
```bash
openssl rand -base64 32
```

### 3. **WIZARD_ENCRYPTION_KEY** 
```env
WIZARD_ENCRYPTION_KEY=<64-hex-characters>
```
- ✅ Must be exactly 64 hex characters (32 bytes)
- ✅ Must NOT contain "change" or "default" in the value
- ❌ Will fail if:
  - Not set
  - Not 64 hex characters
  - Contains placeholder text

**Generate:**
```bash
openssl rand -hex 32
```

### 4. **ENCRYPTION_KEY** (Production Only)
```env
ENCRYPTION_KEY=<64-hex-characters>
```
- ✅ Required in production (NODE_ENV=production)
- ✅ Must be exactly 64 hex characters (32 bytes)
- ✅ Must NOT contain "change" or "default"
- ❌ Will fail in production if not set or invalid

**Generate:**
```bash
openssl rand -hex 32
```

### 5. **SSN_SALT** (Production Only)
```env
SSN_SALT=<at-least-16-characters>
```
- ✅ Required in production (NODE_ENV=production)
- ✅ Must be at least 16 characters
- ✅ Must NOT contain "change" or "default"
- ❌ Will fail in production if not set or invalid

**Generate:**
```bash
openssl rand -base64 16
```

## ⚠️ **HIGHLY RECOMMENDED**

These are optional but **strongly recommended** for production:

### 6. **DATABASE_URL**
```env
DATABASE_URL=postgresql://user:password@host:port/database
```
- ⚠️ Optional but needed for database features
- If not set, application uses in-memory storage (data lost on restart)
- ✅ Should be set for production

### 7. **APP_URL**
```env
APP_URL=https://guardiavault.com
```
- ⚠️ Used for CORS, webhooks, email links
- ✅ Should match your production domain

### 8. **NOTIFY_HMAC_SECRET**
```env
NOTIFY_HMAC_SECRET=<random-secret>
```
- ⚠️ Used for guardian invitation tokens
- ✅ Recommended for production

**Generate:**
```bash
openssl rand -base64 32
```

## 📋 **OPTIONAL - Features Will Work Without These**

These enable additional features but the app will work without them:

### Email Services
- `SENDGRID_API_KEY` - Email notifications
- `SENDGRID_FROM_EMAIL` - Sender email address

### SMS Services
- `TWILIO_ACCOUNT_SID` - SMS notifications
- `TWILIO_AUTH_TOKEN` - SMS authentication
- `TWILIO_PHONE_NUMBER` - SMS sender number

### Payment Processing
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_PUBLISHABLE_KEY` - Stripe integration

### Blockchain/Smart Contracts
- `GUARDIA_VAULT_CONTRACT_ADDRESS` - Smart contract address (runs in test mode if not set)
- `ORACLE_PRIVATE_KEY` - Death oracle on-chain submissions (won't submit if not set)
- `VITE_GUARDIA_VAULT_ADDRESS` - Frontend contract address
- `VITE_CHAIN_ID` - Blockchain network ID

### Monitoring
- `SENTRY_DSN` - Error tracking
- `VITE_SENTRY_DSN` - Frontend error tracking

### Other Services
- `OPENAI_API_KEY` - AI optimizer (uses fallback if not set)
- `VITE_ALCHEMY_API_KEY` - NFT fetching
- `VITE_WALLETCONNECT_PROJECT_ID` - Wallet connections

## 🚫 **MUST NOT BE SET IN PRODUCTION**

```env
DEMO_ACCOUNT_ENABLED=false  # Must be false or not set in production
```

## Quick Check Script

You can verify your production environment with:

```powershell
# Check required variables
if (-not $env:NODE_ENV) { Write-Host "❌ NODE_ENV not set" }
if (-not $env:SESSION_SECRET) { Write-Host "❌ SESSION_SECRET not set" }
if (-not $env:WIZARD_ENCRYPTION_KEY) { Write-Host "❌ WIZARD_ENCRYPTION_KEY not set" }
if ($env:NODE_ENV -eq "production") {
    if (-not $env:ENCRYPTION_KEY) { Write-Host "❌ ENCRYPTION_KEY not set (required in production)" }
    if (-not $env:SSN_SALT) { Write-Host "❌ SSN_SALT not set (required in production)" }
}
```

## Current Status Based on Logs

From your production logs, I can see:
- ✅ `DATABASE_URL` is configured
- ⚠️ `GUARDIA_VAULT_CONTRACT_ADDRESS` not set (runs in test mode)
- ⚠️ `ORACLE_PRIVATE_KEY` not set (oracle won't submit on-chain)
- ⚠️ `OPENAI_API_KEY` not set (uses fallback)

**These are OK** - the app will work, just with limited functionality.

## Action Required

**Before deploying to production, you MUST set:**

1. ✅ `NODE_ENV=production`
2. ✅ `SESSION_SECRET` (generate secure value)
3. ✅ `WIZARD_ENCRYPTION_KEY` (generate secure value)
4. ✅ `ENCRYPTION_KEY` (generate secure value - production only)
5. ✅ `SSN_SALT` (generate secure value - production only)
6. ✅ `DATABASE_URL` (already set ✅)
7. ✅ `APP_URL` (set to your production URL)
8. ✅ `NOTIFY_HMAC_SECRET` (recommended)

**Generate all secrets:**
```bash
# SESSION_SECRET
openssl rand -base64 32

# WIZARD_ENCRYPTION_KEY
openssl rand -hex 32

# ENCRYPTION_KEY
openssl rand -hex 32

# SSN_SALT
openssl rand -base64 16

# NOTIFY_HMAC_SECRET
openssl rand -base64 32
```

## Summary

**For successful production deployment, you need:**
- ✅ 5 REQUIRED variables (NODE_ENV, SESSION_SECRET, WIZARD_ENCRYPTION_KEY, ENCRYPTION_KEY, SSN_SALT)
- ✅ DATABASE_URL (already set)
- ✅ APP_URL (set to production URL)
- ✅ NOTIFY_HMAC_SECRET (recommended)

**The application will NOT start if required variables are missing or invalid.**

