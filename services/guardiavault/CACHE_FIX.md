# Asset Cache Invalidation Fix

**Date:** November 7, 2025  
**Issue:** 404 errors on asset files (e.g., `index-DIFxhp-j.js`) after deployment

---

## 🔍 Problem

After deploying a new build, users were seeing 404 errors for JavaScript assets:
```
GET https://guardiavault-production.up.railway.app/assets/index-DIFxhp-j.js net::ERR_ABORTED 404 (Not Found)
```

**Root Cause:**
- Vite generates hashed filenames for assets (e.g., `index-DIFxhp-j.js`)
- Each build generates new hashes
- Service worker or browser cache was serving old HTML that referenced old asset hashes
- Old assets no longer exist after new deployment → 404 errors

---

## ✅ Fixes Applied

### 1. Service Worker Cache Version Update

**File:** `client/public/serviceWorker.js`

- Incremented cache version from `v3` to `v4`
- Forces service worker to clear all old caches on activation
- Ensures users get fresh assets after deployment

### 2. HTML Cache Strategy Changed

**File:** `client/public/serviceWorker.js`

**Before:** HTML was cached with `networkFirst` strategy, which could serve stale HTML

**After:** HTML now uses network-first with no cache serving:
- Always fetches HTML from network first
- Only falls back to cache if network completely fails
- Prevents serving stale HTML with old asset references

### 3. Server-Side Cache Headers

**File:** `server/static.ts`

Added cache-control headers for `index.html`:
```javascript
Cache-Control: public, max-age=0, must-revalidate
```

This ensures:
- Browsers don't cache HTML aggressively
- HTML is always revalidated
- Users get latest HTML with correct asset references

### 4. Pages Cache Clearing

**File:** `client/public/serviceWorker.js`

Updated activate handler to clear the 'pages' cache when service worker updates:
- Forces fresh HTML fetch on next navigation
- Prevents serving cached HTML from previous version

---

## 🚀 Deployment Steps

After these changes:

1. **Rebuild the application:**
   ```bash
   npm run build
   ```

2. **Deploy to production**

3. **Users will automatically get the fix:**
   - Service worker will update to v4
   - Old caches will be cleared
   - HTML will be fetched fresh
   - New assets will load correctly

---

## 🔧 Manual Cache Clear (For Testing)

If you need to manually clear cache for testing:

### Browser DevTools:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check "Cache storage" and "Service Workers"
5. Click "Clear site data"

### Programmatic (in console):
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});

// Clear all caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});

// Reload page
location.reload();
```

---

## 📊 How It Works Now

### Asset Loading Flow:

1. **User navigates to site:**
   - Service worker intercepts request
   - HTML request goes to network first (not cache)
   - Fresh HTML is fetched with latest asset hashes

2. **HTML loads:**
   - References assets like `assets/index-ABC123.js`
   - Browser requests these assets
   - Assets are served from server (or cached if they exist)

3. **Service Worker Activation:**
   - On update, old caches are cleared
   - Pages cache is cleared
   - Fresh HTML is always fetched

4. **Cache Headers:**
   - HTML: `max-age=0, must-revalidate` (always fresh)
   - Assets: `max-age=31536000, immutable` (long cache, but immutable)

---

## ✅ Verification

After deployment, verify:

1. **Check service worker version:**
   - Open DevTools → Application → Service Workers
   - Should see version `v4`

2. **Check HTML cache headers:**
   - Network tab → Request to `/` or `/index.html`
   - Response headers should show `Cache-Control: public, max-age=0, must-revalidate`

3. **Check asset loading:**
   - Network tab → Assets should load with 200 status
   - No 404 errors for asset files

4. **Test cache invalidation:**
   - Deploy a new build
   - Old assets should be cleared
   - New assets should load correctly

---

## 📝 Related Files

- `client/public/serviceWorker.js` - Service worker cache logic
- `server/static.ts` - Server-side cache headers
- `vite.config.ts` - Asset hashing configuration

---

## 🔐 Security Notes

- HTML is not cached aggressively (security best practice)
- Assets are cached long-term but are immutable (safe)
- Service worker properly clears old caches (prevents stale data)

---

**All fixes have been applied. The cache invalidation issue should be resolved after the next deployment.**

