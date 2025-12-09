# MIME Type Fix - Static Asset Serving

## Issue

The browser console shows errors like:
```
Refused to apply style from 'https://guardiavault.com/assets/index-Cz_cNU7c.css' 
because its MIME type ('text/html') is not a supported stylesheet MIME type
```

This happens when:
1. Static asset files (CSS/JS) are not found
2. Server returns HTML 404 page instead of the asset
3. Browser receives HTML with `text/html` MIME type instead of `text/css` or `application/javascript`

## Root Cause

The catch-all route (`app.use("*", ...)`) was intercepting asset requests and returning `index.html` with `text/html` MIME type, even when the asset file didn't exist.

## Fix Applied

Updated `server/static.ts` to:

1. **Explicit MIME type setting** for static files:
   ```typescript
   app.use(express.static(distPath, {
     setHeaders: (res, filePath) => {
       if (filePath.endsWith('.css')) {
         res.setHeader('Content-Type', 'text/css; charset=utf-8');
       } else if (filePath.endsWith('.js')) {
         res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
       }
     }
   }));
   ```

2. **Asset detection in catch-all route**:
   - Check if request is for an asset file (has file extension)
   - Return 404 JSON instead of HTML for missing assets
   - Only serve `index.html` for non-asset routes (SPA routing)

## Testing

After deploying this fix:

1. **Check browser console** - MIME type errors should be gone
2. **Verify assets load** - CSS and JS files should load correctly
3. **Check Network tab** - Assets should have correct `Content-Type` headers

## Additional Notes

### For Netlify Deployment

If deploying to Netlify, ensure:
- Assets are in `dist/public/assets/` directory
- `netlify.toml` has correct `publish` directory
- Redirect rules don't interfere with asset serving

### For Express Server

The fix ensures:
- `express.static` serves files with correct MIME types
- Missing assets return 404 JSON (not HTML)
- SPA routing only applies to non-asset routes

## Deployment

After applying this fix:
1. Rebuild the application
2. Deploy to production
3. Clear browser cache
4. Verify assets load correctly

