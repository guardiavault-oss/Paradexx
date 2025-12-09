# Migration Troubleshooting Guide

## Common Errors and Solutions

### Error: "relation 'users' does not exist"

**Problem:** The `users` table doesn't exist yet.

**Solution:** Run the base schema migrations first:
```bash
pnpm run db:migrate
```

Or ensure your base schema has been applied before running the death verification migration.

### Error: "syntax error at or near..."

**Problem:** SQL syntax error in migration file.

**Solution:** Check the PostgreSQL version. Some features require PostgreSQL 9.5+. The migration uses:
- `IF NOT EXISTS` (PostgreSQL 9.5+)
- `gen_random_uuid()` (PostgreSQL 13+ or requires `pgcrypto` extension)

To enable `gen_random_uuid()` on older PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### Error: "permission denied"

**Problem:** Database user doesn't have required permissions.

**Solution:** Grant necessary permissions:
```sql
GRANT CREATE ON DATABASE your_database TO your_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
```

### Error: "type already exists"

**Problem:** Enum types already exist from a previous migration attempt.

**Solution:** This is normal! The migration handles this with `DO $$ BEGIN ... EXCEPTION ... END $$` blocks. You can safely ignore these errors.

**To check existing types:**
```sql
SELECT typname FROM pg_type WHERE typname LIKE '%death_verification%';
```

### Error: "column already exists"

**Problem:** Some columns already exist in the `users` table.

**Solution:** The migration uses `ADD COLUMN IF NOT EXISTS`, so this shouldn't cause an error. If it does, check:

1. **Verify what columns exist:**
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
   ```

2. **If you need to reset:**
   ```sql
   -- Remove columns (CAUTION: This deletes data!)
   ALTER TABLE users DROP COLUMN IF EXISTS ssn_hash;
   -- Repeat for other columns...
   ```

### Error: "connection refused" or "timeout"

**Problem:** Can't connect to database.

**Solutions:**
1. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Verify connection string format:**
   ```
   postgresql://user:password@host:port/database
   ```

3. **Test connection manually:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. **Check database server:**
   - Is PostgreSQL running?
   - Is the port correct? (default: 5432)
   - Is firewall blocking the connection?

### Error: "transaction aborted"

**Problem:** Migration failed partway through, transaction rolled back.

**Solution:** 
- Check the error message above "transaction aborted"
- Fix the underlying issue
- Re-run the migration (it's idempotent)

### Error: "invalid input syntax for type..."

**Problem:** Data type mismatch.

**Solution:** Check:
- PostgreSQL version compatibility
- Existing data that conflicts with new constraints

### Error: "could not create unique index"

**Problem:** Unique constraint conflicts with existing data.

**Solution:** 
- Check for duplicate data:
  ```sql
  SELECT column_name, COUNT(*) 
  FROM table_name 
  GROUP BY column_name 
  HAVING COUNT(*) > 1;
  ```
- Clean up duplicates before re-running migration

## Step-by-Step Debugging

### 1. Test Database Connection

```bash
psql $DATABASE_URL -c "SELECT version();"
```

### 2. Check if Users Table Exists

```bash
psql $DATABASE_URL -c "\d users"
```

If it doesn't exist:
```bash
pnpm run db:migrate  # Apply base migrations first
```

### 3. Check PostgreSQL Version

```sql
SELECT version();
```

Required: PostgreSQL 9.5+ (for `IF NOT EXISTS`)

Recommended: PostgreSQL 13+ (for `gen_random_uuid()` without extension)

### 4. Enable pgcrypto (if needed)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 5. Test Migration Components Individually

Run parts of the migration manually to isolate the issue:

```sql
-- Test enum creation
DO $$ BEGIN
  CREATE TYPE death_verification_status AS ENUM ('pending', 'confirmed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Test table creation
CREATE TABLE IF NOT EXISTS test_table (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()
);

DROP TABLE test_table;
```

### 6. Check Migration File

Verify the SQL file is readable and complete:

```bash
cat migrations/001_death_verification.sql | wc -l  # Should be ~128 lines
head -20 migrations/001_death_verification.sql
```

## Alternative: Manual Step-by-Step Migration

If the script fails, you can run the migration manually:

### Step 1: Create Enums

```sql
DO $$ BEGIN
  CREATE TYPE death_verification_status AS ENUM ('pending', 'confirmed', 'rejected', 'disputed', 'needs_confirmation');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE death_verification_source AS ENUM ('ssdi', 'obituary', 'death_certificate', 'death_certificate_official', 'insurance_claim', 'hospital_ehr', 'funeral_home');
EXCEPTION WHEN duplicate_object THEN null; END $$;
```

### Step 2: Add Columns to Users

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_hash VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
-- ... continue with other columns
```

### Step 3: Create Tables

```sql
CREATE TABLE IF NOT EXISTS death_verification_events (
  -- ... (see migration file)
);
```

Continue with remaining tables...

## Getting Help

If you're still stuck:

1. **Check the full error:**
   ```bash
   pnpm run db:migrate:death-verification 2>&1 | tee migration-error.log
   ```

2. **Check database logs:**
   ```bash
   # PostgreSQL log location varies by installation
   tail -f /var/log/postgresql/postgresql-*.log
   ```

3. **Verify database state:**
   ```sql
   -- Check what exists
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE '%death%';
   
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name LIKE '%death%' OR column_name LIKE '%ssdi%';
   ```

4. **Share error details:**
   - Full error message
   - PostgreSQL version
   - Migration file content
   - Existing database schema

## Quick Fixes

### Reset and Retry

If migration partially failed:

```sql
-- Remove everything death verification related
DROP TABLE IF EXISTS proof_of_life_challenges CASCADE;
DROP TABLE IF EXISTS consent_log CASCADE;
DROP TABLE IF EXISTS death_certificate_orders CASCADE;
DROP TABLE IF EXISTS ssdi_check_log CASCADE;
DROP TABLE IF EXISTS death_verification_events CASCADE;

-- Remove enum types (will fail if still in use)
DROP TYPE IF EXISTS death_verification_source CASCADE;
DROP TYPE IF EXISTS death_verification_status CASCADE;

-- Remove columns from users
ALTER TABLE users 
  DROP COLUMN IF EXISTS ssn_hash,
  DROP COLUMN IF EXISTS full_name,
  -- ... (continue with other columns)
```

Then re-run the migration.

## Still Having Issues?

1. Share the **complete error message**
2. Your **PostgreSQL version** (`SELECT version();`)
3. Whether the **users table exists** and its schema
4. Any **previous migration attempts** and their results

