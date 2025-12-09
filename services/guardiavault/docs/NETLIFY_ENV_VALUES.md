# Netlify Environment Variables - Your Values

Copy these **exact values** into Netlify Dashboard → Site Settings → Environment Variables:

## Required Variables

```bash
VITE_GUARDIA_VAULT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
VITE_CHAIN_ID=31337
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/gdgTkaWuifB5DuOCzb7rNF2OEYUQtqom
VITE_WALLETCONNECT_PROJECT_ID=2c4ef17af8df6bd409be181b6b932517
```

## Optional Variables

```bash
VITE_ESCROW_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
VITE_TREASURY_ADDRESS=0x0000000000000000000000000000000000000000
VITE_SENTRY_DSN=(leave empty or add if you have Sentry)
```

## Quick Copy-Paste for Netlify

1. Go to Netlify Dashboard
2. Select your site
3. Go to **Site Settings** → **Environment Variables**
4. Click **"Add variable"** for each:

| Variable Name | Value |
|--------------|-------|
| `VITE_GUARDIA_VAULT_ADDRESS` | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `VITE_CHAIN_ID` | `31337` |
| `VITE_SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/gdgTkaWuifB5DuOCzb7rNF2OEYUQtqom` |
| `VITE_WALLETCONNECT_PROJECT_ID` | `2c4ef17af8df6bd409be181b6b932517` |

## After Setting Variables

1. **Redeploy** your Netlify site (it will auto-rebuild or trigger manually)
2. Test wallet connections work
3. Check browser console for any errors

