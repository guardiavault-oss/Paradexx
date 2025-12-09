# Static Asset Debugging Guide

## Current Issue

Assets are returning HTML instead of CSS/JS:
- `https://guardiavault.com/assets/index-Cz_cNU7c.css` → returns HTML
- `https://guardiavault.com/assets/index-7Ig0ypwE.js` → returns HTML

## Root Cause

The asset hashes in the HTML (`index-Cz_cNU7c.css`, `index-7Ig0ypwE.js`) are from an **old build** that doesn't exist in the current deployment.

When Netlify can't find these files:
1. It returns `index.html` (SPA redirect)
2. Browser receives HTML with `text/html` MIME type
3. Browser expects CSS (`text/css`) or JS (`application/javascript`)
4. Error occurs

## Verification Steps

### 1. Check if Assets Exist (After Rebuild)

Visit these URLs directly:
- `https://guardiavault.com/assets/index-Cz_cNU7c.css`
- `https://guardiavault.com/assets/index-7Ig0ypwE.js`

**Expected after rebuild:**
- ✅ Returns CSS/JS content (not HTML)
- ✅ Content-Type header: `text/css` or `application/javascript`
- ✅ Status: 200 OK

**Current (old build):**
- ❌ Returns HTML (404 page or index.html)
- ❌ Content-Type: `text/html`
- ❌ Status: 200 (because of SPA redirect)

### 2. Check Build Output

After building locally:
```bash
pnpm run build
ls -la dist/public/assets/
```

**Should see:**
- `index-[new-hash].css`
- `index-[new-hash].js`
- Other asset files

### 3. Check HTML References

Open `dist/public/index.html` after build:
- Verify `<link>` tags reference files in `/assets/`
- Verify `<script>` tags reference files in `/assets/`
- Check that referenced files exist in `dist/public/assets/`

## Configuration Status

### ✅ Netlify Configuration

**netlify.toml:**
- ✅ Explicit Content-Type headers for `/assets/*.css` and `/assets/*.js`
- ✅ Fallback headers for `/*.css` and `/*.js`
- ✅ `force = false` on SPA redirect (checks files first)
- ✅ Proper caching headers

**client/public/_redirects:**
- ✅ API redirect to Railway
- ✅ SPA fallback (only if file doesn't exist)

### ✅ Vite Configuration

**vite.config.ts:**
- ✅ Assets output to `assets/[name]-[hash].[ext]`
- ✅ CSS code splitting enabled
- ✅ Tree shaking enabled
- ✅ Proper chunk splitting

### ✅ HTML Template

**client/index.html:**
- ✅ Fixed deprecated meta tag
- ✅ Resource hints for performance

## Solution

### Step 1: Rebuild

The fix requires a **new build** because:
- Old asset hashes don't exist
- Performance optimizations changed bundle structure
- New build generates new hashes

```bash
git add .
git commit -m "Fix static asset MIME types and optimize performance"
git push
```

### Step 2: Verify Deployment

After Netlify rebuilds:

1. **Check build logs:**
   - Look for "Build completed successfully"
   - Verify `dist/public/assets/` directory exists
   - Check file sizes are reasonable (not 0 bytes)

2. **Check deployed files:**
   - Visit `https://guardiavault.com/assets/` (should list files or 404)
   - Visit a specific asset URL from new HTML

3. **Check headers:**
   - Open Network tab in browser
   - Check asset requests have correct `Content-Type`
   - Verify status is 200 (not 404)

### Step 3: Clear Cache

After deployment:
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Test in incognito mode

## If Issue Persists After Rebuild

### Check 1: Asset Paths

Verify Vite is outputting to correct location:
- `vite.config.ts` → `outDir: "dist/public"`
- Assets should be in `dist/public/assets/`

### Check 2: Netlify Publish Directory

Verify Netlify is publishing from correct directory:
- `netlify.toml` → `publish = "dist/public"`
- This should match Vite's output directory

### Check 3: Build Output

Check Netlify build logs:
- Does `dist/public/assets/` exist after build?
- Are files being uploaded to Netlify?
- Are file sizes reasonable?

### Check 4: Redirect Rules

Verify redirects aren't interfering:
- `force = false` ensures files checked first
- Headers should apply even if redirect catches request

## Testing Locally

Before deploying, test locally:

```bash
# Build
pnpm run build

# Check assets exist
ls dist/public/assets/*.css
ls dist/public/assets/*.js

# Check HTML references
grep -o 'assets/[^"]*' dist/public/index.html

# Serve locally (optional)
npx serve dist/public
# Visit http://localhost:3000/assets/index-[hash].css
# Should return CSS, not HTML
```

## Expected Result

After rebuild:
- ✅ Assets exist at `/assets/index-[new-hash].css` and `.js`
- ✅ Assets return correct MIME types
- ✅ No console errors
- ✅ Page loads correctly

The configuration is complete and correct. A rebuild is the only remaining step.

