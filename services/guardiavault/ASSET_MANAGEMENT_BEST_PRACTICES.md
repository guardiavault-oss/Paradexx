# Asset Management Best Practices

**Date:** November 7, 2025  
**Status:** ✅ Configuration verified and documented

---

## ✅ Current Setup (Verified)

### 1. Dynamic Asset Injection ✅

**File:** `client/index.html`

```html
<script type="module" src="/src/main.tsx" defer></script>
```

✅ **Correct:** Vite automatically replaces this with the correct hashed filename during build.

**How it works:**
- Development: Vite serves `/src/main.tsx` directly
- Production: Vite replaces with `/assets/index-[hash].js` automatically
- No manual intervention needed

### 2. No Hardcoded Asset Filenames ✅

**Verified:** No hardcoded asset references found in codebase.

✅ All assets are referenced through:
- Vite's automatic asset injection
- Public folder assets (served as-is)
- Dynamic imports handled by Vite

### 3. Build Configuration ✅

**File:** `vite.config.ts`

```typescript
build: {
  outDir: path.resolve(__dirname, "dist/public"),
  emptyOutDir: true,
  rollupOptions: {
    input: path.resolve(__dirname, "client/index.html"),
    output: {
      entryFileNames: "assets/[name]-[hash].js",
      chunkFileNames: "assets/[name]-[hash].js",
      assetFileNames: "assets/[name]-[hash].[ext]",
    },
  },
}
```

✅ **Correct:** 
- Assets are hashed automatically
- Output directory is properly configured
- Build directory is cleared before each build

### 4. Deployment Checklist ✅

**Required files for deployment:**
- ✅ `dist/public/index.html` (with injected asset references)
- ✅ `dist/public/assets/` (all hashed assets)
- ✅ `dist/public/serviceWorker.js`
- ✅ `dist/public/manifest.json`
- ✅ `dist/public/icons/` (if exists)
- ✅ `dist/public/splash/` (if exists)

---

## 🚀 Build Process

### Local Build

```bash
# Build the application
npm run build

# Verify build output
ls -la dist/public/
ls -la dist/public/assets/
```

### Build Verification

After building, verify:

1. **index.html exists:**
   ```bash
   test -f dist/public/index.html && echo "✅ index.html exists"
   ```

2. **Assets directory exists:**
   ```bash
   test -d dist/public/assets && echo "✅ assets directory exists"
   ```

3. **Assets are hashed:**
   ```bash
   ls dist/public/assets/ | grep -E '\[hash\]|-[a-f0-9]{8,}\.' && echo "✅ Assets are hashed"
   ```

4. **Service worker exists:**
   ```bash
   test -f dist/public/serviceWorker.js && echo "✅ serviceWorker.js exists"
   ```

### Production Deployment

**Railway/Railway.app:**
1. Build runs automatically on push (if configured)
2. Or manually: `npm run build`
3. Deploy `dist/public/` directory

**Netlify:**
1. Build command: `npm run build`
2. Publish directory: `dist/public`
3. Deploy automatically on push

**Manual Deployment:**
```bash
# Build
npm run build

# Deploy dist/public/ to your hosting provider
# Ensure all files in dist/public/ are uploaded
```

---

## 📋 Preload Links (Development vs Production)

**Current setup in `index.html`:**

```html
<link rel="preload" href="/src/index.css" as="style" />
<link rel="preload" href="/src/design-system.css" as="style" />
```

**Note:** These work in development. In production, Vite will:
- Process these CSS files
- Generate hashed filenames
- Update the HTML automatically

✅ **No changes needed** - Vite handles this automatically.

---

## 🔧 Troubleshooting

### Issue: 404 errors on assets after deployment

**Symptoms:**
```
GET /assets/index-DIFxhp-j.js net::ERR_ABORTED 404 (Not Found)
```

**Causes:**
1. ❌ Old HTML cached with old asset references
2. ❌ Build output not fully deployed
3. ❌ Service worker serving stale cache

**Solutions:**
1. ✅ Clear service worker cache (already fixed - see `CACHE_FIX.md`)
2. ✅ Ensure full `dist/public/` is deployed
3. ✅ Verify build completed successfully
4. ✅ Check that `index.html` has correct asset references

### Issue: Assets not hashed

**Check:**
```bash
# Assets should have hashes
ls dist/public/assets/
# Should see: index-abc123def.js, not index.js
```

**Fix:**
- Ensure `vite.config.ts` has correct output configuration
- Run `npm run build` (not `npm run dev`)
- Check that `emptyOutDir: true` is set

### Issue: Old assets still referenced

**Check build output:**
```bash
# Check what assets index.html references
grep -o 'assets/[^"]*' dist/public/index.html
```

**Verify:**
- All referenced assets exist in `dist/public/assets/`
- No references to old hashes

---

## 🎯 Best Practices Summary

### ✅ DO:

1. **Use Vite's automatic asset injection:**
   ```html
   <script type="module" src="/src/main.tsx"></script>
   ```

2. **Reference assets from public folder:**
   ```typescript
   const image = "/my-image.png"; // ✅ Correct
   ```

3. **Use dynamic imports for code splitting:**
   ```typescript
   const Component = lazy(() => import('./Component')); // ✅ Correct
   ```

4. **Deploy full build output:**
   - Always deploy entire `dist/public/` directory
   - Don't cherry-pick files

5. **Clear caches on deployment:**
   - Service worker cache (handled automatically)
   - CDN cache (if using CDN)
   - Browser cache (handled by cache headers)

### ❌ DON'T:

1. **Don't hardcode asset filenames:**
   ```html
   <!-- ❌ WRONG -->
   <script src="/assets/index-DIFxhp-j.js"></script>
   ```

2. **Don't manually edit build output:**
   - Don't edit `dist/public/index.html` manually
   - Always rebuild instead

3. **Don't skip build step:**
   - Always run `npm run build` before deployment
   - Don't deploy development files

4. **Don't cache HTML aggressively:**
   - HTML should have `max-age=0, must-revalidate`
   - Assets can be cached long-term (immutable)

---

## 📊 Build Output Structure

```
dist/public/
├── index.html              # Main HTML (with injected asset references)
├── assets/
│   ├── index-[hash].js    # Main JavaScript bundle
│   ├── index-[hash].css    # Main CSS bundle
│   ├── vendor-[hash].js   # Vendor chunks (if code-split)
│   └── [chunk]-[hash].js # Other code-split chunks
├── serviceWorker.js        # Service worker
├── manifest.json          # PWA manifest
├── icons/                 # App icons
└── [other public assets]  # Files from client/public/
```

---

## 🔍 Verification Script

Create a `verify-build.sh` script:

```bash
#!/bin/bash

echo "🔍 Verifying build output..."

# Check index.html exists
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ index.html not found"
  exit 1
fi
echo "✅ index.html exists"

# Check assets directory exists
if [ ! -d "dist/public/assets" ]; then
  echo "❌ assets directory not found"
  exit 1
fi
echo "✅ assets directory exists"

# Check assets are hashed
if ! ls dist/public/assets/*.js 2>/dev/null | grep -qE '\[hash\]|-[a-f0-9]{8,}\.'; then
  if ls dist/public/assets/*.js 2>/dev/null | grep -qE '-[a-f0-9]{8,}\.'; then
    echo "✅ Assets are hashed"
  else
    echo "⚠️  Assets may not be hashed (check manually)"
  fi
fi

# Check service worker exists
if [ ! -f "dist/public/serviceWorker.js" ]; then
  echo "⚠️  serviceWorker.js not found (optional)"
else
  echo "✅ serviceWorker.js exists"
fi

echo "✅ Build verification complete"
```

---

## 📚 Related Documentation

- `CACHE_FIX.md` - Cache invalidation fixes
- `vite.config.ts` - Build configuration
- `client/index.html` - Entry HTML template

---

## ✅ Current Status

- ✅ Dynamic asset injection configured correctly
- ✅ No hardcoded asset filenames
- ✅ Build output properly structured
- ✅ Cache invalidation handled
- ✅ Service worker updated to v4
- ✅ Build scripts configured correctly

**All best practices are being followed. The setup is production-ready.**

---

## 🚀 Quick Reference

### Build Commands

```bash
# Full build (client + server)
npm run build

# Client only
npm run build:client

# Server only
npm run build:server

# Verify deployment readiness
npm run check:deployment
```

### Build Output

- **Client:** `dist/public/` (deploy this directory)
- **Server:** `dist/index.js` (server entry point)

### Deployment Checklist

1. ✅ Run `npm run build`
2. ✅ Verify `dist/public/index.html` exists
3. ✅ Verify `dist/public/assets/` contains hashed files
4. ✅ Deploy entire `dist/public/` directory
5. ✅ Ensure service worker is included
6. ✅ Clear CDN/browser cache if needed

