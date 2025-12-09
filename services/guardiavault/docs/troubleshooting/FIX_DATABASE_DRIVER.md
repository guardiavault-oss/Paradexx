# Database Driver Fix

## Problem Identified

The error logs show that registration is failing because the code is using `@neondatabase/serverless` driver, which is designed for Neon's cloud serverless PostgreSQL with WebSocket connections. However, you're connecting to a **local PostgreSQL Docker container**, which doesn't work with the Neon driver.

**Error location:** `PostgresStorage.getUserByEmail` failing during duplicate email check.

## Solution Applied

1. ✅ Installed `pg` package (standard PostgreSQL driver)
2. ✅ Modified `server/db.ts` to:
   - Auto-detect database type based on DATABASE_URL
   - Use `pg` driver for local PostgreSQL (like Docker)
   - Use Neon driver only for `neon.tech` URLs

## Next Steps

**Restart your development server** to pick up the changes:

```powershell
# Stop current server (Ctrl+C)
pnpm run dev
```

After restart, you should see:
- `✅ Database connection initialized (PostgreSQL)` (not Neon serverless)
- Registration should work!

## Verification

After restarting, check:
```powershell
curl http://localhost:5000/ready
```

Should show: `"database": true`

Then try registering - it should work now!

