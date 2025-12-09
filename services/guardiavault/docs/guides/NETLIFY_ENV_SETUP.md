# Netlify Environment Variables Setup

Set these in **Netlify Dashboard** → **Site Settings** → **Environment Variables**

## Required Variables (Minimum)

These are the **absolute minimum** needed for the app to work:

```bash
# Smart Contract Address (default local Hardhat address)
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Chain ID (31337 = Hardhat local, 11155111 = Sepolia testnet)
VITE_CHAIN_ID=31337

# RPC URL for blockchain connection
# Get free RPC from: https://alchemy.com or https://infura.io
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

## Recommended Variables

These improve functionality but aren't strictly required:

```bash
# WalletConnect Project ID (for better wallet connections)
# Get free ID at: https://cloud.reown.com (formerly WalletConnect Cloud)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Escrow Contract Address (if you've deployed it)
VITE_ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Treasury Address (for payments)
VITE_TREASURY_ADDRESS=0x0000000000000000000000000000000000000000
```

## Optional Variables

```bash
# Sentry Error Tracking (optional)
# Get free account at: https://sentry.io
VITE_SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/your_project_id
```

## Important Notes

1. **All variables must start with `VITE_`** - This is how Vite exposes env vars to the frontend
2. **Update `netlify.toml`** - Line 20 needs your Railway backend URL:
   ```toml
   to = "https://guardiavault-production.up.railway.app/api/:splat"
   ```
3. **Redeploy after changes** - Netlify needs to rebuild to pick up new env vars
4. **No API URL needed** - The frontend uses `/api/*` which Netlify redirects to Railway (configured in `netlify.toml`)

## Quick Setup Steps

1. Go to Netlify Dashboard → Your Site → **Site Settings** → **Environment Variables**
2. Click **"Add variable"** for each variable above
3. **Update `netlify.toml`** line 20 with your Railway URL
4. Commit and push `netlify.toml` changes
5. Netlify will auto-redeploy, or trigger manually from **Deploys** tab

## Testing

After deployment, check browser console:
- ✅ No errors = Variables loaded correctly
- ⚠️ Missing variable warnings = Check variable names (must start with `VITE_`)
- ⚠️ RPC errors = Verify your RPC URL is correct and active

## What NOT to Set in Netlify

These belong in **Railway** (backend), NOT Netlify:
- ❌ `DATABASE_URL`
- ❌ `SESSION_SECRET`
- ❌ `STRIPE_SECRET_KEY`
- ❌ Any variable without `VITE_` prefix

