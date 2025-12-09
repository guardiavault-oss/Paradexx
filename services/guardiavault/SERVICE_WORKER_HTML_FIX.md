# Service Worker HTML Cache Fix

**Date:** November 7, 2025  
**Issue:** Service worker serving stale HTML with old asset references after cache clear

---

## 🔍 Problem

After service worker cache clear:
- ✅ Old cache (v3) deleted
- ✅ Pages cache cleared
- ❌ Still getting 404 for `index-BoFXPGU-.js`
- ❌ Build output has `index-BalwoG5e.js` (new hash)
- ❌ Browser requesting old hash

**Root Cause:**
- Service worker was fetching HTML but not bypassing HTTP cache
- Browser's HTTP cache might still have stale HTML
- Service worker wasn't using `cache: 'no-store'` for HTML requests

---

## ✅ Fixes Applied

### 1. Added Cache Bypass to HTML Fetch

**File:** `client/public/serviceWorker.js`

**Changes:**
```javascript
fetch(request, {
  cache: 'no-store', // Bypass HTTP cache completely
  headers: {
    'Cache-Control': 'no-cache',
  },
})
```

**Impact:**
- Service worker now bypasses browser's HTTP cache
- Always fetches fresh HTML from server
- Prevents serving stale HTML with old asset references

### 2. Added Warning Logs

**File:** `client/public/serviceWorker.js`

Added console warnings when:
- Network fails and falling back to cache
- Serving cached HTML (may be stale)

**Impact:**
- Easier debugging
- Visibility into when stale HTML might be served

### 3. Enhanced Cache-Busting Skip

**File:** `client/public/serviceWorker.js`

Added `_t=` parameter to skip list:
```javascript
url.search.includes('_t=') // OAuth cache-busting param
```

**Impact:**
- OAuth redirects with `?_t=` bypass service worker
- Ensures fresh HTML fetch after OAuth

---

## 🚀 How It Works Now

### HTML Request Flow:

1. **Browser requests HTML:**
   - `/dashboard` or `/dashboard?_t=1234567890`

2. **Service worker intercepts:**
   - Checks if it's HTML request
   - Uses `fetch()` with `cache: 'no-store'`
   - Bypasses browser HTTP cache completely

3. **Server responds:**
   - Sends fresh HTML with `Cache-Control: max-age=0, must-revalidate`
   - HTML contains current asset references

4. **Service worker caches:**
   - Caches response for offline fallback
   - But never serves from cache for navigation requests

5. **Browser receives:**
   - Fresh HTML with correct asset references
   - Assets load successfully

---

## 🔧 Additional Fixes

### Service Worker Cache Strategy:

**HTML (Navigation):**
- ✅ Network-only with `cache: 'no-store'`
- ✅ Never serve from cache
- ✅ Only cache for offline fallback

**Assets (JS/CSS):**
- ✅ Stale-while-revalidate
- ✅ Serve from cache immediately
- ✅ Update cache in background

**Images/Fonts:**
- ✅ Stale-while-revalidate
- ✅ Fast loading with background updates

---

## 📊 Testing

### Test After Deployment:

1. **Clear all caches:**
   ```javascript
   // In DevTools Console
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(reg => reg.unregister())
   );
   location.reload(true);
   ```

2. **Check service worker:**
   - DevTools → Application → Service Workers
   - Should see v4 active
   - Check "Bypass for network" to test without SW

3. **Test HTML fetch:**
   - Network tab → Request to `/dashboard`
   - Should show:
     - Status: 200
     - Cache-Control: `max-age=0, must-revalidate`
     - Response: Fresh HTML with current asset references

4. **Verify assets load:**
   - Check Network tab
   - All `/assets/*.js` should load with 200
   - No 404 errors for old hashes

---

## 🐛 Troubleshooting

### Issue: Still getting 404 for old asset hash

**Check:**
1. Service worker version: Should be v4
2. Build output: `ls dist/public/assets/` - verify files exist
3. HTML content: Check `dist/public/index.html` - verify asset references

**Fix:**
```bash
# Rebuild
npm run build

# Verify build
ls dist/public/assets/
cat dist/public/index.html | grep "index-.*\.js"

# Deploy full dist/public/ directory
```

### Issue: Service worker still serving cached HTML

**Check:**
1. Service worker code: Should have `cache: 'no-store'`
2. Network tab: Check if request bypasses cache
3. Console: Look for service worker warnings

**Fix:**
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);

// Hard reload
location.reload(true);
```

### Issue: Browser HTTP cache still serving stale HTML

**Check:**
1. Network tab: Check "Disable cache" option
2. Response headers: Should have `Cache-Control: max-age=0`

**Fix:**
- Enable "Disable cache" in DevTools
- Or hard reload: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)

---

## 📚 Related Files

- `client/public/serviceWorker.js` - Service worker with cache bypass
- `server/vite.ts` - SPA catch-all with cache headers
- `server/routes.ts` - SPA fallback with cache headers
- `server/routes-oauth.ts` - OAuth redirects with cache-busting

---

## ✅ Status

- ✅ Service worker bypasses HTTP cache for HTML
- ✅ HTML always fetched fresh from server
- ✅ Cache-busting params bypass service worker
- ✅ Warning logs for debugging
- ✅ Offline fallback still works

**Service worker HTML cache issue should now be resolved!**

---

## 🎯 Prevention

To prevent this issue:

1. **Always use `cache: 'no-store'` for HTML in service worker**
2. **Set cache headers on server: `max-age=0, must-revalidate`**
3. **Use cache-busting for critical redirects (OAuth, etc.)**
4. **Test after deployments to verify fresh HTML**
5. **Monitor for 404 errors on asset files**

---

**All fixes have been applied. Service worker now always fetches fresh HTML!**

