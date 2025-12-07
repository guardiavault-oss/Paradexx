# OAuth Redirect Asset Loading Fix

**Date:** November 7, 2025  
**Issue:** After Google OAuth, page stuck loading with 404 error for asset file `index-BoFXPGU-.js`

---

## 🔍 Problem

After completing Google OAuth authentication:
1. OAuth callback redirects to `/dashboard`
2. Browser loads `/dashboard` which serves `index.html`
3. `index.html` references old asset hash (`index-BoFXPGU-.js`)
4. Asset file doesn't exist → 404 error
5. Page stuck in loading state because JavaScript never loads

**Root Cause:**
- Browser or service worker was serving cached `index.html` with old asset references
- OAuth redirect didn't force fresh HTML fetch
- SPA catch-all handlers weren't setting cache-control headers

---

## ✅ Fixes Applied

### 1. Added Cache-Control Headers to SPA Catch-All

**Files Modified:**
- `server/vite.ts` - Production static serving
- `server/routes.ts` - SPA fallback route

**Changes:**
```typescript
// CRITICAL: Prevent HTML caching to ensure fresh asset references
// This is especially important after OAuth redirects and deployments
res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
res.setHeader("Content-Type", "text/html; charset=utf-8");
```

**Impact:**
- Browsers will always revalidate HTML before serving from cache
- Ensures users get latest HTML with correct asset references
- Prevents stale HTML after deployments

### 2. Added Cache-Busting to OAuth Redirects

**File:** `server/routes-oauth.ts`

**Changes:**
```typescript
// Redirect to dashboard with cache-busting query param to ensure fresh HTML
// This prevents serving stale HTML with old asset references after OAuth redirect
const cacheBuster = Date.now();
res.redirect(`/dashboard?_t=${cacheBuster}`);
```

**Applied to:**
- ✅ Google OAuth callback
- ✅ GitHub OAuth callback

**Impact:**
- Query parameter forces browser to treat URL as new
- Bypasses any cached HTML
- Ensures fresh HTML is fetched after OAuth

### 3. Verified Existing Cache Headers

**File:** `server/static.ts`

Already had correct cache headers for `index.html`:
```typescript
if (fileName === "index.html") {
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
}
```

✅ This was already correct, but we needed to add it to SPA catch-all handlers too.

---

## 🚀 How It Works Now

### OAuth Flow:

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth
   - Session state stored

2. **Google redirects back to callback**
   - `/api/auth/oauth/google/callback`
   - User authenticated
   - Session created

3. **Server redirects to dashboard**
   - `/dashboard?_t=1234567890` (with cache-buster)
   - Browser treats as new URL
   - Fetches fresh HTML from server

4. **Server serves fresh HTML**
   - Cache-Control: `max-age=0, must-revalidate`
   - Browser revalidates or fetches fresh
   - HTML contains correct asset references

5. **Assets load correctly**
   - JavaScript files load with current hashes
   - Page renders successfully

---

## 📊 Cache Strategy Summary

### HTML Files:
- **Cache-Control:** `public, max-age=0, must-revalidate`
- **Purpose:** Always fetch fresh to get latest asset references
- **Applied to:** `index.html` served by all SPA catch-all handlers

### Asset Files (JS/CSS):
- **Cache-Control:** `public, max-age=31536000, immutable`
- **Purpose:** Long-term cache (assets are hashed, so immutable)
- **Applied to:** All files in `/assets/` with hashes

### Service Worker:
- **Strategy:** Network-first for HTML
- **Purpose:** Always fetch fresh HTML, cache only as fallback

---

## 🔧 Testing

### Test OAuth Flow:

1. **Clear browser cache:**
   ```javascript
   // In DevTools Console
   caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
   location.reload();
   ```

2. **Test Google OAuth:**
   - Click "Sign in with Google"
   - Complete OAuth flow
   - Should redirect to `/dashboard?_t=...`
   - Page should load without 404 errors

3. **Verify HTML is fresh:**
   - Check Network tab in DevTools
   - Request to `/dashboard?_t=...` should show:
     - Status: 200
     - Cache-Control: `max-age=0, must-revalidate`
     - Response should be fresh HTML

4. **Verify assets load:**
   - Check Network tab
   - All `/assets/*.js` files should load with 200 status
   - No 404 errors

---

## 🐛 Troubleshooting

### Issue: Still getting 404 errors after OAuth

**Check:**
1. Build output exists: `ls dist/public/assets/`
2. Assets are hashed: Files should have hash in name
3. HTML references correct assets: Check `dist/public/index.html`

**Fix:**
```bash
# Rebuild
npm run build

# Verify build output
ls dist/public/assets/
# Should see files like: index-ABC123.js

# Deploy full dist/public/ directory
```

### Issue: HTML still cached

**Check:**
1. Service worker cache: DevTools → Application → Cache Storage
2. Browser cache: DevTools → Network → Disable cache

**Fix:**
```javascript
// Unregister service worker
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);

// Clear caches
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));

// Hard reload
location.reload(true);
```

### Issue: Cache-buster not working

**Check:**
1. OAuth redirect includes `?_t=` parameter
2. Server logs show redirect with query param

**Fix:**
- Verify `server/routes-oauth.ts` has cache-busting code
- Check server logs for redirect URL

---

## 📚 Related Files

- `server/routes-oauth.ts` - OAuth callbacks with cache-busting redirects
- `server/vite.ts` - SPA catch-all with cache headers
- `server/routes.ts` - SPA fallback with cache headers
- `server/static.ts` - Static file serving with cache headers
- `client/public/serviceWorker.js` - Service worker cache strategy

---

## ✅ Status

- ✅ Cache-control headers added to all SPA catch-all handlers
- ✅ OAuth redirects include cache-busting query parameter
- ✅ HTML always served fresh (no aggressive caching)
- ✅ Assets cached long-term (immutable, hashed)
- ✅ Service worker uses network-first for HTML

**OAuth redirect asset loading issue should now be resolved!**

---

## 🎯 Prevention

To prevent this issue in the future:

1. **Always set cache headers for HTML:**
   - `Cache-Control: public, max-age=0, must-revalidate`

2. **Use cache-busting for critical redirects:**
   - OAuth callbacks
   - Post-authentication redirects
   - Post-deployment redirects

3. **Verify build output before deployment:**
   - Check that assets exist
   - Verify HTML references correct assets
   - Test OAuth flow after deployment

4. **Monitor for 404 errors:**
   - Set up error tracking
   - Alert on asset 404s
   - Check logs after deployments

---

**All fixes have been applied. OAuth redirects should now load assets correctly!**

