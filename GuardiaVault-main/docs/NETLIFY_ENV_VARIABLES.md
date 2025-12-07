# Netlify Environment Variables Guide

## Required Variables (Must Set)

These are **required** for the app to work properly:

### 1. Smart Contract Address
```bash
VITE_GUARDIA_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
```
**What to put:**
- After deploying your GuardiaVault smart contract, use the deployed contract address
- Format: `0x` followed by 40 hex characters
- For testing, you can use a placeholder: `0x0000000000000000000000000000000000000000`
- **Example:** `0x1234567890abcdef1234567890abcdef12345678`

### 2. Blockchain Network Chain ID
```bash
VITE_CHAIN_ID=11155111
```
**What to put:**
- `31337` = Hardhat local network (development)
- `11155111` = Sepolia testnet (**recommended for testing**)
- `1` = Ethereum mainnet (**only for production**)
- **Recommended:** Start with `11155111` (Sepolia testnet)

### 3. Sepolia RPC URL
```bash
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```
**What to put:**
- Get a **free** RPC endpoint from:
  - **Infura:** https://infura.io (free tier: 100k requests/day)
  - **Alchemy:** https://alchemy.com (free tier: 300M compute units/month)
  - **QuickNode:** https://quicknode.com (free tier available)
- Replace `YOUR_INFURA_PROJECT_ID` with your actual project ID
- **Example:** `https://sepolia.infura.io/v3/abc123def456...`

**How to get Infura RPC:**
1. Go to https://infura.io
2. Sign up (free)
3. Create a project
4. Copy the Sepolia endpoint URL
5. Paste into `VITE_SEPOLIA_RPC_URL`

---

## Optional but Recommended

### 4. WalletConnect Project ID (Recommended)
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```
**What to put:**
- Get a **free** project ID from: https://cloud.reown.com (formerly WalletConnect Cloud)
- This enables WalletConnect, Coinbase Wallet, and other wallet connections
- **Without this:** Wallet connections may be limited
- **Format:** Usually looks like: `abc123def456ghi789...`

**How to get WalletConnect Project ID:**
1. Go to https://cloud.reown.com
2. Sign up (free)
3. Create a new project
4. Copy the Project ID
5. Paste into `VITE_WALLETCONNECT_PROJECT_ID`

### 5. Sentry Error Tracking (Optional)
```bash
VITE_SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/your_project_id
```
**What to put:**
- Get from your Sentry project (https://sentry.io)
- Helps track frontend errors in production
- **Without this:** Errors won't be tracked, but app still works

---

## Quick Setup for Testing

**Minimal setup to get started:**

```bash
# Required - Use testnet values
VITE_GUARDIA_VAULT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Optional but recommended
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_SENTRY_DSN=https://... (optional)
```

---

## How to Set in Netlify

### Option 1: Netlify Dashboard (Easiest)

1. Go to your Netlify site dashboard
2. Click **Site settings** (gear icon)
3. Click **Environment variables** in left sidebar
4. Click **Add variable**
5. Add each variable:
   - **Key:** `VITE_GUARDIA_VAULT_ADDRESS`
   - **Value:** `0x...`
   - **Scopes:** Select "All scopes" (or specific environments)
6. Click **Save**
7. Repeat for each variable

### Option 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Set variables
netlify env:set VITE_GUARDIA_VAULT_ADDRESS 0x0000000000000000000000000000000000000000
netlify env:set VITE_CHAIN_ID 11155111
netlify env:set VITE_SEPOLIA_RPC_URL "https://sepolia.infura.io/v3/YOUR_KEY"
netlify env:set VITE_WALLETCONNECT_PROJECT_ID "your_project_id"
```

---

## Complete Example

Here's what a complete Netlify environment variables setup looks like:

```bash
# Required
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=11155111
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Recommended
VITE_WALLETCONNECT_PROJECT_ID=abc123def456ghi789jkl012mno345pqr

# Optional
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789012
```

---

## Important Notes

### ⚠️ All Variables Must Start with `VITE_`
- Netlify only exposes variables that start with `VITE_` to the frontend
- Backend variables (like `DATABASE_URL`) go in **Railway**, not Netlify

### 🔄 After Setting Variables
1. **Redeploy** your site for changes to take effect
2. Netlify will automatically rebuild with new variables
3. Or trigger manual deploy from dashboard

### 🧪 Testing Your Variables
After deployment, check browser console:
- No errors = Variables loaded correctly
- Missing variable warnings = Check variable names and values
- Check Network tab to see if RPC calls work

---

## Troubleshooting

### "Variable not found"
- ✅ Check variable name starts with `VITE_`
- ✅ Check for typos
- ✅ Redeploy after setting variables

### "RPC URL not working"
- ✅ Verify Infura/Alchemy project is active
- ✅ Check URL format (should include `/v3/` for Infura)
- ✅ Verify API key is correct

### "WalletConnect not working"
- ✅ Verify project ID is correct
- ✅ Check project is active on cloud.reown.com
- ✅ App will still work without it, just with limited wallets

---

## What NOT to Set in Netlify

These belong in **Railway** (backend), not Netlify:
- ❌ `DATABASE_URL` → Railway
- ❌ `SESSION_SECRET` → Railway
- ❌ `STRIPE_SECRET_KEY` → Railway
- ❌ Any non-`VITE_*` variables → Railway

---

## Next Steps

1. ✅ Set required variables (at minimum: `VITE_CHAIN_ID`, `VITE_SEPOLIA_RPC_URL`)
2. ✅ Get Infura/Alchemy RPC URL (free tier is fine)
3. ✅ Optionally get WalletConnect project ID
4. ✅ Deploy and test
5. ✅ Add smart contract address after deploying contracts

**You're ready!** 🚀

