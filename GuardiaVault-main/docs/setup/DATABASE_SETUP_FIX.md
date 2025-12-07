# Database Setup Guide - Fixing Login/Registration Issues

## Problem

If you're seeing these errors:
- ❌ Registration fails with 500 error
- ❌ Login fails with 500 error
- ❌ `/ready` endpoint shows `"database": false`

This means **PostgreSQL is not running or not connected**.

## Quick Fix

### Option 1: Use Docker (Recommended - Easiest)

```bash
# Start PostgreSQL in Docker
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to start
# Then check if it's running
docker ps

# Initialize the database schema
pnpm run db:push
```

### Option 2: Install PostgreSQL Locally

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Install PostgreSQL
3. Start PostgreSQL service:
   ```powershell
   # Check if service exists
   Get-Service -Name postgresql*
   
   # Start service (adjust name if needed)
   Start-Service postgresql-x64-XX
   ```

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb guardiavault
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb guardiavault
```

### Option 3: Use Cloud Database (Neon, Supabase, etc.)

1. Sign up at https://neon.tech (free tier available)
2. Create a new project
3. Copy the connection string
4. Update your `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

## Verify Database Connection

### Step 1: Check Database Status

```bash
# Check if PostgreSQL is running
curl http://localhost:5000/ready

# Should show:
# {
#   "status": "ready",
#   "checks": {
#     "database": true
#   }
# }
```

### Step 2: Test Connection Directly

**Windows PowerShell:**
```powershell
# If psql is installed
psql $env:DATABASE_URL -c "SELECT version();"
```

**Using Node.js:**
```bash
node -e "require('pg').Pool({connectionString: process.env.DATABASE_URL}).query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0])).catch(e => console.error('❌ Failed:', e.message))"
```

### Step 3: Initialize Database Schema

```bash
# Push schema to database (creates all tables)
pnpm run db:push

# Or generate and run migrations
pnpm run db:generate
pnpm run db:migrate
```

## Common Issues

### Issue 1: "Connection refused" or "ECONNREFUSED"

**Cause:** PostgreSQL is not running.

**Fix:**
```bash
# Check if PostgreSQL is running
docker ps --filter "name=postgres"

# If not running, start it:
docker-compose up -d postgres

# Or if using local PostgreSQL:
# Windows: Check Services app
# macOS: brew services start postgresql@15
# Linux: sudo systemctl start postgresql
```

### Issue 2: "Authentication failed" or "password authentication failed"

**Cause:** Wrong username/password in `DATABASE_URL`.

**Fix:** Update your `.env` file with correct credentials:
```env
# For Docker (default)
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault

# For local PostgreSQL
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/guardiavault

# For cloud (Neon, Supabase, etc.)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

### Issue 3: "Database does not exist"

**Cause:** Database hasn't been created.

**Fix:**
```bash
# Create database
createdb guardiavault

# Or using Docker
docker-compose exec postgres psql -U guardiavault -c "CREATE DATABASE guardiavault;"
```

### Issue 4: "Relation 'users' does not exist"

**Cause:** Database schema not initialized.

**Fix:**
```bash
# Push schema to database
pnpm run db:push
```

## Verify Everything Works

After fixing the database connection:

1. **Check readiness:**
   ```bash
   curl http://localhost:5000/ready
   ```
   Should show: `"database": true`

2. **Try registering:**
   - Go to http://localhost:5000/signup
   - Create an account
   - Should work without errors

3. **Try logging in:**
   - Use the credentials you just created
   - Should login successfully

## Still Having Issues?

### Check Server Logs

Look for these messages in your server console:
- ✅ `"Database connection initialized"` - Good!
- ❌ `"Failed to initialize database"` - Bad, check connection
- ⚠️ `"Using in-memory storage"` - Database not connected

### Test Database Endpoint

```bash
# Check storage type
curl http://localhost:5000/api/debug/storage

# Should show:
# {
#   "status": "ok",
#   "storageType": "PostgresStorage"
# }
```

If it shows `"MemStorage"`, the database is not connected.

### Manual Database Test

```powershell
# Test connection string
$env:DATABASE_URL="postgresql://guardiavault:changeme@localhost:5432/guardiavault"
node -e "const {Pool}=require('pg');new Pool({connectionString:process.env.DATABASE_URL}).query('SELECT 1').then(()=>console.log('✅ OK')).catch(e=>console.log('❌',e.message))"
```

## Need Help?

1. Check server logs for detailed error messages
2. Verify your `.env` file has correct `DATABASE_URL`
3. Ensure PostgreSQL is running and accessible
4. Make sure database schema is initialized with `pnpm run db:push`

