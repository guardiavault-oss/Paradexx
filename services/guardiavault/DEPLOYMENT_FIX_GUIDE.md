# Deployment Fix Guide - Stale Asset References

**Date:** November 7, 2025  
**Issue:** Production server serving HTML with old asset hash `index-BoFXPGU-.js` (404 error)

---

## 🔍 Problem Analysis

**Current Situation:**
- ✅ Local build output: `index-BalwoG5e.js` (correct, new hash)
- ❌ Production server: Serving HTML with `index-BoFXPGU-.js` (old hash, doesn't exist)
- ❌ Browser: Trying to load old hash → 404 error

**Root Cause:**
The production server (Railway) is serving an **old build** that references assets from a previous deployment. The HTML file on the server still has the old asset hash.

---

## ✅ Solution: Rebuild and Redeploy

### Step 1: Clean and Rebuild

```bash
# Clean previous build
rm -rf dist

# Rebuild everything
npm run build

# Or if using pnpm
pnpm run build
```

### Step 2: Verify Build Output

```bash
# Check HTML references
cat dist/public/index.html | grep "index-.*\.js"

# Check assets exist
ls dist/public/assets/index-*.js

# Verify they match
# HTML should reference files that exist in assets/
```

**Expected Output:**
- HTML should reference: `/assets/index-[NEW-HASH].js`
- File should exist: `dist/public/assets/index-[NEW-HASH].js`
- Hashes should match!

### Step 3: Deploy to Railway

**Option A: Git Push (if Railway auto-deploys)**
```bash
git add .
git commit -m "Fix: Rebuild with fresh asset hashes"
git push
```

**Option B: Manual Deployment**
1. Ensure `dist/public/` contains all files
2. Deploy entire `dist/public/` directory to Railway
3. Verify deployment completes successfully

### Step 4: Verify Deployment

After deployment, check:

1. **HTML is fresh:**
   ```bash
   curl https://guardiavault-production.up.railway.app/ | grep "index-.*\.js"
   ```
   Should show the NEW hash (e.g., `index-BalwoG5e.js`)

2. **Asset exists:**
   ```bash
   curl -I https://guardiavault-production.up.railway.app/assets/index-BalwoG5e.js
   ```
   Should return: `200 OK` (not 404)

3. **Test in browser:**
   - Visit: `https://guardiavault-production.up.railway.app/login`
   - Open DevTools → Network tab
   - Check that assets load with 200 status
   - No 404 errors

---

## 🚨 Immediate Fix for Users

While waiting for deployment, users can:

### Option 1: Hard Refresh
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`
- This bypasses cache and fetches fresh HTML

### Option 2: Clear Service Worker
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload(true);
```

### Option 3: Disable Service Worker (Temporary)
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);
location.reload();
```

---

## 🔧 Prevention

To prevent this in the future:

### 1. Always Rebuild Before Deployment
```bash
npm run build
# Verify build output
ls dist/public/assets/
```

### 2. Verify Build Completeness
```bash
# Check HTML references match assets
grep -o 'assets/[^"]*' dist/public/index.html | while read asset; do
  if [ ! -f "dist/public/$asset" ]; then
    echo "❌ Missing: $asset"
  else
    echo "✅ Found: $asset"
  fi
done
```

### 3. Deploy Full Directory
- Always deploy entire `dist/public/` directory
- Don't cherry-pick files
- Ensure all assets are included

### 4. Check Deployment Logs
- Verify build completed successfully
- Check that assets directory was uploaded
- Verify file sizes are reasonable (not 0 bytes)

---

## 📊 Build Verification Script

Create `verify-build.js`:

```javascript
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const distPath = 'dist/public';
const indexPath = join(distPath, 'index.html');

if (!existsSync(indexPath)) {
  console.error('❌ index.html not found');
  process.exit(1);
}

const html = readFileSync(indexPath, 'utf-8');
const assetMatches = html.match(/assets\/[^"']+\.(js|css)/g) || [];

console.log('📋 Assets referenced in HTML:');
assetMatches.forEach(asset => {
  const assetPath = join(distPath, asset);
  if (existsSync(assetPath)) {
    console.log(`  ✅ ${asset}`);
  } else {
    console.error(`  ❌ ${asset} - MISSING!`);
    process.exit(1);
  }
});

console.log('\n✅ All assets exist!');
```

Run: `node verify-build.js`

---

## 🐛 Troubleshooting

### Issue: Build completes but assets missing

**Check:**
1. Vite build logs for errors
2. `dist/public/assets/` directory exists
3. Files have non-zero size

**Fix:**
```bash
# Clean and rebuild
rm -rf dist node_modules/.vite
npm run build
```

### Issue: HTML references old hash after rebuild

**Check:**
1. `emptyOutDir: true` in `vite.config.ts`
2. Build actually completed (check logs)
3. No cached build artifacts

**Fix:**
```bash
# Force clean rebuild
rm -rf dist
npm run build
```

### Issue: Deployment doesn't update files

**Check:**
1. Railway deployment logs
2. Files actually uploaded
3. Server restarted after deployment

**Fix:**
- Trigger manual rebuild in Railway dashboard
- Or redeploy via git push

---

## 📚 Related Documentation

- `ASSET_MANAGEMENT_BEST_PRACTICES.md` - Asset management guide
- `CACHE_FIX.md` - Cache invalidation fixes
- `OAUTH_ASSET_FIX.md` - OAuth redirect fixes
- `SERVICE_WORKER_HTML_FIX.md` - Service worker fixes

---

## ✅ Quick Checklist

Before deploying:
- [ ] Run `npm run build`
- [ ] Verify `dist/public/index.html` exists
- [ ] Verify `dist/public/assets/` contains files
- [ ] Check HTML references match actual assets
- [ ] Deploy entire `dist/public/` directory
- [ ] Verify deployment logs show success
- [ ] Test production URL after deployment

---

## 🎯 Summary

**The Issue:**
Production server has old HTML with old asset references.

**The Fix:**
1. Rebuild: `npm run build`
2. Verify: Check assets match HTML references
3. Deploy: Push to Railway or manually deploy
4. Test: Verify assets load correctly

**Prevention:**
- Always rebuild before deployment
- Verify build completeness
- Deploy full directory
- Check deployment logs

---

**After rebuilding and deploying, the 404 errors should be resolved!**

