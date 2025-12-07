# Netlify Environment Variables Setup (Manual)

Since Netlify CLI isn't fully linked, set these variables manually in the Netlify Dashboard.

## Steps to Add Environment Variables

1. Go to: https://app.netlify.com
2. Find your site: **guardiavault** or **690a2a303b76e10008718246--guardiavault**
3. Click on the site
4. Go to: **Site configuration** > **Environment variables**
5. Click **Add a variable** button
6. Add each variable below

## Environment Variables to Add

Copy these exact key-value pairs:

### Backend Connection
```
Key: VITE_API_URL
Value: https://guardiavault-production.up.railway.app
```

### Smart Contract Addresses
```
Key: VITE_GUARDIA_VAULT_ADDRESS
Value: 0x3D853c85Df825EA3CEd26040Cba0341778eAA891
```

```
Key: VITE_YIELD_VAULT_ADDRESS
Value: 0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
```

```
Key: VITE_LIFETIME_ACCESS_ADDRESS
Value: 0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
```

```
Key: VITE_ESCROW_CONTRACT_ADDRESS
Value: 0x0000000000000000000000000000000000000000
```

### Blockchain Configuration
```
Key: VITE_CHAIN_ID
Value: 11155111
```

```
Key: VITE_SEPOLIA_RPC_URL
Value: https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
```

```
Key: VITE_WALLETCONNECT_PROJECT_ID
Value: f32270e55fe94b09ccfc7a375022bb41
```

### Environment
```
Key: NODE_ENV
Value: production
```

## After Adding Variables

1. Go to **Deploys** tab
2. Click **Trigger deploy** > **Clear cache and deploy site**
3. Wait for deployment to complete (~2-3 minutes)
4. Visit https://guardiavault.com to verify

## Verify Variables Are Set

After deployment:
1. Visit https://guardiavault.com
2. Open browser console (F12)
3. Type: `console.log(import.meta.env)`
4. You should see all VITE_ variables listed
