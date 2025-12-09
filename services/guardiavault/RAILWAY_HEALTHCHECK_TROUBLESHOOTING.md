# Railway Healthcheck Troubleshooting

## Current Issue

Railway healthcheck is failing with "service unavailable" after successful build.

## Build Status

- ✅ Build completed successfully (9.70 seconds)
- ✅ All files copied correctly
- ❌ Healthcheck failing - server not responding

## Root Cause

The server is likely:
1. **Crashing during startup** (most likely - missing env vars)
2. **Not listening on the correct port**
3. **Taking too long to start** (Railway timeout)

## Most Likely Issue: Missing Environment Variables

The server requires these environment variables in Railway:

### Required Variables (MUST be set)

1. **`NODE_ENV`** = `production`
2. **`SESSION_SECRET`** = (at least 32 chars, from your .env file)
3. **`WIZARD_ENCRYPTION_KEY`** = (64 hex chars, from your .env file)
4. **`ENCRYPTION_KEY`** = (64 hex chars, from your .env file)
5. **`SSN_SALT`** = (at least 16 chars, from your .env file)
6. **`DATABASE_URL`** = (PostgreSQL connection string)

### How to Set in Railway

1. Go to **Railway Dashboard**
2. Select your **GuardiaVault service**
3. Click **Variables** tab
4. Click **+ New Variable**
5. Add each variable with its value (from your `.env` file)
6. **Save** each variable

## Debugging Steps

### Step 1: Check Railway Logs

In Railway Dashboard → Deploys → Latest Deploy → Logs

**Look for:**
```
🚀 [STARTUP] Server process starting...
🚀 [STARTUP] DATABASE_URL: ✅ set or ❌ not set
🚀 [STARTUP] SESSION_SECRET: ✅ set or ❌ not set
```

**If you see:**
- `❌ not set` → Variable is missing
- `❌ [ENV VALIDATION] CRITICAL ERROR` → Validation failed
- `❌ [FATAL] Exiting due to missing required environment variables` → Server started but exited

### Step 2: Check Environment Variables

In Railway Dashboard → Variables, verify all required variables are set:
- ✅ NODE_ENV=production
- ✅ SESSION_SECRET (check it's set)
- ✅ WIZARD_ENCRYPTION_KEY (check it's set)
- ✅ ENCRYPTION_KEY (check it's set)
- ✅ SSN_SALT (check it's set)
- ✅ DATABASE_URL (check it's set)

### Step 3: Check Server Startup

The server now:
- Starts even if validation fails (for healthcheck)
- Waits 30 seconds before exiting (gives Railway time to see it)
- Logs exactly which variables are missing

## Expected Log Output

### Success:
```
🚀 [STARTUP] Server process starting...
🚀 [STARTUP] DATABASE_URL: ✅ set
🚀 [STARTUP] SESSION_SECRET: ✅ set
✅ Environment validation passed
✅ Server confirmed listening and ready for healthchecks
```

### Failure:
```
🚀 [STARTUP] Server process starting...
🚀 [STARTUP] SESSION_SECRET: ❌ not set
❌ [ENV VALIDATION] CRITICAL ERROR: SESSION_SECRET is REQUIRED
❌ [FATAL] Environment validation failed
❌ [FATAL] Exiting due to missing required environment variables
```

## Fix Applied

The server now:
1. ✅ Starts even if validation fails (allows Railway to see healthcheck)
2. ✅ Logs which variables are missing
3. ✅ Waits 30 seconds before exiting (gives Railway time to diagnose)
4. ✅ Provides clear error messages

## Action Required

1. **Set all required environment variables in Railway**
   - Use values from your `.env` file
   - Ensure all 6 required variables are set

2. **Redeploy:**
   - Railway will auto-redeploy when variables change
   - Or manually trigger a new deploy

3. **Check logs:**
   - Verify server starts successfully
   - Look for "✅ Environment validation passed"
   - Look for "✅ Server confirmed listening"

4. **Verify healthcheck:**
   - Should pass after server starts
   - Should see "Server confirmed listening" in logs

## If Issue Persists

### Check Railway Logs For:
- Port binding errors
- Database connection errors
- Other startup errors

### Verify:
- PORT environment variable (Railway sets this automatically)
- HOST environment variable (should be 0.0.0.0 or not set)
- Database connection string is valid

### Test Locally:
```bash
# Test with same environment variables
export NODE_ENV=production
export SESSION_SECRET=your-secret
# ... etc
node dist/index.js
```

The server should start and respond to `/health`.

