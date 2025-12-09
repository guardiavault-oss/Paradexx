# Quick Start: Staging Migration & Testing

## Step 1: Run Database Migration

### Prerequisites
Set your staging database environment variables:
```bash
export DB_HOST=your-staging-db-host
export DB_PORT=5432
export DB_NAME=guardiavault_staging
export DB_USER=your-db-user
export DB_PASSWORD=your-db-password

# Optional: Auto-confirm (skip prompts)
export AUTO_CONFIRM=1
```

### Run Migration
```bash
npm run db:migrate:fragment-scheme
```

Or manually:
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/004_fragment_scheme_tracking.sql
```

### Verify Migration
```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vaults' AND column_name = 'fragment_scheme';

-- Check vault distribution
SELECT fragment_scheme, COUNT(*) as count 
FROM vaults 
GROUP BY fragment_scheme;
```

## Step 2: Test Recovery Endpoint

### Prerequisites
Ensure your staging API server is running:
```bash
# In one terminal, start the server
npm run dev
# Or for production build:
npm run build && npm start
```

### Run Tests
```bash
# Test against localhost
npm run test:recovery

# Or test against staging API
export API_URL=https://your-staging-api.com
npm run test:recovery
```

The test script will:
- ✅ Generate real fragments using Shamir Secret Sharing
- ✅ Test 2-of-3 recovery with 2 fragments
- ✅ Test 2-of-3 recovery with 3 fragments (extra)
- ✅ Test different fragment combinations
- ✅ Test legacy 3-of-5 recovery
- ✅ Test error cases (insufficient/invalid fragments)
- ✅ Verify reconstructed secrets match originals

## Expected Output

### Migration Output
```
✅ Found migration: 004_fragment_scheme_tracking.sql

📊 Database Configuration:
   Host: localhost:5432
   Database: guardiavault_staging
   User: postgres
   Environment: staging

🚀 Running migration...

✅ Migration 004_fragment_scheme_tracking completed successfully!

🔍 Verifying migration...
✅ Verification passed: fragment_scheme column exists

📊 Vault scheme distribution:
 fragment_scheme | count 
-----------------+-------
 2-of-3          |    15
 3-of-5          |     2
```

### Test Output
```
🚀 Starting Recovery Endpoint Tests
📡 Base URL: http://localhost:5000
🔐 Test Secret: test recovery phrase with twelve words...

============================================================
TEST 1: 2-of-3 scheme with exactly 2 fragments
============================================================

🧪 Testing 2-of-3 recovery:
   URL: http://localhost:5000/api/vaults/recover
   Fragments provided: 2
   Vault ID: none (auto-detect)
   ✅ Success!
   Scheme detected: 2-of-3
   Fragments used: 2
   Secret reconstructed: test recovery phrase with twelve words...
   ✅ Secret verification: PASSED

...

============================================================
TEST SUMMARY
============================================================

📊 Results:
   Total tests: 7
   Passed: 7
   Failed: 0
   Errors: 0

✅ 2-of-3 tests: 5/5 passed
✅ 3-of-5 tests: 2/2 passed

🎉 All tests passed!
```

## Troubleshooting

### Migration Issues

**Error: "column already exists"**
- The migration uses `IF NOT EXISTS` so this shouldn't happen
- Check if migration was partially run: `SELECT * FROM information_schema.columns WHERE column_name = 'fragment_scheme'`

**Error: "permission denied"**
- Ensure database user has ALTER TABLE permissions
- Check database connection credentials

### Test Issues

**Error: "Cannot find module 'node-fetch'"**
- Install dependencies: `npm install`
- Or use the TypeScript version: `tsx scripts/test-recovery-endpoint.ts`

**Error: "Connection refused"**
- Ensure API server is running
- Check API_URL environment variable
- Verify CORS settings if testing against remote API

**Test fails: "Secret mismatch"**
- This indicates a problem with fragment reconstruction
- Check server logs for errors
- Verify Shamir service is working correctly

## Next Steps

After successful staging deployment:
1. ✅ Review test results
2. ✅ Monitor recovery success rates
3. ✅ Verify UI displays correct scheme information
4. ✅ Document any issues encountered
5. ✅ Schedule production migration

## Support

For issues, check:
- Migration guide: `docs/deployment/STAGING_MIGRATION_GUIDE.md`
- Monitoring docs: `docs/monitoring/FRAGMENT_RECOVERY_MONITORING.md`
- Migration file: `migrations/004_fragment_scheme_tracking.sql`

