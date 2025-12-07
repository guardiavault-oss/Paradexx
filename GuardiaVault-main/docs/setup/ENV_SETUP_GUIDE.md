# Complete .env Setup Guide

## Quick Start

1. **Copy the `.env` file** (already created for you)
2. **Fill in the REQUIRED values** (see below)
3. **Optionally fill in OPTIONAL values** for features you want to use
4. **Never commit `.env` to git!** (already in `.gitignore`)

## ✅ Required Settings (Must Fill)

These are **absolutely required** for the application to run:

### 1. Database Connection
```env
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
```

**What to put:**
- **Local PostgreSQL:** `postgresql://postgres:your_password@localhost:5432/guardiavault`
- **Docker (default):** `postgresql://guardiavault:changeme@localhost:5432/guardiavault`
- **Neon:** Get connection string from Neon dashboard
- **Other cloud:** Use their connection string format

**How to test:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### 2. Session Secret
```env
SESSION_SECRET=dev-secret-change-in-production-PLEASE-CHANGE-THIS
```

**What to put:**
Generate a random string:
```bash
# Linux/Mac:
openssl rand -base64 32

# PowerShell:
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

**Must be changed in production!**

### 3. Node Environment
```env
NODE_ENV=development
```

**Options:**
- `development` - Local development
- `staging` - Staging environment
- `production` - Production

## 🔧 Core Settings (Recommended)

### Server Port & Host
```env
PORT=5000
HOST=localhost
APP_URL=http://localhost:5000
```

**For Docker:** Use `HOST=0.0.0.0`

### Encryption Keys

**SSN Salt:**
```bash
# Generate random salt:
openssl rand -base64 16
```
Put result in: `SSN_SALT=...`

**Encryption Key (64 hex characters):**
```bash
# Generate 32-byte key:
openssl rand -hex 32
```
Put result in: `ENCRYPTION_KEY=...`

## 📱 Frontend / Blockchain (Required After Deployment)

### Smart Contract Address
```env
VITE_GUARDIA_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
```

**What to put:**
1. Deploy your GuardiaVault contract
2. Copy the deployed address
3. Put it here

**Deployment command:**
```bash
pnpm run deploy:local    # For Hardhat local
pnpm run deploy:sepolia # For Sepolia testnet
```

### Blockchain Network
```env
VITE_CHAIN_ID=31337
```

**Options:**
- `31337` - Hardhat local network
- `11155111` - Sepolia testnet (Ethereum testnet)
- `1` - Ethereum mainnet (production)

### RPC URLs
```env
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

**How to get:**
1. Sign up at [Infura](https://infura.io) or [Alchemy](https://alchemy.com)
2. Create a project
3. Copy the RPC URL
4. Replace `YOUR_PROJECT_ID` with your actual project ID

## 💰 Optional Services

### Email (SendGrid) - Recommended

**Why:** Email notifications, password resets, etc.

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier available)
2. Go to Settings > API Keys
3. Create API Key (Full Access)
4. Copy the key
5. Verify your sender email

```env
SENDGRID_API_KEY=SG.your_actual_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### SMS (Twilio) - Optional

**Why:** SMS notifications for check-ins, alerts, etc.

**Setup:**
1. Sign up at [twilio.com](https://www.twilio.com/try-twilio) (free trial)
2. Get Account SID and Auth Token from Console
3. Buy a phone number ($1-2/month)

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Payments (Stripe) - Recommended

**Why:** Subscription payments for protection plans

**Setup:**
1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard > Developers > API keys
3. Use test keys (`sk_test_...`) for development
4. Create products/prices in Dashboard

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_FAMILY=price_...
STRIPE_PRICE_PRO=price_...
```

### Error Tracking (Sentry) - Recommended

**Why:** Monitor errors and crashes in production

**Setup:**
1. Sign up at [sentry.io](https://sentry.io) (free tier)
2. Create a project
3. Copy the DSN

```env
SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/project_id
```

### Death Verification Services - Advanced

**Only needed if:** You want SSDI monitoring, obituary search, death certificate verification

**Services needed:**
1. **GenealogyBank** - SSDI API ($500/month)
2. **Legacy.com** - Obituary API
3. **VitalChek** - Death certificate ordering
4. **State APIs** - Direct vital records access (varies by state)

**Cost:** Can be expensive. Only enable if you have budget and legal approval.

```env
DEATH_VERIFICATION_ENABLED=false  # Set to true when ready
SSDI_API_KEY=your_key
LEGACY_API_KEY=your_key
VITALCHEK_API_KEY=your_key
```

## 🔒 Security Checklist

Before going to production:

- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Change `DB_PASSWORD` to a secure password
- [ ] Generate new `SSN_SALT` and `ENCRYPTION_KEY`
- [ ] Use production Stripe keys (`sk_live_...`)
- [ ] Use production RPC URLs
- [ ] Set `NODE_ENV=production`
- [ ] Update `APP_URL` to your production domain
- [ ] Verify all API keys are production keys
- [ ] Enable Sentry for error tracking
- [ ] Review all optional services and remove unused ones

## 🧪 Testing Your Configuration

### Test Database Connection
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Test Environment Loading
```bash
# Start server (should load .env automatically)
pnpm run dev

# Check logs - should show no DATABASE_URL errors
```

### Test Migration
```bash
pnpm run db:migrate:death-verification
```

## 📝 Example Configurations

### Minimal (Just Database)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/guardiavault
SESSION_SECRET=some-random-secret-change-this
NODE_ENV=development
```

### Development (Full Features)
```env
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
SESSION_SECRET=dev-secret-generated-with-openssl
NODE_ENV=development
SENDGRID_API_KEY=SG.test_key
STRIPE_SECRET_KEY=sk_test_...
SENTRY_DSN=https://...
```

### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:secure_password@prod-db:5432/guardiavault
SESSION_SECRET=production-secret-generated-with-openssl-rand
APP_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=https://...prod...
LOG_LEVEL=info
```

## ❓ Common Issues

### "DATABASE_URL not set"
- Make sure `.env` file exists in root directory
- Check the file has `DATABASE_URL=...` line
- No spaces around `=`
- Don't use quotes unless needed (and then escape properly)

### "Connection refused"
- Database not running? Start it: `docker-compose up -d postgres`
- Wrong host/port in `DATABASE_URL`?
- Firewall blocking connection?

### "Invalid session secret"
- Make sure `SESSION_SECRET` is set
- Use a strong random string (not "secret" or "123")

### Environment variables not loading
- Make sure `.env` is in the root directory
- Restart your server after changing `.env`
- Check for typos in variable names

## 🔗 Resources

- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [SendGrid Setup](https://docs.sendgrid.com/for-developers/sending-email/api-getting-started)
- [Stripe Setup](https://stripe.com/docs/keys)
- [Infura RPC](https://infura.io/docs)
- [Twilio Setup](https://www.twilio.com/docs/usage/tutorials)

