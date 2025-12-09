# How to Use Railway Web Shell

## Quick Steps

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/dashboard
   - Sign in if needed

2. **Navigate to Your Service**
   - Click on your project (probably "airy-light")
   - Click on "GuardiaVault" service

3. **Open Web Shell**
   - Look for a button that says "Connect" or "Shell" 
   - It's usually in the top right or in a menu
   - Click it to open a web-based terminal

4. **Run Migration**
   - In the Railway web shell, type:
   ```bash
   pnpm run db:push
   ```

## Visual Guide

The Railway web shell looks like a terminal in your browser. It has:
- Access to Railway's internal network (`.railway.internal` works)
- All dependencies already installed
- Environment variables automatically loaded

## Alternative: Get External Connection String

If you can't access the web shell, Railway PostgreSQL should also provide an **external** connection string that works from anywhere.

1. Go to Railway → PostgreSQL service
2. Click "Variables" tab
3. Look for `DATABASE_URL` - there might be:
   - `DATABASE_URL` (internal - only works in Railway)
   - `PUBLIC_DATABASE_URL` or `EXTERNAL_DATABASE_URL` (external - works from anywhere)

If you find an external one, temporarily set it locally:
```powershell
$env:DATABASE_URL="postgresql://postgres:password@postgres.railway.app:5432/railway"
pnpm run db:push
```

