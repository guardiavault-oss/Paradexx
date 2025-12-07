# 🚀 Production Environment Setup Guide

## ✅ Generated Secrets

I've generated cryptographically secure secrets for your production environment. These are stored in `.env.production`.

**Generated Secrets:**
- ✅ SESSION_SECRET (32 bytes, base64)
- ✅ JWT_SECRET (32 bytes, base64)
- ✅ ENCRYPTION_KEY (32 bytes, hex)
- ✅ SSN_SALT (16 bytes, hex)
- ✅ NOTIFY_HMAC_SECRET (32 bytes, base64)
- ✅ TOTP_ENCRYPTION_KEY (32 bytes, hex)
- ✅ WIZARD_ENCRYPTION_KEY (32 bytes, hex)

## 📋 Setup Steps

### Step 1: Copy the Production .env File

```bash
cp .env.production .env
```

### Step 2: Replace Placeholder Values

Open `.env` and replace all `YOUR_*` placeholders:

#### **Required Replacements:**

1. **APP_URL** - Your production domain
   ```env
   APP_URL=https://guardiavault.com
   ```

2. **DATABASE_URL** - Railway will provide this automatically
   - Go to Railway dashboard → Your PostgreSQL service → Variables
   - Copy the `DATABASE_URL` value
   - Paste it into your `.env`

3. **STRIPE_SECRET_KEY** - Your LIVE Stripe key
   ```env
   STRIPE_SECRET_KEY=sk_live_51S8Jk99WGaMBPmpWL...
   ```
   - Get from: https://dashboard.stripe.com/apikeys
   - **IMPORTANT**: Use LIVE keys (`sk_live_...`) not test keys

4. **STRIPE_PUBLISHABLE_KEY** - Your LIVE publishable key
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_live_51S8Jk99WGaMBPmpWL...
   ```

5. **SENDGRID_API_KEY** - For email notifications
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
   - Get from: https://sendgrid.com → Settings → API Keys

6. **SENDGRID_FROM_EMAIL** - Verified sender email
   ```env
   SENDGRID_FROM_EMAIL=noreply@guardiavault.com
   ```
   - Must be verified in SendGrid dashboard

7. **ALLOWED_ORIGINS** - Your production domain
   ```env
   ALLOWED_ORIGINS=https://guardiavault.com,https://www.guardiavault.com
   ```

#### **Additional Recommended:**

14. **SENTRY_DSN** - For error tracking
    ```env
    SENTRY_DSN=https://YOUR_KEY@YOUR_ORG.ingest.sentry.io/YOUR_PROJECT_ID
    ```
    - Get from: https://sentry.io → Create project → Get DSN
    - Free tier: 5,000 events/month

16. **Smart Contract Addresses** - After deploying contracts
    - Update all contract addresses after deployment

## 🔒 Security Checklist

Before deploying to production:

- [ ] All secrets are replaced (no `YOUR_*` placeholders)
- [ ] Using LIVE Stripe keys (`sk_live_...` not `sk_test_...`)
- [ ] `NODE_ENV=production` is set
- [ ] `ENABLE_API_DOCS=false` (security)
- [ ] `LOG_LEVEL=info` (not debug)
- [ ] All private keys are for dedicated wallets (not main wallet)
- [ ] Database URL is set (Railway provides automatically)
- [ ] Email domain is verified in SendGrid
- [ ] Twilio phone number is purchased and verified
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` is set (REQUIRED for wallets)
- [ ] RPC URLs are set (Alchemy or Infura)
- [ ] CORS origins match your production domain
- [ ] Secrets are stored securely (Railway environment variables)

## 🚂 Railway Deployment

### Method 1: Environment Variables (Recommended)

1. Go to Railway dashboard
2. Select your project
3. Go to **Variables** tab
4. Add each variable from `.env.production`
5. Railway will automatically use these on deploy

### Method 2: .env File

1. Upload `.env.production` to Railway
2. Railway will automatically load it

**Note:** Railway automatically provides:
- `PORT` (don't override)
- `DATABASE_URL` (if you added PostgreSQL)

## 🧪 Testing Production Config

Before going fully live:

1. **Test Stripe Checkout:**
   - Use LIVE test mode first
   - Verify webhook endpoints work
   - Test with real card (small amount)

2. **Test Email Delivery:**
   - Send test emails
   - Verify sender domain
   - Check spam folder

3. **Test Database:**
   - Verify connections work
   - Test migrations
   - Check query performance

4. **Test Health Endpoint:**
   ```bash
   curl https://your-domain.com/health
   ```
   Should return: `{"status":"ok",...}`

## 📝 Important Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`

2. **Backup your secrets** - Store in a password manager:
   - 1Password
   - LastPass
   - Bitwarden
   - Railway's built-in secrets

3. **Rotate secrets periodically** - Especially:
   - SESSION_SECRET (monthly)
   - Private keys (if compromised)
   - API keys (if exposed)

4. **Monitor Stripe Dashboard** - Watch for:
   - Failed payments
   - Unusual activity
   - Webhook delivery issues

5. **Monitor Sentry** - Watch for:
   - Error rates
   - Performance issues
   - Security alerts

## 🆘 Troubleshooting

### "Stripe is not configured"
- Check `STRIPE_SECRET_KEY` is set
- Verify it's a LIVE key (`sk_live_...`)
- Restart server after adding

### "Database connection failed"
- Verify `DATABASE_URL` format
- Check Railway PostgreSQL is running
- Verify credentials

### "Healthcheck failing"
- Check `/health` endpoint is accessible
- Verify server is listening
- Check Railway logs

### "Email not sending"
- Verify SendGrid API key
- Check sender email is verified
- Check SendGrid dashboard for errors

## 📚 Next Steps

1. ✅ Replace all placeholder values
2. ✅ Deploy to Railway
3. ✅ Test health endpoint
4. ✅ Test payment flow
5. ✅ Test email delivery
6. ✅ Monitor logs and errors
7. ✅ Set up alerts (Sentry, Stripe)

---

**Your production `.env` file is ready at `.env.production`**

Just replace the placeholders and deploy! 🚀

