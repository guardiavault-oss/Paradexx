# Railway Missing Environment Variable

## Issue Found

**`WIZARD_ENCRYPTION_KEY` is MISSING from Railway environment variables!**

This is why the healthcheck is failing - the server validation fails and exits.

## Required Variables Status

| Variable | Status | Notes |
|----------|--------|-------|
| `NODE_ENV` | ✅ Set | `production` |
| `SESSION_SECRET` | ✅ Set | Present |
| `WIZARD_ENCRYPTION_KEY` | ❌ **MISSING** | **REQUIRED** |
| `ENCRYPTION_KEY` | ✅ Set | 64 hex chars |
| `SSN_SALT` | ✅ Set | Present |
| `DATABASE_URL` | ✅ Set | Present |
| `NOTIFY_HMAC_SECRET` | ✅ Set | Present |

## Fix Required

### Add WIZARD_ENCRYPTION_KEY to Railway

1. Go to **Railway Dashboard** → Your Service → **Variables**
2. Click **+ New Variable**
3. Name: `WIZARD_ENCRYPTION_KEY`
4. Value: `c424faa196157c3a238ad5c8c30835787acb47a8ddfec63288c8db35d9e23a86`
   - This is the value from your `.env` file
   - Must be exactly 64 hex characters
5. Click **Save**

### After Adding

Railway will automatically redeploy when you add the variable. The server should then:
- ✅ Pass environment validation
- ✅ Start successfully
- ✅ Respond to healthchecks
- ✅ Stay running (no exit after 30 seconds)

## Verification

After adding the variable, check Railway logs for:

**Success:**
```
🚀 [STARTUP] WIZARD_ENCRYPTION_KEY: ✅ set
✅ Environment validation passed
✅ Server confirmed listening and ready for healthchecks
```

**If still failing:**
- Check the exact error message in logs
- Verify the key is exactly 64 hex characters (no spaces, no quotes)
- Ensure it doesn't contain "change" or "default"

## Why This Variable is Required

`WIZARD_ENCRYPTION_KEY` is used for:
- Encrypting wizard state data
- Securing sensitive user input during onboarding
- Critical for application security

**No fallback allowed** - application will not start without it.

