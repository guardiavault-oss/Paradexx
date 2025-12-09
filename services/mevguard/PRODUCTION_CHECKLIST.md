# Production Deployment Checklist

## Pre-Deployment

### Security Configuration

- [ ] All secrets generated using `openssl rand -hex 32`
- [ ] JWT_SECRET set and secure (32+ characters)
- [ ] API_KEY set and secure (32+ characters)
- [ ] ENCRYPTION_KEY set and secure (32+ characters)
- [ ] Database passwords changed from defaults (16+ characters)
- [ ] Redis password set and secure (16+ characters)
- [ ] Grafana admin password changed from default
- [ ] CORS origins restricted to actual domains (no wildcards)
- [ ] Trusted hosts configured properly
- [ ] `.env` file never committed to version control
- [ ] All API keys for external services configured
- [ ] SSH keys rotated and secured

### Environment Configuration

- [ ] `.env` file created from `ENV_CONFIGURATION.md`
- [ ] All REQUIRED environment variables set
- [ ] Database connection string verified
- [ ] Redis connection string verified
- [ ] At least one blockchain RPC URL configured
- [ ] Sentry DSN configured for error tracking
- [ ] ALLOWED_ORIGINS set to production domains
- [ ] LOG_LEVEL set appropriately (INFO or WARNING for production)
- [ ] DEBUG set to false

### SSL/TLS Configuration

- [ ] SSL certificates obtained (Let's Encrypt, etc.)
- [ ] Certificates placed in `nginx/ssl/` directory
- [ ] Nginx HTTPS server block uncommented and configured
- [ ] HTTP to HTTPS redirect enabled
- [ ] SSL certificate auto-renewal configured
- [ ] Test SSL configuration with SSL Labs

### Database Setup

- [ ] PostgreSQL 15+ installed and running
- [ ] Database created: `mev_protection`
- [ ] Database user created with strong password
- [ ] Database permissions granted correctly
- [ ] Init script (`init-db.sql`) executed successfully
- [ ] Database extensions installed (uuid-ossp, pg_stat_statements, pg_trgm)
- [ ] Database backup strategy configured
- [ ] Connection pooling configured
- [ ] Database performance tuning applied

### Redis Setup

- [ ] Redis 7+ installed and running
- [ ] Redis password authentication enabled
- [ ] Redis persistence configured (RDB + AOF)
- [ ] Redis max memory policy set
- [ ] Redis backup strategy configured

### Application Setup

- [ ] Python 3.11+ installed
- [ ] All dependencies installed from `requirements.txt`
- [ ] Alembic migrations run successfully
- [ ] Application starts without errors
- [ ] Health check endpoint accessible
- [ ] API documentation accessible at `/docs`

### Monitoring Setup

- [ ] Prometheus configured and running
- [ ] Grafana configured and running
- [ ] Grafana dashboards imported
- [ ] Prometheus scraping MEV Protection metrics
- [ ] Loki logging configured
- [ ] Sentry error tracking initialized and tested
- [ ] Alert rules configured in Prometheus
- [ ] PagerDuty/on-call system configured

### Infrastructure

- [ ] Sufficient CPU resources (4+ cores recommended)
- [ ] Sufficient RAM (8GB+ recommended)
- [ ] Sufficient disk space (100GB+ recommended)
- [ ] SSD storage for database
- [ ] Firewall rules configured
- [ ] Only necessary ports exposed (80, 443)
- [ ] Internal services not exposed to internet
- [ ] DDoS protection configured (Cloudflare, AWS Shield, etc.)
- [ ] Load balancer configured (if using multiple instances)

## Deployment

### Docker Deployment

- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] All Docker images built successfully
- [ ] Docker containers start without errors
- [ ] All health checks passing
- [ ] Volumes persisting data correctly
- [ ] Networks configured properly
- [ ] Resource limits set appropriately

### Application Deployment

- [ ] Latest code pulled from repository
- [ ] Environment variables loaded
- [ ] Database migrations applied
- [ ] Static files collected (if applicable)
- [ ] Application started successfully
- [ ] No errors in application logs
- [ ] All endpoints responding correctly

### Verification Tests

- [ ] Health check: `curl https://yourdomain.com/health`
- [ ] API documentation accessible
- [ ] WebSocket connection working
- [ ] Database connectivity verified
- [ ] Redis connectivity verified
- [ ] Blockchain RPC connectivity verified
- [ ] Prometheus metrics endpoint working: `/metrics`
- [ ] Grafana dashboards loading data
- [ ] Sentry receiving test errors

## Post-Deployment

### Smoke Tests

- [ ] API authentication working
- [ ] Create test threat detection
- [ ] Create test protection
- [ ] Verify data persists in database
- [ ] Verify Redis caching working
- [ ] Test rate limiting
- [ ] Test CORS configuration
- [ ] Test WebSocket real-time updates

### Performance Testing

- [ ] Response time < 200ms for API calls
- [ ] WebSocket latency acceptable
- [ ] Database query performance acceptable
- [ ] Memory usage within limits
- [ ] CPU usage within limits
- [ ] No memory leaks detected
- [ ] Concurrent connection handling verified

### Security Verification

- [ ] SSL/TLS grade A or higher (SSL Labs)
- [ ] Security headers present (X-Frame-Options, CSP, etc.)
- [ ] Authentication required for protected endpoints
- [ ] Rate limiting working
- [ ] No secrets exposed in logs
- [ ] No secrets in error messages
- [ ] CORS properly restricted
- [ ] SQL injection protection verified
- [ ] XSS protection verified

### Monitoring Verification

- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards showing data
- [ ] Loki collecting logs
- [ ] Sentry tracking errors
- [ ] Alerts configured and tested
- [ ] On-call rotation configured
- [ ] Runbooks documented

### Documentation

- [ ] API documentation up to date
- [ ] Deployment documentation reviewed
- [ ] Runbooks created for common issues
- [ ] Team trained on deployment procedures
- [ ] Rollback procedures documented
- [ ] Incident response procedures documented
- [ ] Contact list updated

## Ongoing Maintenance

### Daily

- [ ] Check service health
- [ ] Review error logs
- [ ] Check Sentry for new errors
- [ ] Monitor system resources

### Weekly

- [ ] Review performance metrics
- [ ] Check database size and growth
- [ ] Review and rotate logs
- [ ] Check backup success
- [ ] Security scan review

### Monthly

- [ ] Update dependencies
- [ ] Review and update documentation
- [ ] Test backup restore procedure
- [ ] Review access logs
- [ ] Security audit
- [ ] Performance tuning review

### Quarterly

- [ ] Disaster recovery drill
- [ ] Full security audit
- [ ] Dependency major version updates
- [ ] Infrastructure capacity review
- [ ] Team training refresh

## Rollback Plan

### Quick Rollback Steps

1. **Stop new deployment**
   ```bash
   docker-compose stop mev-protection
   ```

2. **Switch to previous version**
   ```bash
   git checkout <previous-tag>
   docker-compose pull
   docker-compose up -d
   ```

3. **Verify rollback**
   ```bash
   curl https://yourdomain.com/health
   ```

4. **Monitor for issues**
   - Check logs
   - Check error rates in Sentry
   - Verify metrics in Grafana

### Database Rollback

1. **Stop application**
2. **Restore database from backup**
   ```bash
   ./scripts/restore_database.sh <backup-file>
   ```
3. **Restart application**

## Emergency Contacts

- **Primary On-Call**: `<phone-number>`
- **Secondary On-Call**: `<phone-number>`
- **DevOps Lead**: `<email>`
- **Security Team**: `<email>`
- **Database Admin**: `<email>`

## Sign-Off

Deployment performed by: _____________________ Date: __________

Verified by: _____________________ Date: __________

Approved by: _____________________ Date: __________

---

**Notes:**
- All checkboxes must be checked before production deployment
- Document any deviations from this checklist
- Keep this checklist updated with lessons learned

