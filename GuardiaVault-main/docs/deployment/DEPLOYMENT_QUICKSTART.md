# Quick Start Deployment Guide

This guide helps you quickly deploy both the backend (Railway) and smart contracts.

## Prerequisites Checklist

- [ ] GitHub account with repository access
- [ ] Railway account ([sign up](https://railway.app))
- [ ] Netlify account (frontend already deployed)
- [ ] Ethereum wallet with test ETH (for contract deployment)
- [ ] RPC provider account (Alchemy/Infura/QuickNode)

## Step 1: Deploy Backend to Railway (15-20 minutes)

### 1.1 Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account
5. Select the `GuardiaVault-1` repository

### 1.2 Add PostgreSQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** > **"PostgreSQL"**
3. Railway automatically creates the database
4. Note: Connection string will be available in Variables

### 1.3 Configure Environment Variables

Go to your service > **Variables** tab and add:

```bash
# Database (use Railway PostgreSQL connection string)
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

# Core Settings
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
APP_URL=https://your-app.up.railway.app  # Update after deployment

# Security (generate these!)
SESSION_SECRET=<generate: openssl rand -base64 32>
SSN_SALT=<generate: openssl rand -base64 16>
ENCRYPTION_KEY=<generate: openssl rand -hex 32>

# CORS - Add your Netlify frontend URL
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app

# Optional: Error Tracking
SENTRY_DSN=<your-sentry-dsn-if-using>

# Optional: Logging
LOG_LEVEL=info
```

**Generate secrets:**
```bash
# On Mac/Linux:
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 16  # For SSN_SALT
openssl rand -hex 32     # For ENCRYPTION_KEY

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 1.4 Deploy

Railway automatically starts deploying. Monitor the deployment:

1. Click on your service
2. Go to **"Deployments"** tab
3. Watch build logs
4. Wait for **"Active"** status

### 1.5 Get Your Railway URL

1. Go to Settings > Networking
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://your-app.up.railway.app`)
4. Update `APP_URL` environment variable with this URL

### 1.6 Run Database Migrations

1. Go to your service
2. Click **"View Logs"** or use Railway CLI:
   ```bash
   railway run npm run db:push
   ```
3. Or use Railway's built-in terminal:
   - Click on service > "Terminal" tab
   - Run: `npm run db:push`

### 1.7 Verify Deployment

Test these endpoints:
- `https://your-app.up.railway.app/health` - Should return 200 OK
- `https://your-app.up.railway.app/api/status` - Should return API status

## Step 2: Deploy Smart Contracts (20-30 minutes)

### 2.1 Prepare Environment

Create/update `.env` file locally:

```env
# Network
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_WITHOUT_0x_PREFIX
ETHERSCAN_API_KEY=your_etherscan_api_key

# Network name
NETWORK=sepolia
```

### 2.2 Fund Your Wallet

1. Get test ETH from Sepolia faucets:
   - https://sepoliafaucet.com/
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucets.chain.link/sepolia

2. You'll need ~0.05-0.1 ETH for deployment gas fees

### 2.3 Deploy Contracts

```bash
# Compile contracts first
npm run compile

# Deploy all contracts
npx hardhat run scripts/deploy-all.ts --network sepolia
```

### 2.4 Save Contract Addresses

After deployment, you'll see addresses. Update environment variables:

**In Railway (Backend):**
```bash
GUARDIA_VAULT_ADDRESS=0x...
SUBSCRIPTION_ESCROW_ADDRESS=0x...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**In Netlify (Frontend):**
Go to Site Settings > Environment Variables:
```bash
VITE_GUARDIA_VAULT_ADDRESS=0x...
VITE_SUBSCRIPTION_ESCROW_ADDRESS=0x...
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## Step 3: Update Frontend (Netlify)

### 3.1 Update Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site Settings** > **Environment Variables**
4. Add/Update:
   - `VITE_GUARDIA_VAULT_ADDRESS`
   - `VITE_SUBSCRIPTION_ESCROW_ADDRESS`
   - `VITE_CHAIN_ID=11155111` (for Sepolia)
   - `VITE_SEPOLIA_RPC_URL`

### 3.2 Update Backend API URL

If your backend API URL changed, update frontend environment variable:
- `VITE_API_URL=https://your-app.up.railway.app`

### 3.3 Redeploy Frontend

Netlify will auto-deploy on push, or manually trigger:
- Go to **Deploys** tab
- Click **"Trigger deploy"** > **"Clear cache and deploy site"**

## Step 4: Test Integration

### 4.1 Test Backend API

```bash
# Health check
curl https://your-app.up.railway.app/health

# API status
curl https://your-app.up.railway.app/api/status
```

### 4.2 Test Frontend-Backend Connection

1. Open your Netlify site
2. Open browser DevTools > Network tab
3. Try logging in or registering
4. Verify API requests go to Railway backend
5. Check for CORS errors

### 4.3 Test Smart Contracts

1. Connect wallet to your frontend
2. Switch to Sepolia testnet
3. Try creating a vault or interacting with contracts
4. Verify transactions appear on Etherscan

## Common Issues & Solutions

### Backend Deployment Fails

**Issue**: Build fails on Railway

**Solution**:
- Check Railway deployment logs
- Verify Node version matches (should be 20)
- Ensure `npm run build` works locally
- Check for TypeScript errors

### Database Connection Fails

**Issue**: Backend can't connect to database

**Solution**:
- Verify `DATABASE_URL` is correct from Railway PostgreSQL
- Check SSL is enabled in connection string
- Test connection using Railway database browser
- Run `npm run db:push` to create tables

### CORS Errors

**Issue**: Frontend gets CORS errors when calling backend

**Solution**:
- Add Netlify URL to `ALLOWED_ORIGINS` in Railway
- Verify `ALLOWED_ORIGINS` format: `https://your-app.netlify.app`
- Check backend logs for CORS blocks
- Redeploy backend after CORS changes

### Contract Deployment Fails

**Issue**: "Insufficient balance" or RPC errors

**Solution**:
- Fund wallet with more test ETH
- Verify RPC URL is correct
- Check RPC provider status
- Try different RPC provider

### Contracts Not Verified

**Issue**: Contracts deployed but not verified on Etherscan

**Solution**:
```bash
# Manually verify
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Deployment Verification Checklist

### Backend (Railway)
- [ ] Health endpoint returns 200 OK
- [ ] Database migrations ran successfully
- [ ] API endpoints respond correctly
- [ ] Logs show no errors
- [ ] CORS configured correctly

### Contracts
- [ ] Contracts deployed to Sepolia
- [ ] Contract addresses saved
- [ ] Contracts verified on Etherscan
- [ ] Contract addresses added to environment variables

### Frontend (Netlify)
- [ ] Environment variables updated
- [ ] Frontend deployed successfully
- [ ] Can connect wallet
- [ ] Can interact with contracts
- [ ] API calls work without CORS errors

### Integration
- [ ] Frontend can communicate with backend
- [ ] Frontend can interact with contracts
- [ ] Authentication flow works
- [ ] No console errors in browser

## Next Steps

After deployment is complete:

1. **Monitor**
   - Set up error tracking (Sentry)
   - Monitor Railway logs
   - Check contract events on Etherscan

2. **Maintain**
   - Regular database backups
   - Update dependencies
   - Monitor resource usage

3. **Scale**
   - Upgrade Railway plan if needed
   - Optimize database queries
   - Add caching if needed

## Support Resources

- [Railway Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- [Railway Deployment Checklist](./RAILWAY_DEPLOYMENT_CHECKLIST.md)
- [Contract Deployment Guide](./DEPLOY_CONTRACTS.md)
- [Railway Docs](https://docs.railway.app/)
- [Hardhat Docs](https://hardhat.org/docs)

---

**Estimated Total Time**: 45-60 minutes for full deployment

**Last Updated**: After completing this guide, your full stack should be deployed and operational!

