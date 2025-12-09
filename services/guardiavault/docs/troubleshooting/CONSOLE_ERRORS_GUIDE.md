# Console Errors Guide

This guide explains common console errors and warnings you may see during development and how to resolve them.

## Expected Warnings (Non-Critical)

### 1. Sentry Not Configured

**Message:**
```
⚠️ Sentry not configured for client - skipping initialization
```

**Explanation:** This is an optional service for error tracking. If you don't need error tracking in development, you can safely ignore this.

**To Fix (Optional):**
1. Sign up at [sentry.io](https://sentry.io)
2. Create a React/JavaScript project
3. Copy the DSN
4. Add to `.env`:
   ```env
   VITE_SENTRY_DSN=https://your_key@your_org.ingest.sentry.io/your_project_id
   ```
5. Restart your development server

### 2. WalletConnect Project ID Not Configured

**Message:**
```
⚠️ WalletConnect project ID not configured - wallet features may be limited
```

**Explanation:** WalletConnect/Reown requires a project ID for wallet connections. The app will still work, but wallet connection features may be limited.

**To Fix:**
1. Sign up at [cloud.reown.com](https://cloud.reown.com) (formerly WalletConnect Cloud)
2. Create a new project
3. Copy your project ID
4. Add to `.env`:
   ```env
   VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```
5. Restart your development server

**Note:** Until you configure this, you may see 403 errors from WalletConnect API endpoints. This is expected and won't affect core functionality.

### 3. Lit Dev Mode Warning

**Message:**
```
Lit is in dev mode. Not recommended for production!
```

**Explanation:** This is just a warning that Lit.js is running in development mode. It's safe to ignore in development.

**To Fix:** Ensure `NODE_ENV=production` when building for production. The warning won't appear in production builds.

## Expected Errors (Non-Critical)

### 4. Base Account SDK Cross-Origin-Opener-Policy Warning

**Message:**
```
Base Account SDK requires the Cross-Origin-Opener-Policy header to not be set to 'same-origin'
```

**Explanation:** The Base Account SDK requires specific CORS/COOP headers. This has been configured in `server/index.ts`.

**Status:** ✅ Fixed - The COOP header is now disabled in the helmet configuration.

### 5. WalletConnect API 403 Errors

**Messages:**
```
Failed to load resource: the server responded with a status of 403 ()
pulse.walletconnect.org/e?projectId=00000000000000000000000000000000
api.web3modal.org/appkit/v1/config?projectId=00000000000000000000000000000000
```

**Explanation:** These errors occur when using the default/dummy WalletConnect project ID. They're expected and won't affect functionality.

**To Fix:** Configure `VITE_WALLETCONNECT_PROJECT_ID` as described in warning #2 above.

## Authentication Errors

### 6. API Auth/Me 401 (Unauthorized)

**Message:**
```
api/auth/me: Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Explanation:** This is expected if you're not logged in. The app checks authentication status on load.

**Status:** ✅ Normal behavior - The app will handle this gracefully.

### 7. API Auth/Register 500 (Internal Server Error)

**Message:**
```
api/auth/register: Failed to load resource: the server responded with a status of 500 (Internal Server Error)
```

**Possible Causes:**
1. Database not running or connection failed
2. Database schema not initialized
3. Validation error (check server logs for details)

**To Fix:**
1. Check that PostgreSQL is running:
   ```bash
   # If using Docker
   docker-compose up -d
   
   # Or check your database connection
   psql $DATABASE_URL
   ```

2. Initialize the database schema:
   ```bash
   pnpm run db:push
   ```

3. Check server console logs for detailed error messages

4. Verify your `.env` file has correct `DATABASE_URL`

## Summary

Most console warnings and errors are either:
- **Optional services** not yet configured (Sentry, WalletConnect)
- **Expected behavior** (authentication checks)
- **Development-mode warnings** (Lit dev mode)

The critical errors to address are:
- Database connection issues (check `DATABASE_URL` and that PostgreSQL is running)
- Missing environment variables for required services

All optional services have clear setup instructions in `env.example`.

