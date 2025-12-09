# GuardiaVault Production Deployment Guide

## Quick Start

### 1. Database Setup

```bash
# Run migrations
psql $DATABASE_URL -f migrations/000_base_schema.sql
psql $DATABASE_URL -f migrations/010_production_features.sql
```

### 2. Environment Variables

#### Backend (Railway)
```env
# Core
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...

# Security
SESSION_SECRET=<generate-secure-secret>
JWT_SECRET=<generate-secure-secret>
ENCRYPTION_KEY=<generate-32-byte-key>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Blockchain
SEPOLIA_RPC_URL=https://...
MAINNET_RPC_URL=https://...
CHAIN_ID=11155111
GUARDIA_VAULT_ADDRESS=0x...
YIELD_VAULT_ADDRESS=0x...

# WalletConnect
WALLETCONNECT_PROJECT_ID=...

# Email/SMS
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Alchemy/Infura
ALCHEMY_API_KEY=...
INFURA_API_KEY=...

# Admin
ADMIN_EMAILS=admin1@example.com,admin2@example.com

# Internal Auth (for DCA execution)
INTERNAL_AUTH_TOKEN=<generate-secure-token>

# Optional: OpenAI (for AI Optimizer)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Optional: Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Optional: Canvas (for OG images)
# Install via: npm install canvas
```

#### Frontend (Netlify)
```env
VITE_API_URL=https://guardiavault-production.up.railway.app
VITE_GUARDIA_VAULT_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://...
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
NODE_ENV=production
```

### 3. Railway Deployment

1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to `main`

### 4. Netlify Deployment

1. Connect GitHub repository
2. Build command: `cd client && npm run build`
3. Publish directory: `client/dist`
4. Set environment variables
5. Deploy automatically on push to `main`

## Production Checklist

### Database
- [ ] Run all migrations
- [ ] Verify indexes created
- [ ] Set up database backups
- [ ] Configure connection pooling

### Security
- [ ] All secrets in environment variables
- [ ] SESSION_SECRET set (32+ characters)
- [ ] JWT_SECRET set (32+ characters)
- [ ] ENCRYPTION_KEY set (32 bytes)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured

### APIs & Services
- [ ] Stripe webhook endpoint configured
- [ ] SendGrid email verified
- [ ] Twilio account activated
- [ ] Alchemy/Infura API keys set
- [ ] WalletConnect project ID configured
- [ ] OpenAI API key (optional, for AI optimizer)
- [ ] Firebase service account (optional, for push notifications)

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Health check endpoint working (`/health`)
- [ ] Logging configured
- [ ] Admin dashboard accessible

### Testing
- [ ] Run test suite: `npm test`
- [ ] Test real-time APY endpoints
- [ ] Test yield optimizer
- [ ] Test referral program
- [ ] Test achievement system
- [ ] Test admin dashboard

## Post-Deployment

### 1. Verify Services
```bash
# Health check
curl https://your-backend-url/health

# Test API
curl https://your-backend-url/api/yield/strategies/realtime
```

### 2. Create Admin User
```sql
-- Set admin email in environment variable
-- Or manually update user in database
UPDATE users SET email = 'admin@example.com' WHERE id = 'user-id';
```

### 3. Start Background Services
Background services start automatically:
- Yield snapshot cron (hourly)
- Protocol health monitoring (every 5 minutes)
- Yield challenge cron (hourly)

### 4. Monitor Logs
- Railway: Check logs in dashboard
- Sentry: Monitor error tracking
- Admin dashboard: System health at `/api/admin/health`

## Troubleshooting

### Health Check Failing
1. Check database connection
2. Verify environment variables
3. Check server logs
4. Ensure migrations ran

### API Errors
1. Check Sentry for error details
2. Verify API keys are set
3. Check rate limiting
4. Review error logs

### Performance Issues
1. Check database query performance
2. Monitor API rate limits
3. Review caching strategy
4. Check background job performance

## Support

For issues, check:
- Server logs in Railway
- Sentry error tracking
- Admin dashboard system health
- Database connection status

