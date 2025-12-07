# 🚀 Paradex Wallet - Production Deployment Guide

## Pre-Deployment Checklist

### ✅ Completed Checks (37/39 Passed)

- [x] Database connection configured
- [x] JWT & encryption keys set
- [x] All critical API keys configured
- [x] Security headers (Helmet) enabled
- [x] Rate limiting active
- [x] CORS properly configured
- [x] Prisma schema ready
- [x] Build scripts configured
- [x] 50 API route files tested
- [x] 163 endpoints verified
- [x] Frontend build ready
- [x] Documentation complete
- [x] Gitignore properly configured

### ⚠️ Optional (Can deploy without)

- [ ] FLASHBOTS_SIGNING_KEY (MEV protection)
- [ ] SOCKET_API_KEY (Cross-chain bridges)

---

## Deployment Steps

### Step 1: Environment Setup

```bash
# Copy production template
cp .env.production.template .env.production

# Generate secure secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Build

```bash
# Install dependencies
pnpm install

# Build frontend
pnpm build

# Build backend
cd src/backend && pnpm build
```

### Step 3: Database Migration

```bash
# Push schema to production database
pnpm db:push

# Or run migrations
pnpm db:migrate
```

### Step 4: Deploy

#### Option A: Railway (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Option B: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option C: Docker

```bash
# Build image
docker build -t paradex-wallet .

# Run container
docker run -p 3001:3001 --env-file .env.production paradex-wallet
```

---

## Environment Variables Required

### Critical (Must Have)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | 64+ byte hex string |
| `ENCRYPTION_KEY` | 32+ byte hex string |
| `ETHEREUM_RPC_URL` | Alchemy/Infura RPC |

### API Keys (Core Features)

| Variable | Description | Get From |
|----------|-------------|----------|
| `COVALENT_API_KEY` | Wallet data | covalenthq.com |
| `ONEINCH_API_KEY` | Swaps | portal.1inch.dev |
| `ETHERSCAN_API_KEY` | Transactions | etherscan.io |
| `OPENAI_API_KEY` | AI (Scarlett) | platform.openai.com |

### API Keys (Optional Features)

| Variable | Description | Get From |
|----------|-------------|----------|
| `CHANGENOW_API_KEY` | Fiat exchange | changenow.io |
| `FLASHBOTS_SIGNING_KEY` | MEV protection | (generate locally) |
| `SOCKET_API_KEY` | Cross-chain | socket.tech |
| `STRIPE_SECRET_KEY` | Payments | stripe.com |
| `RESEND_API_KEY` | Email | resend.com |

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/health
```

### 2. API Test Suite

```bash
TEST_API_URL=https://your-domain.com npx tsx src/backend/tests/comprehensive-api-test.ts
```

### 3. Database Connectivity

```bash
curl https://your-domain.com/api/test/db/status
```

---

## Security Checklist

- [ ] SSL/TLS certificate installed
- [ ] CORS restricted to your domain
- [ ] Rate limiting configured appropriately
- [ ] All secrets in environment variables (not in code)
- [ ] Database access restricted
- [ ] API keys rotated from development
- [ ] Monitoring/alerting set up

---

## Monitoring & Maintenance

### Recommended Tools

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry
- **Analytics**: Posthog, Mixpanel
- **Logs**: LogTail, Papertrail

### Health Endpoints

- `GET /health` - Server status
- `GET /api/test/db/status` - Database status
- `GET /api/ai/health` - AI service status

---

## Troubleshooting

### Common Issues

**Database connection fails**

```bash
# Check connection string format
postgresql://user:password@host:5432/database?schema=public
```

**401 Unauthorized errors**

```bash
# Ensure JWT_SECRET matches between sessions
# Clear browser localStorage and re-login
```

**Rate limiting (429 errors)**

```bash
# Adjust in server.ts or environment
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

---

## Quick Commands

```bash
# Run deployment readiness check
pnpm check:deploy

# Test all API endpoints
pnpm test:api

# Start in production mode
NODE_ENV=production pnpm start

# View logs
railway logs  # if using Railway
vercel logs   # if using Vercel
```

---

## Support

For deployment issues:

1. Run `pnpm check:deploy` and fix any failures
2. Check server logs for errors
3. Verify all environment variables are set

---

**Ready to deploy! 🚀**
