# 🚀 Production Deployment Checklist

## Production Readiness Score: **65/100**

### ✅ What's Ready (40 points)
- ✅ Core backend infrastructure (10 points)
- ✅ Database schema and migrations (10 points)
- ✅ API endpoints implemented (8 points)
- ✅ Security middleware (Helmet, rate limiting) (5 points)
- ✅ Error tracking (Sentry integration) (4 points)
- ✅ Structured logging (3 points)

### ⚠️ Needs Work (35 points deducted)
- ❌ **No automated tests** (-15 points)
- ❌ **Smart contracts not deployed** (-8 points)
- ❌ **Frontend components missing** (-5 points)
- ❌ **No CI/CD pipeline** (-4 points)
- ❌ **Missing health checks** (-3 points)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Configuration (CRITICAL)

#### Required Environment Variables

**Database:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

**Security (MUST CHANGE):**
```bash
SESSION_SECRET=<generate with: openssl rand -base64 32>
ENCRYPTION_KEY=<generate with: openssl rand -hex 32>
SSN_SALT=<generate with: openssl rand -base64 16>
```

**Application:**
```bash
NODE_ENV=production
APP_URL=https://yourdomain.com
PORT=5000
HOST=0.0.0.0
```

**Blockchain (if using smart contracts):**
```bash
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
DEPLOYER_PRIVATE_KEY=0x...
GUARDIAVAULT_CONTRACT_ADDRESS=0x...  # Deploy first!
```

#### Optional Services:
- `SENTRY_DSN` - Error tracking (highly recommended)
- `SENDGRID_API_KEY` - Email notifications
- `TWILIO_ACCOUNT_SID` - SMS notifications
- `STRIPE_SECRET_KEY` - Payments
- `AWS_ACCESS_KEY_ID` - File storage (S3)

---

### 2. Database Setup

#### Step 1: Create Production Database
```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose.prod.yml up -d postgres

# Or use managed PostgreSQL (AWS RDS, Neon, Supabase, etc.)
```

#### Step 2: Run Migrations
```bash
# Apply all migrations
pnpm run db:migrate:death-verification
pnpm run db:migrate:landing-features

# Verify tables exist
psql $DATABASE_URL -c "\dt"
```

#### Step 3: Backup Strategy
- Set up automated daily backups
- Test restore procedure
- Document backup retention policy

---

### 3. Smart Contract Deployment

#### Step 1: Deploy to Testnet First (Sepolia)
```bash
# Update hardhat.config.ts with your network
# Deploy to Sepolia
pnpm run deploy:sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS
```

#### Step 2: Deploy to Mainnet
```bash
# ⚠️ Only after thorough testing!
pnpm run deploy:mainnet  # (you'll need to add this script)

# Update .env with contract address
VITE_GUARDIA_VAULT_ADDRESS=0x...
```

---

### 4. Build & Test

#### Step 1: Build Application
```bash
pnpm run build

# Verify dist/ folder created
ls -la dist/
```

#### Step 2: Run Type Check
```bash
pnpm run check
```

#### Step 3: Test Locally
```bash
# Start production build locally
NODE_ENV=production pnpm run start

# Test endpoints:
curl http://localhost:5000/api/health
curl http://localhost:5000/
```

---

### 5. Security Hardening (CRITICAL)

#### ✅ Already Implemented:
- Helmet.js security headers
- Rate limiting
- Input sanitization
- Session security
- HTTPS enforcement (via Helmet)

#### ⚠️ Add Before Production:
1. **CSP Headers** - Review Content Security Policy
2. **CORS Configuration** - Restrict allowed origins
3. **API Authentication** - Verify all endpoints protected
4. **Secret Rotation** - Document rotation schedule
5. **Vulnerability Scanning** - Run `npm audit` and fix issues

```bash
# Check for vulnerabilities
pnpm audit

# Fix automatically where possible
pnpm audit fix
```

---

### 6. Deployment Options

#### Option A: Docker Compose (Recommended for VPS)

```bash
# 1. Update docker-compose.prod.yml with your env vars
# 2. Build and start
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 3. Check logs
docker-compose -f docker-compose.prod.yml logs -f app
```

#### Option B: Cloud Platforms

**Vercel/Netlify (Frontend) + Railway/Render (Backend):**
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically on push

**AWS/GCP/Azure:**
1. Use Docker containers or serverless
2. Configure load balancer
3. Set up auto-scaling

---

### 7. Post-Deployment

#### Immediate Tasks:
1. ✅ Verify application loads
2. ✅ Test critical user flows
3. ✅ Check Sentry for errors
4. ✅ Monitor logs
5. ✅ Verify database connections
6. ✅ Test API endpoints

#### Monitoring Setup:
```bash
# Health check endpoint (needs to be added)
GET /api/health

# Should return:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-..."
}
```

#### Set Up Alerts:
- Database connection failures
- High error rates (>1%)
- Response time > 2 seconds
- Disk space < 20%
- Memory usage > 80%

---

## 🚨 Critical Issues to Fix Before Production

### 1. Missing Health Check Endpoint
**Priority: HIGH**
```typescript
// Add to server/routes.ts
app.get("/api/health", async (req, res) => {
  try {
    // Check database
    await db.select().from(users).limit(1);
    
    res.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: error.message,
    });
  }
});
```

### 2. Add Automated Tests
**Priority: HIGH**
```bash
# Create test suite for:
- API endpoints
- Database operations
- Critical user flows
- Security features
```

### 3. Deploy Smart Contracts
**Priority: MEDIUM**
- Deploy to testnet first
- Get contract verified
- Update frontend with address

### 4. Frontend Components
**Priority: MEDIUM**
- Legacy messages UI
- Security dashboard
- Biometric setup flow

---

## 📊 Production Readiness Breakdown

| Category | Score | Status |
|----------|-------|--------|
| Backend Infrastructure | 9/10 | ✅ Excellent |
| Database | 10/10 | ✅ Complete |
| API Endpoints | 8/10 | ✅ Good |
| Security | 7/10 | ⚠️ Needs hardening |
| Error Handling | 8/10 | ✅ Good |
| Logging | 8/10 | ✅ Good |
| Testing | 0/10 | ❌ Missing |
| Smart Contracts | 3/10 | ⚠️ Not deployed |
| Frontend | 6/10 | ⚠️ Partial |
| Monitoring | 5/10 | ⚠️ Basic |
| CI/CD | 0/10 | ❌ Missing |
| Documentation | 8/10 | ✅ Good |

**Total: 65/100**

---

## 🎯 Quick Path to 80/100

To reach 80/100 quickly, focus on:

1. **Add Health Check** (+3 points) - 15 minutes
2. **Deploy Smart Contracts to Testnet** (+5 points) - 1 hour
3. **Add Basic Monitoring** (+5 points) - 2 hours
4. **Write Critical Tests** (+5 points) - 4 hours
5. **Hardened Security Config** (+2 points) - 1 hour

---

## 📝 Deployment Script Template

Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 1. Check environment
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set!"
  exit 1
fi

# 2. Run migrations
echo "📊 Running migrations..."
pnpm run db:migrate:death-verification
pnpm run db:migrate:landing-features

# 3. Build
echo "🔨 Building application..."
pnpm run build

# 4. Run tests (when added)
# pnpm run test

# 5. Start application
echo "✅ Deployment complete!"
pnpm run start
```

---

## 🆘 Emergency Rollback Plan

If deployment fails:

1. **Rollback Database:**
```bash
# Don't rollback migrations if possible
# Instead, add new migration to fix issues
```

2. **Rollback Application:**
```bash
# Keep previous build in dist/
# Restart with previous version
```

3. **Restore Database:**
```bash
psql $DATABASE_URL < backup.sql
```

---

## 📞 Support Resources

- **Database Issues:** Check `migrations/README.md`
- **Environment Setup:** See `ENV_SETUP_GUIDE.md`
- **Docker Deployment:** See `DOCKER_SETUP.md`
- **Smart Contracts:** See `contracts/README.md` (if exists)

---

**Last Updated:** 2024-01-XX
**Next Review:** After adding tests and deploying to staging

