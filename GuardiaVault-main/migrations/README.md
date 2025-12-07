# Database Migrations

This directory contains manual migration SQL files for features that require specific SQL or are created outside of Drizzle's automatic generation.

## Migration Files

### `001_death_verification.sql`

Adds death verification system tables and extends users table.

**Tables Created**:
- `death_verification_events` - Verification records from all sources
- `ssdi_check_log` - SSDI check history
- `death_certificate_orders` - Certificate ordering
- `consent_log` - Consent audit trail
- `proof_of_life_challenges` - Challenge tracking

**Users Table Extensions**:
- Death verification fields (ssn_hash, full_name, etc.)
- Monitoring settings
- Consent tracking

**To Apply**:
```bash
psql $DATABASE_URL -f migrations/001_death_verification.sql
```

Or use the migration runner:
```bash
# Copy to drizzle/migrations/ directory
cp migrations/001_death_verification.sql drizzle/migrations/
pnpm run db:migrate
```

## Drizzle Generated Migrations

Drizzle will generate migrations automatically in `drizzle/migrations/` when you run:
```bash
pnpm run db:generate
```

These auto-generated migrations should be used for schema changes in `shared/schema.ts`.

## Manual Migrations

Some migrations may need to be created manually (like this death verification one) when:
- They involve complex SQL that Drizzle doesn't handle well
- They need specific PostgreSQL features
- They're one-time setup migrations

## Rollback

To rollback the death verification migration:

```sql
BEGIN;

-- Drop tables
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

-- Drop enums
DROP TYPE IF EXISTS death_verification_source CASCADE;
DROP TYPE IF EXISTS death_verification_status CASCADE;

COMMIT;
```

