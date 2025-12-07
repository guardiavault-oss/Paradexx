# Railway Healthcheck Failure - Fix Guide

## Problem

Railway healthcheck is failing with "service unavailable" after successful build. The server is not responding to `/health` requests.

## Root Causes

1. **Environment Validation Failure**: The server exits immediately if required secrets are missing
2. **Migration Script Errors**: `startup.sh` uses `set -e` which exits on any error
3. **Server Not Starting**: If validation fails, the server never listens

## Fix Applied

### 1. Updated `scripts/startup.sh`
- Removed `set -e` to allow server to start even if migrations fail
- This ensures healthcheck works even with temporary database issues

### 2. Environment Variables Required

Make sure these are set in Railway:
- `NODE_ENV=production`
- `SESSION_SECRET` (at least 32 chars, not a default value)
- `WIZARD_ENCRYPTION_KEY` (64 hex chars)
- `ENCRYPTION_KEY` (64 hex chars, required in production)
- `SSN_SALT` (at least 16 chars, required in production)
- `DATABASE_URL` (PostgreSQL connection string)

### 3. Verification Steps

**Check Railway logs for:**
1. Environment validation errors
2. Database connection errors
3. Migration failures
4. Server startup messages

**Expected log output:**
```
🚀 [STARTUP] Server process starting...
🚀 [STARTUP] Node version: v20.x.x
✅ Environment validation passed
✅ Health endpoint registered at /health
✅ Server confirmed listening and ready for healthchecks
```

**If you see errors like:**
```
❌ SESSION_SECRET validation failed
❌ WIZARD_ENCRYPTION_KEY is REQUIRED but not set
```
→ **These environment variables are missing in Railway**

## Action Required

1. **Set all required environment variables in Railway:**
   - Go to Railway Dashboard → Your Service → Variables
   - Add all required variables from `.env` file
   - Ensure `NODE_ENV=production`

2. **Redeploy:**
   - Push this fix (updated `startup.sh`)
   - Railway will rebuild automatically
   - Monitor logs for startup messages

3. **Verify healthcheck:**
   - Check Railway logs for "Server confirmed listening"
   - Healthcheck should pass after ~30 seconds

## Troubleshooting

### Server crashes immediately
**Check logs for:**
- Environment validation errors
- Missing required secrets

**Fix:** Add all required environment variables in Railway

### Migrations fail but server should still start
**Current fix:** Removed `set -e` so server starts even if migrations fail

### Database connection issues
**Server should still respond to `/health`** even if database is down
- Health endpoint returns `{ status: "degraded" }` if database unavailable
- Still returns HTTP 200 so Railway healthcheck passes

### Port/Host issues
**Check Railway logs for:**
- "Port X is already in use" → Port conflict
- "Server failed to start listening" → Listen error

**Fix:** Railway sets `PORT` automatically - ensure server uses it

## Next Steps

1. ✅ Verify all environment variables are set in Railway
2. ✅ Commit and push the updated `startup.sh`
3. ✅ Monitor Railway logs during deployment
4. ✅ Verify healthcheck passes after deployment

