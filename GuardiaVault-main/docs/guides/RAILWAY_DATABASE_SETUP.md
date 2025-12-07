# Railway Database Setup - Quick Troubleshooting

## Step 1: Verify DATABASE_URL is Set

In Railway Dashboard:
1. Go to your **Backend Service** → **Variables** tab
2. Look for `DATABASE_URL`
3. Should be something like: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway`

If missing, add it from the PostgreSQL service Variables.

## Step 2: Run Database Migrations

### Option A: Using Railway CLI
```bash
railway login
railway link  # Select your project
railway run pnpm run db:push
```

### Option B: Using Railway Dashboard Shell
1. Go to Railway → Your Backend Service
2. Click **"Connect"** → **"Shell"**
3. Run:
```bash
pnpm run db:push
```

## Step 3: Common Errors & Fixes

### Error: "DATABASE_URL must be set"
**Fix:** Make sure `DATABASE_URL` is set in Railway Variables

### Error: "Connection refused" or "ECONNREFUSED"
**Fix:** 
- Check PostgreSQL service is running in Railway
- Verify `DATABASE_URL` is copied correctly from PostgreSQL Variables

### Error: "password authentication failed"
**Fix:**
- Use the exact `DATABASE_URL` from Railway PostgreSQL service Variables
- Don't modify it manually

### Error: "relation 'users' does not exist"
**Fix:**
- Run migrations: `pnpm run db:push`

### Error: "syntax error" or migration fails
**Fix:**
- Check Railway logs for detailed error
- Ensure PostgreSQL version is 13+ (Railway uses latest)

## Step 4: Verify Database Connection

After running migrations, check Railway logs:
- Should see: `✅ Database connection initialized (PostgreSQL)`
- Should see: `✅ Using PostgreSQL storage`

Or test via API:
```bash
curl https://your-railway-app.up.railway.app/ready
```

Should return: `{"status":"ready","checks":{"database":true}}`

