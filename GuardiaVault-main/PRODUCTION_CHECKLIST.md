# Production Deployment Checklist for GuardiaVault

**Version:** 1.0
**Last Updated:** 2025-11-07

This comprehensive checklist ensures GuardiaVault is production-ready with optimal performance, security, and reliability.

---

## 🔒 Security

### API Keys & Secrets
- [ ] Rotate all API keys (Infura, Alchemy, Pinata/IPFS, SendGrid)
- [ ] Generate new JWT_SECRET and SESSION_SECRET
- [ ] Remove all exposed secrets from git history (`git-secrets` scan)
- [ ] Set up secret management (AWS Secrets Manager / HashiCorp Vault / Replit Secrets)
- [ ] Verify `.env.example` doesn't contain real secrets
- [ ] Enable 2FA for all admin accounts
- [ ] Enable 2FA for deployment accounts (Vercel/AWS/etc.)

### Access Control
- [ ] Review and update CORS whitelist in `server/middleware/security.ts`
- [ ] Verify admin routes require authentication AND admin role
- [ ] Test unauthorized access to protected endpoints (401/403 responses)
- [ ] Enable rate limiting on all endpoints (already in `server/middleware/rateLimiter.ts`)
- [ ] Configure CSP headers properly (check `server/middleware/csp.ts`)
- [ ] Set secure session cookie settings (`secure: true`, `httpOnly: true`, `sameSite: 'strict'`)

### Security Audit
- [ ] Run security audit: `pnpm run audit:security`
- [ ] Review all dependencies for vulnerabilities: `pnpm audit --audit-level=moderate`
- [ ] Update vulnerable dependencies
- [ ] Run OWASP ZAP scan (see `tests/security/README.md`)
- [ ] Review security headers with [securityheaders.com](https://securityheaders.com)
- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Test CSRF protection
- [ ] Verify input validation on all endpoints

---

## 💾 Database

### Migration & Optimization
- [ ] **CRITICAL:** Backup production database before deployment
- [ ] Run all pending migrations: `pnpm run db:migrate`
- [ ] Run performance indexes: `tsx server/scripts/add-performance-indexes.ts`
- [ ] Verify indexes created successfully with `\di` in psql
- [ ] Test database connection pooling (max connections configured)
- [ ] Configure automatic backups (daily minimum)
- [ ] Test database restore procedure
- [ ] Document database rollback procedure

### Performance
- [ ] Run query performance audit: `pnpm run test:query-performance`
- [ ] Verify no N+1 query patterns in critical paths
- [ ] Enable query logging for slow queries (>100ms)
- [ ] Configure connection pool size based on expected load
- [ ] Test database failover if using replicas

---

## 🚀 Testing

### Unit & Integration Tests
- [ ] All unit tests pass: `pnpm run test:unit`
- [ ] All integration tests pass: `pnpm run test:integration`
- [ ] All E2E tests pass: `pnpm run test:e2e`
- [ ] Smart contract tests pass: `pnpm run test:contracts`
- [ ] Test coverage >80% on critical paths: `pnpm run test:coverage`

### Performance Testing
- [ ] Load testing completed: `pnpm run test:load`
- [ ] System handles 1000 concurrent users
- [ ] Response times <500ms for critical endpoints
- [ ] Database queries optimized (check slow query log)
- [ ] No memory leaks detected

### Security Testing
- [ ] Security testing completed: `pnpm run test:security`
- [ ] Penetration testing completed (if applicable)
- [ ] Zero critical or high vulnerabilities
- [ ] Input validation tested on all forms
- [ ] Authentication bypass tests passed

### Smoke Tests
- [ ] Smoke tests pass: `pnpm run test:smoke`
- [ ] Health check endpoint responding: `/api/health`
- [ ] All critical user flows tested:
  - [ ] User registration/login
  - [ ] Vault creation
  - [ ] Guardian invitation
  - [ ] Recovery initiation
  - [ ] Beneficiary claims

---

## ⚡ Performance

### Frontend Optimization
- [ ] Bundle size <1MB (check with `pnpm run build:analyze`)
- [ ] Lighthouse score >90 for all pages
- [ ] Page load time <2 seconds
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3.5s
- [ ] Images optimized (WebP format, lazy loading)
- [ ] Fonts optimized (font-display: swap)
- [ ] Service worker registered for PWA

### Backend Optimization
- [ ] Redis caching configured and tested
- [ ] Cache hit rate >50% for frequent queries
- [ ] API response times <200ms (95th percentile)
- [ ] Database queries optimized with indexes
- [ ] Compression enabled (gzip/brotli)
- [ ] CDN configured for static assets

### Build Verification
- [ ] Production build succeeds: `pnpm run build`
- [ ] Build artifacts verified: `pnpm run verify:build`
- [ ] Sourcemaps generated (for error tracking only)
- [ ] Console logs removed (check terser config)
- [ ] No TODO/FIXME comments in production code

---

## 📊 Monitoring & Alerting

### Error Tracking
- [ ] Sentry (or equivalent) configured
- [ ] Error tracking verified (send test error)
- [ ] Source maps uploaded to Sentry
- [ ] Error notification emails configured
- [ ] Slack/Discord webhook for critical errors

### Performance Monitoring
- [ ] APM tool configured (New Relic / DataDog / Grafana)
- [ ] Database query monitoring enabled
- [ ] API endpoint monitoring enabled
- [ ] Custom metrics tracked (vaults created, recoveries initiated, etc.)
- [ ] Dashboard created for key metrics

### Uptime Monitoring
- [ ] Uptime monitor configured (Pingdom / UptimeRobot / Better Stack)
- [ ] Health check endpoint monitored: `/api/health`
- [ ] SSL certificate expiry monitored
- [ ] DNS monitoring configured
- [ ] Downtime alerts configured (email + SMS)

### Logging
- [ ] Centralized logging configured (LogRocket / Logtail / CloudWatch)
- [ ] Log levels configured (ERROR, WARN, INFO)
- [ ] Log retention policy set (30 days minimum)
- [ ] Sensitive data excluded from logs (passwords, private keys)
- [ ] Audit logs enabled for admin actions

---

## 🏗️ Infrastructure

### Environment Configuration
- [ ] All production environment variables set
- [ ] `NODE_ENV=production` configured
- [ ] Database credentials secured
- [ ] Redis URL configured (`REDIS_URL` or `REDIS_TLS_URL`)
- [ ] API keys configured (Infura, Alchemy, SendGrid, Twilio)
- [ ] CORS origins whitelisted
- [ ] Webhook secrets configured (Stripe, etc.)

### Scaling & High Availability
- [ ] Auto-scaling configured (horizontal scaling)
- [ ] Load balancer configured
- [ ] Health checks configured on load balancer
- [ ] Session persistence configured (Redis)
- [ ] Database read replicas configured (if applicable)
- [ ] CDN configured (Cloudflare / CloudFront)

### SSL/TLS & DNS
- [ ] SSL/TLS certificate configured and valid
- [ ] HTTPS redirect enabled
- [ ] HSTS header configured (`Strict-Transport-Security`)
- [ ] DNS records configured (A, AAAA, CNAME)
- [ ] DNS TTL reduced before deployment (for quick rollback)
- [ ] Subdomain routing configured if needed

### Backup & Recovery
- [ ] Automated daily backups configured
- [ ] Backup retention policy set (30 days minimum)
- [ ] Backup restore tested successfully
- [ ] Point-in-time recovery configured (if supported)
- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) defined: **4 hours max**
- [ ] RPO (Recovery Point Objective) defined: **1 hour max**

---

## 🔐 Smart Contracts

### Deployment
- [ ] Smart contracts deployed to mainnet
- [ ] Contract addresses configured in `.env`
- [ ] Contract source code verified on Etherscan
- [ ] Contract ownership transferred to multisig wallet
- [ ] Multisig wallet configured with 3/5 signers minimum
- [ ] Emergency pause function tested
- [ ] Timelock configured for critical functions

### Testing
- [ ] All contract tests pass on mainnet fork
- [ ] Gas optimization completed
- [ ] Contract audit completed (CertiK / Trail of Bits / OpenZeppelin)
- [ ] Audit findings remediated
- [ ] Contract upgrade path documented (if upgradeable)

---

## 📱 User Experience

### Email & Notifications
- [ ] SendGrid (or email provider) configured
- [ ] Email templates tested (invitation, recovery, etc.)
- [ ] SPF and DKIM records configured
- [ ] Email deliverability tested (inbox, not spam)
- [ ] Push notifications configured (if applicable)
- [ ] SMS notifications configured (Twilio)

### Content & Compliance
- [ ] Terms of Service updated and accessible
- [ ] Privacy Policy updated and accessible
- [ ] Cookie Policy updated and accessible
- [ ] GDPR compliance verified (if serving EU users)
- [ ] CCPA compliance verified (if serving CA users)
- [ ] Accessibility tested (WCAG 2.1 AA compliance)
- [ ] Mobile responsiveness tested on iOS and Android

### Support & Documentation
- [ ] Help Center / Documentation published
- [ ] Support email configured (support@guardiavault.com)
- [ ] Status page configured (status.guardiavault.com)
- [ ] FAQ page updated
- [ ] User onboarding flow tested

---

## 🚢 Deployment Process

### Pre-Deployment
- [ ] **CRITICAL:** Create database backup
- [ ] Tag release in git: `git tag v1.0.0`
- [ ] Create GitHub release with changelog
- [ ] Notify team of deployment window
- [ ] Schedule maintenance window (if needed)
- [ ] Reduce DNS TTL to 300s (for quick rollback)

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Check error rates (should not spike)
- [ ] Check response times (should not degrade)

### Post-Deployment
- [ ] Verify health check endpoint: `/api/health`
- [ ] Test critical user flows (registration, login, vault creation)
- [ ] Monitor error logs for 1 hour
- [ ] Monitor performance metrics for 1 hour
- [ ] Increase DNS TTL back to normal (3600s)
- [ ] Update status page (if applicable)
- [ ] Send deployment success notification to team

### Rollback Plan
- [ ] Rollback procedure documented
- [ ] Database rollback scripts ready
- [ ] Previous version deployment package saved
- [ ] Rollback decision criteria defined:
  - Error rate increase >10%
  - Response time increase >50%
  - Critical functionality broken
- [ ] Rollback can be completed in <15 minutes

---

## ✅ Final Verification

### Functionality
- [ ] All critical features working:
  - [ ] User authentication (email + Web3)
  - [ ] Vault creation and management
  - [ ] Guardian invitations and acceptance
  - [ ] Recovery initiation and approval
  - [ ] Beneficiary claims
  - [ ] Check-ins
  - [ ] Yield vaults (if enabled)
  - [ ] Payments (Stripe)

### Performance
- [ ] Page load times <2 seconds
- [ ] API response times <200ms (p95)
- [ ] Database query times <50ms (p95)
- [ ] Cache hit rate >50%
- [ ] No memory leaks
- [ ] No database connection leaks

### Security
- [ ] No exposed secrets in code or logs
- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] SQL injection protection verified
- [ ] Rate limiting working
- [ ] Admin access restricted

### Monitoring
- [ ] Error tracking receiving events
- [ ] Performance monitoring active
- [ ] Uptime monitoring active
- [ ] Alerts configured and tested
- [ ] Logs aggregating correctly

---

## 📋 Deployment Commands

```bash
# 1. Pre-deployment checks
pnpm run test:all
pnpm run build:analyze
pnpm run check:deployment

# 2. Build production bundle
pnpm run build

# 3. Run database migrations
pnpm run db:migrate

# 4. Add performance indexes
tsx server/scripts/add-performance-indexes.ts

# 5. Deploy (platform-specific)
# Vercel: git push
# AWS: ./scripts/deploy-aws.sh
# Docker: docker-compose up -d

# 6. Verify deployment
curl https://guardiavault.com/api/health
pnpm run test:smoke
```

---

## 🆘 Emergency Contacts

### Team
- **DevOps Lead:** [Name] - [Phone] - [Email]
- **Backend Lead:** [Name] - [Phone] - [Email]
- **Frontend Lead:** [Name] - [Phone] - [Email]
- **Security Lead:** [Name] - [Phone] - [Email]

### Vendors
- **Hosting Provider:** [Provider] - [Support Phone] - [Support Email]
- **Database Provider:** [Provider] - [Support Phone] - [Support Email]
- **CDN Provider:** [Provider] - [Support Phone] - [Support Email]

---

## 📝 Post-Deployment Review

### Metrics to Track (First 7 Days)
- [ ] Error rate
- [ ] Response times (p50, p95, p99)
- [ ] User registrations
- [ ] Vault creations
- [ ] Recovery initiations
- [ ] Cache hit rate
- [ ] Database query performance
- [ ] Page load times

### Post-Mortem (If Issues)
- [ ] Document what went wrong
- [ ] Document what went right
- [ ] Identify action items
- [ ] Update checklist based on learnings

---

## ✨ Success Criteria

Deployment is considered successful when ALL of the following are met:

1. ✅ Zero critical errors in first 24 hours
2. ✅ Error rate <0.1%
3. ✅ Page load time <2 seconds (p95)
4. ✅ API response time <200ms (p95)
5. ✅ Uptime >99.9%
6. ✅ All critical user flows working
7. ✅ Zero security vulnerabilities
8. ✅ Database queries optimized (<50ms p95)
9. ✅ Bundle size <1MB
10. ✅ Lighthouse score >90

**If any criterion is not met, investigate and remediate immediately.**

---

**Signed off by:**
- [ ] Tech Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Product Manager: _________________ Date: _______

**Deployment Date:** _______________________
**Deployment Time:** _______________________
**Deployed By:** _______________________
