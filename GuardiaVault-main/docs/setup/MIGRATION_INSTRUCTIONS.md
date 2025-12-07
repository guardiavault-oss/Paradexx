# Death Verification Migration - Quick Start Guide

## Option 1: Using the Migration Script (Recommended)

The easiest way to apply the migration is using the provided script:

```bash
pnpm run db:migrate:death-verification
```

This script will:
1. Check for DATABASE_URL environment variable
2. Read the migration file
3. Apply the migration to your database
4. Verify that all tables, columns, and enums were created successfully

### Prerequisites

Make sure you have `DATABASE_URL` set in your environment:

**On Linux/Mac:**
```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
pnpm run db:migrate:death-verification
```

**On Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://user:password@host:5432/database"
pnpm run db:migrate:death-verification
```

**On Windows CMD:**
```cmd
set DATABASE_URL=postgresql://user:password@host:5432/database
pnpm run db:migrate:death-verification
```

**Or create a `.env` file:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

Then the script will automatically pick it up if you have `dotenv` configured.

### What the Script Does

1. ✅ Reads `migrations/001_death_verification.sql`
2. ✅ Connects to your database using `DATABASE_URL`
3. ✅ Executes all SQL statements in a transaction
4. ✅ Verifies tables were created:
   - `death_verification_events`
   - `ssdi_check_log`
   - `death_certificate_orders`
   - `consent_log`
   - `proof_of_life_challenges`
5. ✅ Verifies users table was extended with 13 new columns
6. ✅ Verifies enum types were created:
   - `death_verification_status`
   - `death_verification_source`

### Example Output

```
📋 Reading migration file...
🔌 Connecting to database...
🚀 Applying migration...
✅ Migration applied successfully!

📊 Verifying migration...

✅ Created tables:
   - consent_log
   - death_certificate_orders
   - death_verification_events
   - proof_of_life_challenges
   - ssdi_check_log

✅ Extended users table with columns:
   - date_of_birth
   - death_confidence_score
   - death_monitoring_enabled
   - death_verified_at
   - full_name
   - last_known_location
   - last_ssdi_check
   - ssdi_consent_date
   - ssdi_consent_given
   - ssdi_consent_ip_address
   - ssn_hash
   - status
   - verification_tier

✅ Created enum types:
   - death_verification_source
   - death_verification_status

🎉 Migration complete! Death verification system is ready.

📝 Next steps:
   1. Set DEATH_VERIFICATION_ENABLED=true in your .env
   2. Configure API keys (SSDI_API_KEY, LEGACY_API_KEY, VITALCHEK_API_KEY)
   3. Start the server to enable cron jobs
```

## Option 2: Manual SQL (Advanced)

If you prefer to run the SQL manually:

1. **Backup your database first:**
   ```bash
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Apply the migration:**
   ```bash
   psql $DATABASE_URL -f migrations/001_death_verification.sql
   ```

3. **Verify:**
   ```sql
   \dt death_verification*
   \dt ssdi_*
   \dt consent_*
   \dt proof_of_life_*
   \d users
   ```

## Troubleshooting

### Error: DATABASE_URL not set

**Solution:** Set the DATABASE_URL environment variable before running:
```bash
export DATABASE_URL="postgresql://..."
```

### Error: "already exists"

**Solution:** This is normal if you've run the migration before. The migration is idempotent and safe to re-run. The script will continue successfully.

### Error: Permission denied

**Solution:** Make sure your database user has permission to:
- CREATE TABLE
- CREATE TYPE
- ALTER TABLE
- CREATE INDEX

### Error: Connection refused

**Solution:** Check:
- Database server is running
- DATABASE_URL is correct
- Network/firewall allows connection
- Database credentials are correct

## Verification

After migration, verify everything is working:

```bash
# Check tables
psql $DATABASE_URL -c "\dt death_verification*"

# Check users table columns
psql $DATABASE_URL -c "\d users" | grep -i death

# Check enums
psql $DATABASE_URL -c "SELECT typname FROM pg_type WHERE typname LIKE '%death_verification%'"
```

## Rollback

If you need to rollback (⚠️ **destroys all data**):

```sql
-- See MIGRATION_GUIDE.md for complete rollback SQL
```

## Next Steps

After successful migration:

1. ✅ Migration complete
2. ⏳ Set `DEATH_VERIFICATION_ENABLED=true` in `.env`
3. ⏳ Configure API keys:
   - `SSDI_API_KEY`
   - `LEGACY_API_KEY`
   - `VITALCHEK_API_KEY`
4. ⏳ Start the server to enable cron jobs
5. ⏳ Test the system in development

---

**Ready to migrate?** Run:
```bash
pnpm run db:migrate:death-verification
```

