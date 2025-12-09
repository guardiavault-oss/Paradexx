# Production Deployment Guide

This guide consolidates all production deployment information.

## Quick Links

- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Comprehensive checklist
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Step-by-step instructions
- [Contract Deployment](./DEPLOY_CONTRACTS.md) - Smart contract deployment
- [Quick Deploy](./DEPLOYMENT_QUICKSTART.md) - Fastest path to production

## Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Smart contracts audited
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/HTTPS configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

## Deployment Platforms

### Recommended
- **Railway** - Easy PostgreSQL + Node.js hosting
- **Vercel** - Frontend hosting
- **Netlify** - Alternative frontend hosting

### Smart Contracts
- Deploy to **Sepolia testnet** first
- Test thoroughly
- Deploy to **Ethereum mainnet** after audit

## See Also

- [Database Setup](../setup/DATABASE_SETUP_FIX.md)
- [Environment Setup](../setup/ENV_SETUP_GUIDE.md)
- [Security Setup](../security/SECURITY_SETUP.md)

