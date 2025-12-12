# 🚀 Deployment Checklist Summary

**Quick reference for deploying Paradex Wallet to production**

---

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (CRITICAL)

**Required:**
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - 64+ character random hex string
- [ ] `ENCRYPTION_KEY` - 64 hex characters (32 bytes)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001` (or Railway auto-assigned)

**Core Features:**
- [ ] `COVALENT_API_KEY` - Wallet data (covalenthq.com)
- [ ] `ONEINCH_API_KEY` - Token swaps (portal.1inch.dev)
- [ ] `ETHERSCAN_API_KEY` - Transaction data (etherscan.io)
- [ ] `ALCHEMY_API_KEY` - Blockchain RPC (alchemy.com)
- [ ] `INFURA_API_KEY` - Blockchain RPC (infura.io)

**Frontend (VITE_*):**
- [ ] `VITE_API_URL` - Backend API URL
- [ ] `VITE_WS_URL` - WebSocket URL
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` - WalletConnect

**Optional (Enhanced Features):**
- [ ] `OPENAI_API_KEY` - AI features
- [ ] `STRIPE_SECRET_KEY` - Payments
- [ ] `RESEND_API_KEY` - Email notifications
- [ ] `CHANGENOW_API_KEY` - Fiat exchange

### 2. Database Setup

- [ ] Create production PostgreSQL database
- [ ] Set `DATABASE_URL` environment variable
- [ ] Run migrations: `pnpm db:migrate`
- [ ] Verify connection: `pnpm test:api`

### 3. Build Verification

- [ ] Install dependencies: `pnpm install --frozen-lockfile`
- [ ] Build frontend: `pnpm build`
- [ ] Build backend: `cd src/backend && npm run build`
- [ ] Verify build outputs exist

### 4. Security Configuration

- [ ] Generate secure secrets (not placeholders)
- [ ] Configure CORS origins (production domains)
- [ ] Verify rate limiting enabled
- [ ] Check security headers configured

---

## 🚀 Deployment Steps

### Backend (Railway)

1. [ ] Create Railway account
2. [ ] New Project → Deploy from GitHub
3. [ ] Add PostgreSQL service
4. [ ] Configure environment variables
5. [ ] Deploy and verify health check

### Frontend (Netlify)

1. [ ] Create Netlify account
2. [ ] New site → Import from Git
3. [ ] Set build: `pnpm build`
4. [ ] Set publish: `build`
5. [ ] Configure environment variables
6. [ ] Deploy and verify site loads

### Alternative: Docker

1. [ ] Configure `.env.production`
2. [ ] Run: `docker-compose up -d`
3. [ ] Verify services healthy
4. [ ] Configure reverse proxy (Nginx)

---

## ✅ Post-Deployment Verification

- [ ] Health check: `GET /health` returns 200
- [ ] Database: `GET /api/test/db/status` returns 200
- [ ] Frontend loads without errors
- [ ] API connection works
- [ ] Authentication flow works
- [ ] Critical features functional

---

## 📋 Quick Commands

```bash
# Generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Build
pnpm build
cd src/backend && npm run build

# Database
pnpm db:migrate
pnpm test:api

# Deployment check
pnpm check:deploy

# Docker
docker-compose up -d
docker-compose logs -f
```

---

## 🔗 Resources

- Full Audit: `docs/DEPLOYMENT_AUDIT.md`
- Deployment Guide: `docs/setup/DEPLOYMENT.md`
- Production Checklist: `docs/deployment/PRODUCTION_CHECKLIST.md`

---

**Status:** ✅ Ready for Deployment  
**Last Updated:** December 2025

