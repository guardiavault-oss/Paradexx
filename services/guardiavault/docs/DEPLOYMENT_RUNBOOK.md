# Deployment Runbook - GuardiaVault

## Pre-Deployment Checklist

### 1. Environment Preparation
```bash
# Verify all environment variables are set
env | grep -E "(SESSION_SECRET|DATABASE_URL|SENTRY_DSN|SMTP|STRIPE)"

# Generate secure SESSION_SECRET (if not set)
openssl rand -base64 32
```

### 2. Database Preparation
```bash
# Run all migrations in order
npm run db:migrate

# Verify migration 005 (security constraints) ran
psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' LIMIT 5;"

# Create database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### 3. Security Audit
```bash
# Run comprehensive security audit
npm run audit:all

# Verify no critical issues
npm run deploy:check
```

### 4. Build Verification
```bash
# Type check
npm run check

# Build application
npm run build

# Run tests
npm test
```

## Deployment Steps

### Step 1: Pre-Deployment Verification
```bash
# 1. Verify environment
npm run deploy:check

# 2. Review recent commits
git log --oneline -10

# 3. Check for uncommitted changes
git status
```

### Step 2: Staging Deployment (If Applicable)
```bash
# Deploy to staging first
# Test critical flows:
# - User registration
# - Vault creation
# - Guardian invitation
# - Check-in flow
# - Recovery flow
```

### Step 3: Production Deployment

#### Option A: Docker Deployment
```bash
# Build Docker image
docker build -t guardiavault:latest .

# Tag for production
docker tag guardiavault:latest registry.example.com/guardiavault:v1.0.0

# Push to registry
docker push registry.example.com/guardiavault:v1.0.0

# Deploy (update deployment with new image)
kubectl set image deployment/guardiavault app=registry.example.com/guardiavault:v1.0.0

# Or for Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

#### Option B: Direct Deployment
```bash
# Build application
npm run build

# Start application with PM2 or similar
pm2 start ecosystem.config.js --env production

# Or use systemd
sudo systemctl restart guardiavault
```

### Step 4: Post-Deployment Verification
```bash
# 1. Health check
curl https://your-domain.com/health

# 2. Ready check
curl https://your-domain.com/ready

# 3. Verify API documentation
curl https://your-domain.com/api-docs

# 4. Test authentication
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 5: Monitoring Setup
```bash
# Verify Sentry error tracking
# Check Sentry dashboard for new errors

# Verify logs
tail -f /var/log/guardiavault/app.log

# Monitor database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Rollback Procedure

### Immediate Rollback
```bash
# Option 1: Revert to previous Docker image
docker tag registry.example.com/guardiavault:v0.9.9 registry.example.com/guardiavault:latest
kubectl set image deployment/guardiavault app=registry.example.com/guardiavault:v0.9.9

# Option 2: Revert Git commit and redeploy
git revert HEAD
git push
# Trigger CI/CD pipeline

# Option 3: Rollback database migration (if needed)
# CAUTION: Only if migration caused issues
psql $DATABASE_URL < migrations/rollback_005.sql
```

### Database Rollback
```bash
# Restore from backup
psql $DATABASE_URL < backup-YYYYMMDD-HHMMSS.sql

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM vaults;"
```

## Post-Deployment Tasks

### 1. Verify Critical Flows
- [ ] User registration works
- [ ] User login works
- [ ] Vault creation works
- [ ] Guardian invitation works
- [ ] Check-in works
- [ ] Recovery flow works

### 2. Monitor Error Rates
- [ ] Check Sentry for errors
- [ ] Review application logs
- [ ] Monitor database errors

### 3. Performance Monitoring
- [ ] Check API response times
- [ ] Monitor database query performance
- [ ] Verify connection pool usage

### 4. Security Verification
- [ ] Verify HTTPS is working
- [ ] Test CSRF protection
- [ ] Verify rate limiting
- [ ] Check session security

## Troubleshooting

### Common Issues

#### Issue: Application won't start
```bash
# Check logs
tail -f /var/log/guardiavault/app.log

# Verify environment variables
env | grep DATABASE_URL
env | grep SESSION_SECRET

# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

#### Issue: Database connection errors
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Issue: High error rates
```bash
# Check Sentry dashboard
# Review error patterns
# Check application logs for patterns
# Verify database performance
```

## Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Infrastructure Team**: [Contact Info]
- **Security Team**: [Contact Info]

## Recovery Procedures

### Complete Service Outage
1. Check health endpoint
2. Verify database connectivity
3. Review application logs
4. Check for recent deployments
5. Rollback if deployment-related
6. Escalate if not deployment-related

### Data Loss
1. Identify scope of data loss
2. Restore from most recent backup
3. Verify data integrity
4. Notify affected users
5. Document incident

## Maintenance Windows

- **Preferred Time**: 02:00-04:00 UTC (Low traffic)
- **Notification**: 48 hours in advance
- **Duration**: Maximum 2 hours
- **Rollback Plan**: Always prepared

