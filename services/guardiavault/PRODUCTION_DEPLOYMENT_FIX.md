# Production Deployment Fixes

## Issues Fixed

### 1. CSP Error: "Content-Security-Policy has no directives"

**Problem:** Helmet was throwing an error because CSP directives were empty or invalid in production.

**Fix:** Enhanced `server/middleware/csp.ts` with:
- Better validation of directives object
- Multiple fallback layers
- Ensured at least `defaultSrc`, `scriptSrc`, and `styleSrc` are always present
- Added error logging for debugging

**Changes:**
- Added type checking for directives object
- Added fallback to minimal CSP if directives are invalid
- Ensured multiple directives exist (helmet requirement)
- Added console.error for debugging in production

### 2. Migration Error: role "app_user" does not exist

**Problem:** `006_recovery_setups.sql` was trying to grant permissions to `app_user` role which doesn't exist in production database.

**Fix:** Made GRANT statements conditional - only execute if role exists.

**Changes in `migrations/006_recovery_setups.sql`:**
```sql
-- Grant permissions (only if app_user role exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        -- GRANT statements here
    END IF;
END $$;
```

### 3. Migration Error: relation "claim_attestations" does not exist

**Problem:** `011_query_optimization_indexes.sql` was trying to create indexes on `claim_attestations` table which might not exist yet.

**Fix:** Made index creation conditional - only create if table exists.

**Changes in `migrations/011_query_optimization_indexes.sql`:**
```sql
-- Only create if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'claim_attestations') THEN
        CREATE INDEX IF NOT EXISTS idx_claim_attestations_claim_id ON claim_attestations(claim_id);
        CREATE INDEX IF NOT EXISTS idx_claim_attestations_party_id ON claim_attestations(party_id);
    END IF;
END $$;
```

## Testing

After deploying these fixes:

1. **CSP should work** - No more "no directives" error
2. **Migrations should complete** - No more role/table not found errors
3. **Server should start** - Application should boot successfully

## Deployment Steps

1. Commit these fixes
2. Push to repository
3. Redeploy to production (Railway/Netlify)
4. Monitor logs for successful startup
5. Verify application is accessible

## Notes

- Migrations are now idempotent (safe to re-run)
- CSP has multiple fallback layers for reliability
- All database operations check for existence before executing

