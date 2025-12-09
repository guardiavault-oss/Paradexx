# Production Deployment Checklist

This document provides a comprehensive checklist for deploying ParaDex Wallet to production.

## Pre-Deployment Checklist

### 1. Code Quality ✅

- [ ] All tests passing (`pnpm test:ci`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors in critical paths
- [ ] ESLint warnings addressed
- [ ] Dependencies up to date and audited

### 2. Environment Variables

Ensure all required environment variables are configured:

```bash
# Required - API & Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<32+ character random string>

# Required - Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Required - Blockchain
INFURA_API_KEY=<your-infura-key>
ALCHEMY_API_KEY=<your-alchemy-key>

# Required - Payment Providers
ONRAMPER_API_KEY=<your-onramper-key>
CHANGENOW_API_KEY=<your-changenow-key>

# Required - Profit Routing
PROFIT_WALLET_ADDRESS=<your-profit-wallet>
PROFIT_ROUTING_ENABLED=true

# Optional - Email
SMTP_HOST=<smtp-server>
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASSWORD=<smtp-password>

# Optional - AI
OPENAI_API_KEY=<your-openai-key>
```

### 3. Security Configuration

- [ ] JWT_SECRET is cryptographically secure (32+ characters)
- [ ] All API keys are rotated from development keys
- [ ] Database credentials are production-grade
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] Security headers configured (see Netlify/Nginx config)

### 4. Database Setup

```bash
# Run migrations
pnpm db:migrate

# Verify schema
pnpm db:push

# Test connection
cd src/backend && pnpm test:api
```

### 5. SSL/TLS

- [ ] SSL certificate installed
- [ ] HTTPS enforced
- [ ] HSTS header enabled
- [ ] Certificate auto-renewal configured

## Deployment Methods

### Netlify (Frontend)

1. Connect repository to Netlify
2. Set build command: `pnpm build`
3. Set publish directory: `build`
4. Configure environment variables
5. Deploy

### Railway (Backend)

1. Connect repository to Railway
2. Set start command: `cd src/backend && npm start`
3. Configure environment variables
4. Add PostgreSQL and Redis services
5. Deploy

### Docker (Self-Hosted)

```bash
# Build and start all services
docker-compose -f docker-compose.yml up -d

# Check health
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Kubernetes (Enterprise)

See `config/kubernetes/` for Helm charts and manifests.

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend
curl https://your-domain.com

# Backend API
curl https://api.your-domain.com/health

# Database connectivity
curl https://api.your-domain.com/api/status
```

### 2. Functional Tests

- [ ] User registration works
- [ ] User login works
- [ ] Wallet connection works
- [ ] Token display works
- [ ] Transaction signing works
- [ ] Payment flow works (test mode)

### 3. Security Scan

```bash
# Run security audit
pnpm audit

# Check for known vulnerabilities
npx snyk test
```

### 4. Performance Check

- [ ] Lighthouse score > 80
- [ ] Core Web Vitals passing
- [ ] API response time < 200ms
- [ ] Database query time < 50ms

## Monitoring Setup

### 1. Error Tracking

Configure Sentry or similar:

```typescript
// Add to main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: 'production',
  tracesSampleRate: 0.1,
});
```

### 2. Analytics

Configure PostHog or similar:

```typescript
// Add to main.tsx
import posthog from 'posthog-js';

posthog.init('your-posthog-key', {
  api_host: 'https://app.posthog.com',
});
```

### 3. Uptime Monitoring

Configure BetterUptime, Pingdom, or similar for:
- Frontend: `https://your-domain.com`
- API: `https://api.your-domain.com/health`
- WebSocket: `wss://api.your-domain.com/ws`

## Rollback Plan

### Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
git push origin main

# Or rollback via platform
# Netlify: Use deployment history
# Railway: Use deployment history
```

### Database Rollback

```bash
# List migrations
npx prisma migrate status

# Rollback specific migration
npx prisma migrate rollback --name <migration-name>
```

## Emergency Contacts

| Role | Contact |
|------|---------|
| DevOps Lead | devops@your-company.com |
| Backend Lead | backend@your-company.com |
| Security | security@your-company.com |
| On-Call | +1-xxx-xxx-xxxx |

## Deployment Sign-Off

| Item | Verified By | Date |
|------|-------------|------|
| Code Review | | |
| Security Review | | |
| QA Testing | | |
| Performance Testing | | |
| Final Approval | | |

---

**Remember:** Always deploy during low-traffic periods and have a rollback plan ready.
