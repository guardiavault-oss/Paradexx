# Netlify Asset MIME Type Fix

## Problem

Assets (CSS/JS) are being served with `text/html` MIME type instead of the correct types, causing browser errors:
- `Refused to apply style from '...css' because its MIME type ('text/html') is not a supported stylesheet MIME type`
- `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"`

## Root Cause

When Netlify can't find an asset file, the SPA redirect rule (`/*` → `/index.html`) catches the request and returns HTML instead of the asset. This happens when:
1. Assets aren't built correctly
2. Assets are in wrong location
3. Build hash mismatch between HTML and actual files

## Fix Applied

### 1. Updated `netlify.toml`
- Added explicit Content-Type headers for CSS and JS files
- Ensured assets are served before SPA redirect applies
- Added proper caching headers

### 2. Build Verification

**Check that assets are being built:**
```bash
pnpm run build
ls -la dist/public/assets/
```

**Expected output:**
- `index-[hash].css` file
- `index-[hash].js` file
- Other asset files

### 3. Deployment Steps

1. **Rebuild the frontend:**
   ```bash
   pnpm run build
   ```

2. **Verify build output:**
   ```bash
   # Check that assets exist
   ls dist/public/assets/*.css
   ls dist/public/assets/*.js
   ```

3. **Deploy to Netlify:**
   - Push changes to trigger Netlify build
   - Or manually trigger rebuild in Netlify dashboard
   - Verify build completes successfully

4. **Check Netlify deployment logs:**
   - Look for "Build completed successfully"
   - Check that `dist/public/assets/` directory exists
   - Verify file sizes are reasonable (not 0 bytes)

## Troubleshooting

### Assets not found after build

**Check:**
1. Vite build completed without errors
2. `dist/public/assets/` directory exists
3. Files have correct hashes matching `index.html`

**Fix:**
```bash
# Clean and rebuild
rm -rf dist
pnpm run build
```

### Build hash mismatch

**Symptom:** HTML references `index-Cz_cNU7c.css` but file doesn't exist

**Fix:** Rebuild to generate new hashes:
```bash
pnpm run build
```

### Netlify not serving assets

**Check Netlify redirect rules:**
- Ensure `force = false` on SPA redirect
- Verify assets are excluded from redirect
- Check Netlify build logs for errors

### Manual Verification

**After deployment, test:**
```bash
# Check if assets are accessible
curl -I https://guardiavault.com/assets/index-[hash].css
# Should return: Content-Type: text/css

curl -I https://guardiavault.com/assets/index-[hash].js
# Should return: Content-Type: application/javascript
```

## Next Steps

1. ✅ Rebuild frontend: `pnpm run build`
2. ✅ Push to trigger Netlify deployment
3. ✅ Verify assets load correctly
4. ✅ Clear browser cache
5. ✅ Test in incognito mode

## Prevention

- Always verify build output before deploying
- Check Netlify build logs for errors
- Test asset URLs after deployment
- Monitor Netlify deployment status

