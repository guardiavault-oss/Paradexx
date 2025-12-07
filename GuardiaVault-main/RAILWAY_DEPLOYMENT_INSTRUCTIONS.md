# Railway Deployment - Environment Variables Required

## ⚠️ CRITICAL: Healthcheck Failure Fix

The Railway healthcheck is failing because **required environment variables are missing**.

## Required Environment Variables

You **MUST** set these in Railway Dashboard → Your Service → Variables:

### Production Secrets (Required)
1. **`NODE_ENV`** = `production`
2. **`SESSION_SECRET`** = `aw0+tN9Q+/zjYMjUBP5n4IxQWip3WjpkHtCYwKjJAGg=`
   - Must be at least 32 characters
   - Cannot be a default/placeholder value

3. **`WIZARD_ENCRYPTION_KEY`** = `c424faa196157c3a238ad5c8c30835787acb47a8ddfec63288c8db35d9e23a86`
   - Must be exactly 64 hex characters (32 bytes)
   - No placeholder text allowed

4. **`ENCRYPTION_KEY`** = `8ab3abcbf066281c321e78a66d718bdb81e3f458d6b213064540966dbae659b3`
   - Must be exactly 64 hex characters (32 bytes)
   - Required in production

5. **`SSN_SALT`** = `wIzdOmeeWdNB/vBb9vGvfQ==`
   - Must be at least 16 characters
   - Required in production

6. **`DATABASE_URL`** = Your PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`
   - Railway should provide this automatically if you have a PostgreSQL service

### Optional (Recommended)
7. **`NOTIFY_HMAC_SECRET`** = `SrZUItE/v26fprie6l5x5c5h2g4nP1/npCjtL5M1fGE=`

## How to Set in Railway

1. Go to **Railway Dashboard**
2. Select your **GuardiaVault service**
3. Click on **Variables** tab
4. Click **+ New Variable**
5. Add each variable above with its value
6. Click **Deploy** to trigger a new deployment

## Verification

After setting variables and redeploying, check Railway logs for:

✅ **Success indicators:**
```
🚀 [STARTUP] DATABASE_URL: ✅ set
🚀 [STARTUP] SESSION_SECRET: ✅ set
🚀 [STARTUP] WIZARD_ENCRYPTION_KEY: ✅ set
✅ Environment validation passed
✅ Server confirmed listening and ready for healthchecks
```

❌ **Failure indicators:**
```
🚀 [STARTUP] SESSION_SECRET: ❌ not set
❌ [ENV VALIDATION] CRITICAL ERROR: SESSION_SECRET is REQUIRED
❌ [FATAL] Environment validation failed
```

## Temporary Fix Applied

The server now:
1. Starts even if validation fails (allows Railway to see healthcheck)
2. Logs which environment variables are missing
3. Waits 5 seconds before exiting (gives Railway time to see healthcheck)

**This is temporary** - you still need to set all required variables!

## Next Steps

1. ✅ Set all required environment variables in Railway
2. ✅ Commit and push the updated code
3. ✅ Monitor Railway logs during deployment
4. ✅ Verify healthcheck passes after deployment

