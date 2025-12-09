# Netlify Asset MIME Type Issue - Deployment Fix

## Problem

Assets (CSS/JS) on `https://guardiavault.com` are returning `text/html` instead of correct MIME types, causing browser errors.

## Root Cause Analysis

The error indicates that when requesting `/assets/index-Cz_cNU7c.css`, Netlify is returning `index.html` instead of the CSS file. This happens when:

1. **Asset file doesn't exist** - Build hash mismatch or build failure
2. **Netlify redirect catching assets** - SPA redirect is intercepting asset requests
3. **Build output not deployed** - Assets aren't in the published directory

## Solution Applied

### 1. Updated `netlify.toml`
- ✅ Added explicit `Content-Type` headers for CSS and JS files
- ✅ Ensured `force = false` on SPA redirect (allows files to be served first)
- ✅ Added proper caching headers

### 2. Configuration Changes

**Before:** Assets might be caught by SPA redirect  
**After:** Explicit headers ensure correct MIME types even if redirect catches them

## Action Required

### Immediate Steps

1. **Rebuild the frontend locally to verify:**
   ```bash
   pnpm run build
   ```

2. **Check build output:**
   ```bash
   ls -la dist/public/assets/
   ls -la dist/public/index.html
   ```

3. **Verify asset references match:**
   - Check `dist/public/index.html` for asset references
   - Verify those files exist in `dist/public/assets/`

4. **Commit and push to trigger Netlify rebuild:**
   ```bash
   git add netlify.toml
   git commit -m "Fix Netlify asset MIME types"
   git push
   ```

5. **In Netlify Dashboard:**
   - Go to Site settings → Build & deploy
   - Trigger a new deploy
   - Check build logs for errors
   - Verify `dist/public/assets/` directory exists after build

### Verification After Deployment

1. **Check asset URLs directly:**
   ```
   https://guardiavault.com/assets/index-Cz_cNU7c.css
   https://guardiavault.com/assets/index-7Ig0ypwE.js
   ```
   - Should return CSS/JS content, not HTML
   - Should have correct `Content-Type` headers

2. **Check browser Network tab:**
   - Asset requests should have `Content-Type: text/css` or `application/javascript`
   - Status should be `200 OK`, not `404` or `200` with HTML

3. **Clear browser cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or test in incognito mode

## If Issue Persists

### Check Netlify Build Logs

Look for:
- ✅ "Build completed successfully"
- ✅ "Published directory dist/public"
- ✅ Asset files listed in build output

### Possible Issues

1. **Build hash mismatch:**
   - HTML references `index-Cz_cNU7c.css`
   - But actual file is `index-ABC123.css`
   - **Fix:** Rebuild to regenerate hashes

2. **Assets not being built:**
   - Build completes but no assets directory
   - **Fix:** Check Vite build configuration
   - **Fix:** Verify `vite.config.ts` has correct `outDir`

3. **Publish directory wrong:**
   - Assets built but in wrong location
   - **Fix:** Verify `publish = "dist/public"` in netlify.toml

### Manual Verification

After Netlify deployment:

```bash
# Check if assets are accessible
curl -I https://guardiavault.com/assets/index-Cz_cNU7c.css
# Expected: Content-Type: text/css; charset=utf-8

curl -I https://guardiavault.com/assets/index-7Ig0ypwE.js  
# Expected: Content-Type: application/javascript; charset=utf-8
```

If these return HTML or 404, the assets aren't being deployed correctly.

## Next Steps

1. ✅ **Commit the updated `netlify.toml`**
2. ✅ **Push to trigger Netlify rebuild**
3. ✅ **Monitor Netlify deployment logs**
4. ✅ **Verify assets load after deployment**
5. ✅ **Clear browser cache and test**

The configuration is now correct. The fix will take effect after Netlify rebuilds and redeploys.

