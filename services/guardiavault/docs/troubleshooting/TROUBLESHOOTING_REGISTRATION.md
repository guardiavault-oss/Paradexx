# Troubleshooting Registration/Login 500 Errors

## Current Status

✅ **Fixed:**
- PostgreSQL container is running and healthy
- Database tables exist (users table confirmed)
- Drizzle config migration prefix fixed
- Error handling improved

❌ **Still Failing:**
- `/api/auth/register` returns 500 error
- `/ready` endpoint shows `"database": false`

## Diagnosis Steps

### Step 1: Check Server Console Logs

When you try to register, look at your **server console** (where `pnpm run dev` is running). You should see:
- `🔵 Registration attempt: { email: '...' }`
- `🔵 Storage available: true`
- `🔵 Attempting to create user...`
- Either: `✅ User created successfully:` or `❌ Registration error:`

**What to look for:**
- Any error messages with database connection issues
- Error codes like `ECONNREFUSED`, `ENOTFOUND`, or database constraint errors

### Step 2: Test Database Connection Directly

```powershell
# Test if you can query the database
docker exec guardiavault-db psql -U guardiavault -d guardiavault -c "SELECT COUNT(*) FROM users;"
```

Should return: `count: 0` (or a number if users exist)

### Step 3: Check Server Logs for Database Errors

Look for these messages in your server console:

**Good signs:**
- `✅ Database connection initialized`
- `✅ Using PostgreSQL storage`

**Bad signs:**
- `❌ Failed to initialize database:`
- `⚠️  Will use in-memory storage instead`
- `⚠️  DATABASE_URL not set - using in-memory storage`

### Step 4: Verify Environment Variables

Check your `.env` file has:
```env
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
```

**Important:** If your server was running when you started PostgreSQL, you need to **restart the server** for it to reconnect.

## Common Issues & Fixes

### Issue 1: Server Not Connected to Database

**Symptom:** `/ready` shows `"database": false`, but PostgreSQL is running

**Fix:** Restart your development server:
```powershell
# Stop the server (Ctrl+C)
# Then restart:
pnpm run dev
```

### Issue 2: Database Connection String Mismatch

**Symptom:** Server logs show connection refused or authentication failed

**Fix:** Check your `.env` file matches Docker setup:
```env
# For local Docker PostgreSQL:
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault

# Password should match what's in docker-compose.yml:
DB_PASSWORD=changeme
```

### Issue 3: Database Schema Not Initialized

**Symptom:** Error mentions "relation users does not exist" or "table does not exist"

**Fix:** Initialize the schema:
```powershell
# Run and confirm with "Yes"
pnpm run db:push
```

### Issue 4: Server Using In-Memory Storage

**Symptom:** `/api/debug/storage` shows `"MemStorage"` instead of `"PostgresStorage"`

**Fix:** 
1. Check `DATABASE_URL` in `.env`
2. Restart server: `pnpm run dev`
3. Server should log: `✅ Database connection initialized`

## Quick Test Commands

```powershell
# 1. Check database status
curl http://localhost:5000/ready

# 2. Check storage type
curl http://localhost:5000/api/debug/storage

# 3. Test registration (if server restarted with new endpoint)
$body = @{ email = "test@example.com"; password = "testpass123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

## Next Steps

1. **Restart your development server** (most likely fix)
   ```powershell
   # Press Ctrl+C to stop
   pnpm run dev
   ```

2. **Check server logs** when you try to register
   - Look for the error message after `❌ Registration error:`
   - The improved error logging should show the actual database error

3. **Verify database connection** after restart
   ```powershell
   curl http://localhost:5000/ready
   ```
   Should show: `"database": true`

4. **Try registering again** - it should work now!

## Still Not Working?

If you've restarted the server and it still fails:

1. Share the **exact error message** from your server console
2. Share the output of: `curl http://localhost:5000/ready`
3. Share the output of: `curl http://localhost:5000/api/debug/storage`

The improved error logging will help identify the exact issue!

