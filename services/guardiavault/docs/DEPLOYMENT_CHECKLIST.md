# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All ESLint errors resolved (`npm run lint`)
- [ ] All TypeScript errors resolved (`npm run type-check` if available)
- [ ] All tests passing (`npm run test`)
- [ ] Code coverage >= 80% (`npm run test:coverage`)
- [ ] No critical security vulnerabilities (`npm audit`)

### Contracts
- [ ] All contracts compile successfully (`npm run compile`)
- [ ] Contract tests pass (`npm run test:contracts`)
- [ ] Contracts tested on testnet (Sepolia)
- [ ] Gas optimization review completed
- [ ] Smart contract security audit completed

### Environment
- [ ] `.env` file configured with production values
- [ ] All required environment variables set
- [ ] No development secrets in production config
- [ ] Database migrations applied
- [ ] Database backups configured

## Deployment Steps

### 1. Contract Deployment
- [ ] Deploy GuardiaVault to mainnet
- [ ] Deploy YieldVault to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Set treasury address in YieldVault
- [ ] Link YieldVault to GuardiaVault
- [ ] Test contract interactions

### 2. Infrastructure
- [ ] Database provisioned and configured
- [ ] RPC endpoints configured (Alchemy/Infura)
- [ ] Keeper wallet configured for yield updates
- [ ] Monitoring set up (Sentry, etc.)
- [ ] Logging configured
- [ ] Error tracking enabled

### 3. Backend
- [ ] Server deployed (VPS/Cloud)
- [ ] Environment variables set
- [ ] Database connection tested
- [ ] Cron jobs configured (yield calculation)
- [ ] API endpoints tested
- [ ] Rate limiting configured

### 4. Frontend
- [ ] Build succeeds (`npm run build` in client/)
- [ ] Frontend deployed (Vercel/Netlify/etc.)
- [ ] Environment variables configured
- [ ] Contract addresses set
- [ ] Wallet connection tested
- [ ] All pages load correctly

### 5. Integration
- [ ] Frontend connects to backend API
- [ ] Frontend connects to deployed contracts
- [ ] End-to-end flow tested (create vault, add yield)
- [ ] Guardian system tested
- [ ] Recovery flow tested

## Post-Deployment

### Verification
- [ ] Monitor error logs (first 24 hours)
- [ ] Verify cron jobs running (yield calculator)
- [ ] Check database connectivity
- [ ] Test all critical user flows
- [ ] Monitor gas costs
- [ ] Check contract interactions on Etherscan

### Documentation
- [ ] Update README with deployment info
- [ ] Document contract addresses
- [ ] Update API documentation
- [ ] Create runbook for common issues

### Security
- [ ] Enable 2FA for all admin accounts
- [ ] Secure keeper private keys
- [ ] Review access logs
- [ ] Set up alerts for suspicious activity

## Emergency Procedures

- [ ] Incident response plan documented
- [ ] Contact list for emergencies
- [ ] Rollback procedures tested
- [ ] Backup restore procedures tested

## Monitoring

### Metrics to Track
- [ ] Active vaults count
- [ ] Yield accumulation rate
- [ ] API response times
- [ ] Error rates
- [ ] Gas costs per transaction
- [ ] Database query performance

### Alerts
- [ ] High error rate alert
- [ ] Database connection failure alert
- [ ] Cron job failure alert
- [ ] Contract interaction failure alert
- [ ] Low keeper wallet balance alert

---

**Status:** Ready for production when all items are checked ✅

Last updated: _Date of deployment_
