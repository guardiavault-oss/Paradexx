# Staging Migration Guide: Fragment Scheme Tracking

## Overview
This guide walks through running the fragment scheme migration in a staging environment before production deployment.

## Prerequisites

1. **Database Access**
   - Access to staging PostgreSQL database
   - Database credentials configured in environment
   - Backup taken (recommended)

2. **Environment Variables**
   ```bash
   DB_HOST=your-staging-db-host
   DB_PORT=5432
   DB_NAME=guardiavault_staging
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   # Optional: Auto-confirm (skip prompts)
   AUTO_CONFIRM=1
   ```

## Migration Steps

### Step 1: Backup Database (Recommended)
```bash
# Create backup before migration
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_before_fragment_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run Migration

#### Option A: Using npm script (Recommended)
```bash
npm run db:migrate:fragment-scheme
```

#### Option B: Direct psql command
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/004_fragment_scheme_tracking.sql
```

#### Option C: Using TypeScript script
```bash
tsx scripts/run-fragment-migration.ts
```

### Step 3: Verify Migration

```sql
-- Check column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'vaults' 
  AND column_name = 'fragment_scheme';

-- Check vault distribution
SELECT fragment_scheme, COUNT(*) as count 
FROM vaults 
GROUP BY fragment_scheme;

-- Check migrated legacy vaults
SELECT id, name, fragment_scheme, created_at 
FROM vaults 
WHERE fragment_scheme = '3-of-5';
```

Expected output:
- All new vaults should have `fragment_scheme = '2-of-3'`
- Legacy vaults (with 5 fragments) should have `fragment_scheme = '3-of-5'`

## Testing After Migration

### 1. Test Recovery Endpoint

Run the comprehensive test suite:
```bash
# Set API URL if different from localhost
export API_URL=https://your-staging-api.com
npm run test:recovery
```

### 2. Manual Testing Checklist

- [ ] Create new vault (should default to 2-of-3)
- [ ] Verify fragment scheme is set to '2-of-3'
- [ ] Test recovery with 2 fragments (should succeed)
- [ ] Test recovery with 1 fragment (should fail)
- [ ] Test legacy vault recovery (if any exist)
- [ ] Verify UI displays correct scheme information

### 3. Verify Backward Compatibility

If you have legacy 3-of-5 vaults:
- [ ] Verify they're marked as '3-of-5' in database
- [ ] Test recovery with 3 fragments (should succeed)
- [ ] Test recovery with 2 fragments (should fail)
- [ ] Verify UI shows "Legacy" badge

## Rollback Plan

If migration fails or issues are detected:

### Rollback SQL
```sql
-- Remove the column (if needed)
ALTER TABLE vaults DROP COLUMN IF EXISTS fragment_scheme;

-- Restore from backup if needed
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_before_fragment_migration_TIMESTAMP.sql
```

## Monitoring

After migration, monitor:
1. Recovery endpoint success rates
2. Error logs for fragment validation
3. Database performance queries
4. User support tickets

See `docs/monitoring/FRAGMENT_RECOVERY_MONITORING.md` for detailed metrics.

## Common Issues

### Issue: Migration fails with "column already exists"
**Solution**: Migration is idempotent with `IF NOT EXISTS`, but if it still fails, check manually:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'vaults' AND column_name = 'fragment_scheme';
```

### Issue: Legacy vaults not detected correctly
**Solution**: Run manual update:
```sql
UPDATE vaults 
SET fragment_scheme = '3-of-5'
WHERE id IN (
  SELECT DISTINCT vault_id 
  FROM fragments 
  GROUP BY vault_id 
  HAVING COUNT(*) = 5
);
```

### Issue: New vaults missing fragment_scheme
**Solution**: Set default for existing NULL values:
```sql
UPDATE vaults 
SET fragment_scheme = '2-of-3'
WHERE fragment_scheme IS NULL;
```

## Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] All vaults have fragment_scheme set
- [ ] Recovery endpoint tests pass
- [ ] UI correctly displays scheme information
- [ ] Legacy vaults properly identified
- [ ] Monitoring dashboards updated
- [ ] Team notified of migration completion

## Next Steps

After successful staging migration:
1. Document any issues encountered
2. Update production migration plan
3. Schedule production migration window
4. Prepare rollback plan for production

