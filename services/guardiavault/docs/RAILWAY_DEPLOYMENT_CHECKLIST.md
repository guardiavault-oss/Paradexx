# Railway Backend Deployment Checklist

Use this checklist to ensure your GuardiaVault backend is ready for Railway deployment.

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All code committed to Git
- [ ] Repository pushed to GitHub
- [ ] `railway.json` exists and is configured
- [ ] `.nvmrc` file exists (specifies Node 20)
- [ ] `package.json` has `engines` field
- [ ] `Dockerfile` exists (optional - Railway can use Nixpacks)
- [ ] Build script works locally (`npm run build`)
- [ ] Start script works locally (`npm start`)

### 2. Environment Variables Preparation

Create a list of all environment variables you'll need. See `env.example` for reference.

#### Core Required Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string (Railway PostgreSQL provides this)
- [ ] `SESSION_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `NODE_ENV=production`
- [ ] `PORT` - Railway sets this automatically (defaults to 5000)
- [ ] `HOST=0.0.0.0` - Required for Railway
- [ ] `APP_URL` - Your Railway app URL (e.g., `https://your-app.up.railway.app`)
- [ ] `SSN_SALT` - Generate: `openssl rand -base64 16`
- [ ] `ENCRYPTION_KEY` - Generate: `openssl rand -hex 32`

#### Optional but Recommended
- [ ] `SENTRY_DSN` - For error tracking
- [ ] `LOG_LEVEL=info` - For production logging

#### Payment Services (if using)
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`

#### Notification Services (if using)
- [ ] `SENDGRID_API_KEY`
- [ ] `SENDGRID_FROM_EMAIL`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`

#### Blockchain (after contract deployment)
- [ ] `GUARDIA_VAULT_ADDRESS`
- [ ] `SUBSCRIPTION_ESCROW_ADDRESS`
- [ ] `SEPOLIA_RPC_URL` (for testnet)
- [ ] `PRIVATE_KEY` (if backend needs contract interaction)

## Railway Deployment Steps

### Step 1: Create Railway Account & Project
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Create new project
- [ ] Select "Deploy from GitHub repo"
- [ ] Connect your GitHub repository
- [ ] Select the repository branch (usually `main`)

### Step 2: Add PostgreSQL Database
- [ ] Click "+ New" > "Database" > "PostgreSQL"
- [ ] Railway creates database automatically
- [ ] Note the connection details (available in Variables tab)

### Step 3: Configure Environment Variables
- [ ] Go to your service > "Variables" tab
- [ ] Add all required environment variables from checklist above
- [ ] Use Railway PostgreSQL's `DATABASE_URL` from the database service

### Step 4: Configure Build & Deploy Settings

Railway auto-detects from `railway.json`, but verify:

- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Health Check: `/health` endpoint should be accessible

### Step 5: Initial Deployment
- [ ] Railway automatically triggers first deployment
- [ ] Monitor deployment logs for errors
- [ ] Wait for build to complete
- [ ] Check deployment status (should show "Deployed")

### Step 6: Run Database Migrations
- [ ] Use Railway CLI or SSH into service
- [ ] Run: `npm run db:push` or `npm run db:migrate`
- [ ] Verify database tables are created

### Step 7: Verify Deployment
- [ ] Check health endpoint: `https://your-app.up.railway.app/health`
- [ ] Check API endpoints are responding
- [ ] Review application logs for errors
- [ ] Test database connectivity

### Step 8: Configure Custom Domain (Optional)
- [ ] Go to Settings > Networking
- [ ] Click "Generate Domain" or add custom domain
- [ ] Update `APP_URL` environment variable if using custom domain

### Step 9: Configure CORS (Important for Netlify Frontend)
- [ ] Update backend CORS settings to allow your Netlify domain
- [ ] Add to allowed origins:
  - Your Netlify app URL (e.g., `https://your-app.netlify.app`)
  - Your custom domain (if using)
- [ ] Redeploy if CORS configuration changed

## Post-Deployment Verification

### API Endpoints Test
- [ ] `GET /health` - Returns 200 OK
- [ ] `GET /api/status` - Returns API status
- [ ] Test authentication endpoints
- [ ] Test protected endpoints with authentication

### Database Verification
- [ ] Connect to Railway PostgreSQL
- [ ] Verify tables exist
- [ ] Test basic CRUD operations

### Logs Monitoring
- [ ] Check Railway logs for errors
- [ ] Verify application starts correctly
- [ ] Check for database connection errors
- [ ] Monitor for any runtime errors

### Integration Testing
- [ ] Test frontend can connect to backend API
- [ ] Verify CORS headers are correct
- [ ] Test authentication flow end-to-end
- [ ] Verify WebSocket connections (if used)

## Troubleshooting Common Issues

### Build Fails
**Symptoms**: Deployment shows "Build Failed"

**Solutions**:
- Check build logs in Railway dashboard
- Verify Node version matches `.nvmrc`
- Ensure all dependencies are in `package.json`
- Check for TypeScript compilation errors
- Verify build command works locally

### Application Crashes
**Symptoms**: Service shows "Crashed" or restarts frequently

**Solutions**:
- Check runtime logs for errors
- Verify all required environment variables are set
- Check database connection string is correct
- Ensure `PORT` env var is not manually set (Railway sets it)
- Verify `HOST=0.0.0.0` is set

### Database Connection Errors
**Symptoms**: "Connection refused" or "Database not found"

**Solutions**:
- Verify `DATABASE_URL` is correct (from Railway PostgreSQL service)
- Check database service is running
- Ensure SSL is enabled in connection string (Railway requires SSL)
- Test connection using Railway's database browser

### Health Check Fails
**Symptoms**: Service marked as unhealthy

**Solutions**:
- Verify `/health` endpoint exists and returns 200
- Check health check path in `railway.json`
- Ensure application is listening on correct port
- Review application logs for startup errors

### CORS Errors
**Symptoms**: Frontend can't connect, CORS errors in browser

**Solutions**:
- Update backend CORS configuration
- Add Netlify domain to allowed origins
- Verify `credentials: true` if using cookies
- Redeploy after CORS changes

## Continuous Deployment

### Automatic Deployments
- [ ] Railway automatically deploys on push to connected branch
- [ ] Set up branch protection if needed
- [ ] Configure deployment notifications

### Manual Deployments
- [ ] Use Railway dashboard to trigger manual deploy
- [ ] Or use Railway CLI: `railway up`

## Monitoring & Maintenance

### Logs
- [ ] Set up log aggregation (Railway provides basic logs)
- [ ] Configure Sentry for error tracking
- [ ] Set up alerts for critical errors

### Performance
- [ ] Monitor Railway dashboard for resource usage
- [ ] Optimize build times
- [ ] Review database query performance

### Backups
- [ ] Railway PostgreSQL includes automatic backups
- [ ] Set up manual backup schedule if needed
- [ ] Test restore procedure

## Environment Variables Reference

### Generating Secure Secrets

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Generate SSN_SALT
openssl rand -base64 16

# Generate ENCRYPTION_KEY (must be 64 hex chars)
openssl rand -hex 32
```

### Railway-Specific Variables

Railway automatically sets:
- `PORT` - Port your app should listen on
- `RAILWAY_ENVIRONMENT` - Environment name
- `RAILWAY_PROJECT_ID` - Project identifier
- `RAILWAY_SERVICE_ID` - Service identifier

**Do NOT override these variables manually.**

## Next Steps After Backend Deployment

1. ✅ Update frontend environment variables (Netlify)
2. ✅ Update CORS settings to allow frontend domain
3. ✅ Deploy smart contracts (see `DEPLOY_CONTRACTS.md`)
4. ✅ Update contract addresses in environment variables
5. ✅ Test end-to-end integration
6. ✅ Set up monitoring and alerts
7. ✅ Document API endpoints for team

## Support Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app/)
- Project-specific: `RAILWAY_DEPLOYMENT.md`

---

**Last Updated**: After completing this checklist, your backend should be fully deployed and operational on Railway!

