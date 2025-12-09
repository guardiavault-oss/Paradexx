# Quick Start Guide - Production Deployment

## 🚀 Get to Production in 4 Steps

This guide will get your MEV Protection Service running in production in under 1 hour.

---

## Step 1: Generate Secrets (5 minutes)

Run these commands and save the output:

```bash
# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -hex 32)"

# Generate API key
echo "API_KEY=$(openssl rand -hex 32)"

# Generate encryption key
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"

# Generate database password
echo "DB_PASSWORD=$(openssl rand -base64 20)"

# Generate Redis password
echo "REDIS_PASSWORD=$(openssl rand -base64 20)"

# Generate Grafana password
echo "GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 20)"
```

---

## Step 2: Create Environment File (10 minutes)

Create `.env` file in project root:

```bash
# ============================================================================
# REQUIRED: Security
# ============================================================================
JWT_SECRET=<paste-jwt-secret-here>
API_KEY=<paste-api-key-here>
ENCRYPTION_KEY=<paste-encryption-key-here>

# ============================================================================
# REQUIRED: Database
# ============================================================================
DB_USER=mev_user
DB_PASSWORD=<paste-db-password-here>
DB_NAME=mev_protection

# ============================================================================
# REQUIRED: Redis
# ============================================================================
REDIS_PASSWORD=<paste-redis-password-here>

# ============================================================================
# REQUIRED: Blockchain RPC
# ============================================================================
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY

# ============================================================================
# REQUIRED: CORS
# ============================================================================
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# ============================================================================
# REQUIRED: Monitoring
# ============================================================================
GRAFANA_ADMIN_PASSWORD=<paste-grafana-password-here>
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# ============================================================================
# Optional: Additional Settings
# ============================================================================
ENVIRONMENT=production
LOG_LEVEL=INFO
DEFAULT_PROTECTION_LEVEL=high
ENABLE_PRIVATE_MEMPOOL=true
```

**Save your secrets securely!** You'll need them for recovery.

---

## Step 3: Deploy with Docker (15 minutes)

```bash
# 1. Ensure Docker and Docker Compose are installed
docker --version  # Should be 20.10+
docker-compose --version  # Should be 2.0+

# 2. Build and start services
docker-compose up -d

# 3. Wait for services to start (30 seconds)
sleep 30

# 4. Run database migrations
docker-compose exec mev-protection alembic upgrade head

# 5. Check all services are running
docker-compose ps
```

**Expected output:**
```
NAME                            STATUS      PORTS
mev-protection-service          Up          0.0.0.0:8000->8000/tcp
mev-protection-postgres         Up          5432/tcp
mev-protection-redis            Up          6379/tcp
mev-protection-prometheus       Up          9090/tcp
mev-protection-grafana          Up          3000/tcp
mev-protection-nginx            Up          0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## Step 4: Verify Deployment (10 minutes)

### 4.1 Basic Health Check

```bash
# Check if API is responding
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-11-18T...","version":"2.0.0"}
```

### 4.2 Test Authentication

```bash
# Test with your API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     http://localhost:8000/api/v1/protection/status

# Should return protection status (not 401 Unauthorized)
```

### 4.3 Check Services

```bash
# Check Prometheus
curl http://localhost:9091

# Check Grafana
open http://localhost:3000
# Login: admin / <your-grafana-password>

# Check API Documentation
open http://localhost:8000/docs
```

### 4.4 Check Logs

```bash
# View application logs
docker-compose logs -f mev-protection

# Should see:
# ✅ MEV Protection API started successfully!
# No errors should appear
```

---

## ✅ Production Checklist

Quick verification before going live:

- [ ] All services running (`docker-compose ps` shows all "Up")
- [ ] Health check returns "healthy"
- [ ] API authentication working (returns 401 without token, 200 with token)
- [ ] No errors in logs
- [ ] Grafana accessible at http://localhost:3000
- [ ] Prometheus scraping metrics at http://localhost:9091
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Database connection working (check logs)
- [ ] Redis connection working (check logs)

---

## 🔒 SSL/TLS Setup (Optional but Recommended)

### Option 1: Let's Encrypt (Free)

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to nginx
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Edit nginx.conf and uncomment HTTPS server block
# Restart nginx
docker-compose restart nginx
```

### Option 2: Existing Certificate

```bash
# Copy your certificates
cp your-certificate.pem nginx/ssl/fullchain.pem
cp your-private-key.pem nginx/ssl/privkey.pem

# Edit nginx.conf and uncomment HTTPS server block
# Restart nginx
docker-compose restart nginx
```

---

## 🎯 What's Next?

### 1. Set Up Monitoring (30 minutes)

**Grafana Dashboards:**
1. Go to http://localhost:3000
2. Login with admin/<your-password>
3. Add Prometheus data source: http://prometheus:9090
4. Import dashboards from `monitoring/grafana/dashboards/`

**Sentry:**
1. Create account at sentry.io
2. Create new project
3. Copy DSN to .env file
4. Restart service: `docker-compose restart mev-protection`

### 2. Configure Alerts (15 minutes)

Edit `monitoring/prometheus.yml` to add alert rules for:
- Service down
- High error rate
- High memory usage
- High CPU usage

### 3. Test Everything (30 minutes)

Run through `PRODUCTION_CHECKLIST.md` to verify all features.

---

## 🆘 Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs mev-protection

# Common issues:
# - Missing environment variables: Add them to .env
# - Port already in use: Change ports in docker-compose.yml
# - Database connection failed: Check DB_PASSWORD in .env
```

### Database connection failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection manually
docker-compose exec postgres psql -U mev_user -d mev_protection
```

### Redis connection failed

```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli -a YOUR_REDIS_PASSWORD ping
```

### API returns 401 Unauthorized

```bash
# Check your API key is correct
echo $API_KEY

# Test with correct header
curl -H "Authorization: Bearer $API_KEY" \
     http://localhost:8000/api/v1/protection/status
```

---

## 📞 Getting Help

1. **Check logs first**: `docker-compose logs -f mev-protection`
2. **Review documentation**: See `DEPLOYMENT.md` for detailed guide
3. **Check production checklist**: `PRODUCTION_CHECKLIST.md`
4. **Review fixes**: `PRODUCTION_FIXES_SUMMARY.md`

---

## 🔄 Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart single service
docker-compose restart mev-protection

# View logs
docker-compose logs -f mev-protection

# Execute command in container
docker-compose exec mev-protection bash

# Run database backup
docker-compose exec postgres pg_dump -U mev_user mev_protection > backup.sql

# Update to latest code
git pull
docker-compose build
docker-compose up -d
```

---

## ⚡ Performance Tuning

After deployment, monitor and adjust:

1. **Database connections**: Increase `DB_POOL_SIZE` if needed
2. **Worker processes**: Increase `WORKERS` for more concurrency
3. **Rate limits**: Adjust `RATE_LIMIT_PER_MINUTE` based on traffic
4. **Cache TTL**: Tune `CACHE_TTL` for your use case
5. **Resource limits**: Adjust Docker memory/CPU limits if needed

---

## 🎉 Congratulations!

Your MEV Protection Service is now running in production! 🚀

**Next Steps:**
1. Test all endpoints thoroughly
2. Monitor for first 24 hours
3. Set up automated backups
4. Configure alerts and on-call
5. Document any custom configurations

**Remember:**
- Keep your `.env` file secure and never commit it
- Rotate secrets every 90 days
- Perform regular backups
- Monitor error rates and performance
- Keep dependencies updated

---

*Your MEV Protection Service is production-ready and secured!*

