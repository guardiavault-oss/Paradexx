# 🚨 URGENT: Add These to Netlify Dashboard NOW

## Go to: https://app.netlify.com

1. Find your site: **guardiavault**
2. Click on it
3. Go to: **Site configuration** > **Environment variables**
4. Click **Add a variable** and add EACH of these:

## Required Variables:

```
VITE_API_URL
https://guardiavault-production.up.railway.app
```

```
VITE_GUARDIA_VAULT_ADDRESS
0x3D853c85Df825EA3CEd26040Cba0341778eAA891
```

```
VITE_YIELD_VAULT_ADDRESS
0xe63b2eaaE33fbe61C887235668ec0705bCFb463e
```

```
VITE_LIFETIME_ACCESS_ADDRESS
0x01eFA1b345f806cC847aa434FC99c255CDc02Da1
```

```
VITE_CHAIN_ID
11155111
```

```
VITE_SEPOLIA_RPC_URL
https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY_HERE
```

```
VITE_WALLETCONNECT_PROJECT_ID
f32270e55fe94b09ccfc7a375022bb41
```

```
NODE_ENV
production
```

## Stripe Key (NEW - For Payments):

```
VITE_STRIPE_PUBLISHABLE_KEY
pk_live_51S8Jk99WGaMBPmpWLQopcXIcLPo6SAqw5sQ5S5Y84q5YHKWl7f9tT1xjKt2SzoBl5OFBIazjcBreilxfobTUklf800Y8uGb1rJ
```

## After Adding All Variables:

1. Go to **Deploys** tab
2. Click **Trigger deploy** > **Clear cache and deploy site**
3. Wait 2-3 minutes for build
4. Visit https://guardiavault.com to test

## ✅ Quick Check:
- [ ] All 9 variables added
- [ ] Triggered new deployment
- [ ] Site loads at guardiavault.com
- [ ] Pricing buttons work (click "Get Started")
- [ ] Can connect wallet
