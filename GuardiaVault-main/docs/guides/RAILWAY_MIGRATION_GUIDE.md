# Railway Database Migration Guide

## Issue: Internal Hostname Not Accessible Locally

The `DATABASE_URL` with `postgres-gley.railway.internal` only works from **inside Railway's network**. When running `railway run` locally, you can't access `.railway.internal` hostnames.

## Solution: Use Railway Web Shell

### Step 1: Open Railway Web Shell
1. Go to Railway Dashboard
2. Click on your **GuardiaVault** service
3. Click **"Connect"** button → **"Shell"**
4. A web-based terminal will open

### Step 2: Run Migration in Railway Shell
Once in Railway's shell (where internal hostnames work), run:
```bash
pnpm run db:push
```

This will run inside Railway's network where `.railway.internal` hostnames are accessible.

## Alternative: Use External Connection String

If you want to run migrations locally, you need the **external/public** connection string:

1. Go to Railway → **PostgreSQL** service
2. Click **"Variables"** tab
3. Look for `DATABASE_URL` - Railway may provide both:
   - Internal: `postgres-gley.railway.internal` (only works in Railway)
   - External: `postgres.railway.app` or similar (works from anywhere)

If you see an external one, use that for local migrations, but keep the internal one for your app (it's faster).

## Verify After Migration

After migrations complete:
```bash
curl https://guardiavault-production.up.railway.app/ready
```

Should return: `{"status":"ready","checks":{"database":true}}`

