# Stale Asset Reference Fix - Complete Guide

**Date:** November 7, 2025  
**Error:** `index-BoFXPGU-.js:1 Failed to load resource: the server responded with a status of 404`

---

## 🔍 Error Explanation

**What the error means:**
The browser is trying to load a JavaScript file (`index-BoFXPGU-.js`) that doesn't exist on the server. This happens when:

1. **HTML references old asset hash** - The HTML file contains a reference to an asset from a previous build
2. **Asset file doesn't exist** - The referenced file was from an old build and no longer exists
3. **Build/deployment mismatch** - The server is serving HTML from an old deployment

**Why it happens:**
- Vite generates new hashes for each build (e.g., `index-BoFXPGU-.js` → `index-BalwoG5e.js`)
- If the server still has old HTML, it references old assets
- Old assets are deleted during new builds
- Result: 404 error

---

## ✅ Complete Fix

### Step 1: Rebuild the Application

```bash
# Clean previous build
rm -rf dist

# Rebuild everything
npm run build

# Verify build
npm run verify:build
```

**Expected Output:**
```
✅ Build output directory exists
✅ index.html exists
✅ All referenced assets exist
✅ Build verification PASSED
```

### Step 2: Verify Build Output

```bash
# Check HTML references
cat dist/public/index.html | grep "index-.*\.js"

# Check assets exist
ls dist/public/assets/index-*.js

# They should match!
```

### Step 3: Deploy to Railway

**If Railway auto-deploys from git:**
```bash
git add .
git commit -m "Fix: Rebuild with fresh asset hashes"
git push
```

**If manual deployment:**
1. Upload entire `dist/public/` directory to Railway
2. Ensure all files are included
3. Verify deployment completes

### Step 4: Clear Caches

After deployment, users should:

1. **Hard refresh:**
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Or clear service worker:**
   ```javascript
   // In DevTools Console
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(reg => reg.unregister())
   );
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   location.reload(true);
   ```

---

## 🔧 Root Cause Analysis

### Current Situation:

**Local Build (Correct):**
- HTML references: `index-BalwoG5e.js` ✅
- File exists: `dist/public/assets/index-BalwoG5e.js` ✅

**Production Server (Stale):**
- HTML references: `index-BoFXPGU-.js` ❌
- File doesn't exist: 404 error ❌

**Why Production is Stale:**
1. Old build was deployed
2. New build hasn't been deployed yet
3. Server is serving cached HTML
4. Service worker might be serving cached HTML

---

## 🛠️ All Fixes Applied (Summary)

We've already fixed:

1. ✅ **Service Worker** - Bypasses cache for HTML (`cache: 'no-store'`)
2. ✅ **Cache Headers** - HTML has `max-age=0, must-revalidate`
3. ✅ **OAuth Redirects** - Include cache-busting query params
4. ✅ **SPA Catch-All** - Sets cache headers on HTML responses

**What's Left:**
- ⏳ **Rebuild and redeploy** - Production needs fresh build

---

## 📋 Deployment Checklist

Before deploying:

- [ ] Run `npm run build`
- [ ] Run `npm run verify:build` (should pass)
- [ ] Check `dist/public/index.html` references exist
- [ ] Check `dist/public/assets/` contains all files
- [ ] Deploy entire `dist/public/` directory
- [ ] Verify deployment logs show success
- [ ] Test production URL after deployment

---

## 🚨 Immediate User Fix

While waiting for deployment, users experiencing the error can:

### Quick Fix (Browser Console):
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);

// Clear all caches
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));

// Hard reload
location.reload(true);
```

### Or Use Incognito/Private Mode:
- Opens without service worker
- No cached HTML
- Should work if server has fresh build

---

## 📊 Verification After Deployment

After deploying, verify:

1. **Check HTML:**
   ```bash
   curl https://guardiavault-production.up.railway.app/ | grep "index-.*\.js"
   ```
   Should show NEW hash (e.g., `index-BalwoG5e.js`)

2. **Check Asset:**
   ```bash
   curl -I https://guardiavault-production.up.railway.app/assets/index-BalwoG5e.js
   ```
   Should return: `200 OK`

3. **Test in Browser:**
   - Visit production URL
   - Open DevTools → Network
   - All assets should load with 200 status
   - No 404 errors

---

## 🎯 Prevention

To prevent this in the future:

1. **Always rebuild before deployment**
2. **Use build verification script:** `npm run verify:build`
3. **Deploy full directory** - Don't cherry-pick files
4. **Check deployment logs** - Verify build completed
5. **Test after deployment** - Verify assets load

---

## 📚 Related Files

- `DEPLOYMENT_FIX_GUIDE.md` - Detailed deployment guide
- `scripts/verify-build.js` - Build verification script
- `ASSET_MANAGEMENT_BEST_PRACTICES.md` - Best practices
- `CACHE_FIX.md` - Cache invalidation fixes

---

## ✅ Summary

**The Problem:**
Production server has old HTML referencing old asset hash.

**The Solution:**
1. Rebuild: `npm run build`
2. Verify: `npm run verify:build`
3. Deploy: Push to Railway or manually deploy
4. Test: Verify assets load correctly

**Status:**
- ✅ All code fixes applied
- ⏳ **Action Required:** Rebuild and redeploy

---

**After rebuilding and deploying, the 404 error will be resolved!**

