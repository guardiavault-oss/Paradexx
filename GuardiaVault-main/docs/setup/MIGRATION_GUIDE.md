# Death Verification System - Migration Guide

## Overview

This guide covers the database migration process for the death verification system. The migration adds new tables and extends the `users` table with death verification fields.

## Migration Files

### Manual SQL Migration

**File**: `migrations/001_death_verification.sql`

This migration includes:
- New tables for death verification
- Enum types for status and source tracking
- Extensions to the `users` table
- Indexes for performance

### Drizzle Schema Update

**File**: `shared/schema.ts`

The schema has been updated to include death verification fields in the `users` table. Drizzle will generate migrations when you run `pnpm run db:generate` (requires DATABASE_URL).

## Applying the Migration

### Option 1: Manual SQL (Recommended for Production)

1. **Review the migration**:
   ```bash
   cat migrations/001_death_verification.sql
   ```

2. **Backup your database**:
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Apply the migration**:
   ```bash
   psql $DATABASE_URL -f migrations/001_death_verification.sql
   ```

### Option 2: Using Migration Script

1. **Copy migration to drizzle directory**:
   ```bash
   cp migrations/001_death_verification.sql drizzle/migrations/
   ```

2. **Run migration**:
   ```bash
   pnpm run db:migrate
   ```

### Option 3: Generate with Drizzle

If you prefer Drizzle to generate the migration automatically:

1. **Set DATABASE_URL**:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:5432/database"
   ```

2. **Generate migration**:
   ```bash
   pnpm run db:generate
   ```

3. **Review generated migration**:
   ```bash
   ls -la drizzle/migrations/
   ```

4. **Apply migration**:
   ```bash
   pnpm run db:migrate
   ```

## What Gets Created

### New Tables

1. **`death_verification_events`**
   - Stores verification records from all sources
   - Links to users table
   - Tracks confidence scores and verification data

2. **`ssdi_check_log`**
   - Logs all SSDI API checks
   - Tracks match results and API response times

3. **`death_certificate_orders`**
   - Tracks certificate orders from VitalChek
   - Stores delivery status and certificate URLs

4. **`consent_log`**
   - Audit trail for user consent
   - Tracks IP addresses and timestamps

5. **`proof_of_life_challenges`**
   - Stores proof of life challenges
   - Tracks expiration and verification status

### New Enum Types

1. **`death_verification_status`**
   - Values: `pending`, `confirmed`, `rejected`, `disputed`, `needs_confirmation`

2. **`death_verification_source`**
   - Values: `ssdi`, `obituary`, `death_certificate`, `death_certificate_official`, `insurance_claim`, `hospital_ehr`, `funeral_home`

### Users Table Extensions

New columns added to `users` table:

- `ssn_hash` - SHA-256 hash of SSN (never plaintext)
- `full_name` - Full name for matching
- `date_of_birth` - Date of birth
- `last_known_location` - Last known location
- `death_monitoring_enabled` - Enable/disable monitoring
- `verification_tier` - Verification level (1-4)
- `last_ssdi_check` - Last SSDI check timestamp
- `ssdi_consent_given` - Consent flag
- `ssdi_consent_date` - Consent timestamp
- `ssdi_consent_ip_address` - IP address at consent
- `death_verified_at` - Death verification timestamp
- `death_confidence_score` - Final confidence score
- `status` - User status (`active`, `deceased`, `verification_pending`)

## Verification

After applying the migration:

1. **Check tables exist**:
   ```sql
   \dt death_verification*
   \dt ssdi_*
   \dt death_certificate_*
   \dt consent_*
   \dt proof_of_life_*
   ```

2. **Check users table columns**:
   ```sql
   \d users
   ```

3. **Check enum types**:
   ```sql
   \dT+ death_verification_status
   \dT+ death_verification_source
   ```

## Rollback

If you need to rollback the migration:

```sql
BEGIN;

-- Drop tables (in order of dependencies)
DROP TABLE IF EXISTS proof_of_life_challenges CASCADE;
DROP TABLE IF EXISTS consent_log CASCADE;
DROP TABLE IF EXISTS death_certificate_orders CASCADE;
DROP TABLE IF EXISTS ssdi_check_log CASCADE;
DROP TABLE IF EXISTS death_verification_events CASCADE;

-- Remove columns from users (be careful - may have data)
ALTER TABLE users 
  DROP COLUMN IF EXISTS ssn_hash,
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS date_of_birth,
  DROP COLUMN IF EXISTS last_known_location,
  DROP COLUMN IF EXISTS death_monitoring_enabled,
  DROP COLUMN IF EXISTS verification_tier,
  DROP COLUMN IF EXISTS last_ssdi_check,
  DROP COLUMN IF EXISTS ssdi_consent_given,
  DROP COLUMN IF EXISTS ssdi_consent_date,
  DROP COLUMN IF EXISTS ssdi_consent_ip_address,
  DROP COLUMN IF EXISTS death_verified_at,
  DROP COLUMN IF EXISTS death_confidence_score,
  DROP COLUMN IF EXISTS status;

-- Drop enums (CASCADE will remove dependent types)
DROP TYPE IF EXISTS death_verification_source CASCADE;
DROP TYPE IF EXISTS death_verification_status CASCADE;

COMMIT;
```

## Post-Migration

After applying the migration:

1. **Update application code**:
   - Services are already updated to use new schema
   - No code changes needed if using Drizzle ORM

2. **Configure environment variables**:
   ```bash
   DEATH_VERIFICATION_ENABLED=true
   SSDI_API_KEY=your_key
   LEGACY_API_KEY=your_key
   VITALCHEK_API_KEY=your_key
   ```

3. **Test the system**:
   - Test consent endpoint
   - Test verification status endpoint
   - Test webhook handlers
   - Run cron jobs in test mode

## Troubleshooting

### Migration Fails

If the migration fails partway through:

1. **Check error message**: Review PostgreSQL error
2. **Manual cleanup**: May need to drop partially created objects
3. **Re-run**: Once fixed, run migration again

### Enum Already Exists

If you see "already exists" errors:
- This is normal - the migration uses `DO $$ BEGIN ... EXCEPTION ... END $$` blocks
- The migration is idempotent and safe to re-run

### Column Already Exists

If columns already exist:
- Migration uses `ADD COLUMN IF NOT EXISTS` - safe to re-run
- If you need to modify existing columns, create a separate migration

## Next Steps

1. ✅ Migration created
2. ⏳ Apply migration to development database
3. ⏳ Test services with new schema
4. ⏳ Apply to staging
5. ⏳ Apply to production

## Related Documentation

- `DEATH_VERIFICATION_SETUP.md` - Setup guide
- `DEATH_VERIFICATION_IMPLEMENTATION.md` - Implementation details
- `DATABASE_MIGRATIONS.md` - General migration guide

