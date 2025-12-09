# Database Migrations Guide

GuardiaVault uses Drizzle ORM for database migrations with a custom migration tracking system that supports rollback capabilities.

## Overview

The migration system provides:
- ✅ **Automatic migration tracking** via `drizzle_migrations` table
- ✅ **Migration status** checking
- ✅ **Rollback capability** (with manual rollback SQL support)
- ✅ **Production-safe** migration procedures
- ✅ **Migration history** tracking

## Quick Start

### Generate Migrations

After modifying the schema in `shared/schema.ts`, generate migration files:

```bash
pnpm run db:generate
```

This creates SQL migration files in `drizzle/migrations/` directory.

### Apply Migrations

Run all pending migrations:

```bash
pnpm run db:migrate
```

### Check Migration Status

View which migrations are applied and which are pending:

```bash
pnpm run db:migrate:status
```

### Rollback Last Migration

Rollback the most recent migration:

```bash
pnpm run db:migrate:down
```

**Note**: Rollback requires manual SQL. The system removes the migration from tracking, but you must manually write and execute rollback SQL.

## Migration Commands

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run db:generate` | Generate migration files from schema changes |
| `pnpm run db:push` | Push schema directly to database (dev only) |
| `pnpm run db:migrate` | Apply all pending migrations |
| `pnpm run db:migrate:down` | Rollback last migration |
| `pnpm run db:migrate:status` | Show migration status |
| `pnpm run db:studio` | Open Drizzle Studio (database GUI) |

### Direct Script Usage

You can also run the migration script directly:

```bash
# Apply migrations
tsx server/scripts/migrate.ts up

# Rollback last migration
tsx server/scripts/migrate.ts down

# Check status
tsx server/scripts/migrate.ts status
```

## Migration Workflow

### Development Workflow

1. **Modify Schema** (`shared/schema.ts`)
   ```typescript
   // Add a new table or column
   export const newTable = pgTable("new_table", {
     id: varchar("id").primaryKey(),
     // ...
   });
   ```

2. **Generate Migration**
   ```bash
   pnpm run db:generate
   ```
   This creates a new SQL file in `drizzle/migrations/` like:
   ```
   pg_00001_abc123.sql
   ```

3. **Review Migration**
   ```bash
   # Check the generated SQL file
   cat drizzle/migrations/pg_00001_abc123.sql
   ```

4. **Apply Migration**
   ```bash
   pnpm run db:migrate
   ```

5. **Verify**
   ```bash
   pnpm run db:migrate:status
   ```

### Production Workflow

**⚠️ Important**: Always test migrations in staging first!

1. **Generate Migration** (in development)
   ```bash
   pnpm run db:generate
   ```

2. **Test Migration** (in staging environment)
   ```bash
   # Set staging DATABASE_URL
   export DATABASE_URL="postgresql://..."
   pnpm run db:migrate
   ```

3. **Backup Production Database**
   ```bash
   # Before running migrations, create a backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Review Migration SQL**
   - Open the migration file
   - Review all SQL statements
   - Ensure no data loss

5. **Apply Migration** (production)
   ```bash
   # Set production DATABASE_URL
   export DATABASE_URL="postgresql://..."
   pnpm run db:migrate
   ```

6. **Verify Application**
   - Check application logs
   - Verify health endpoints
   - Monitor for errors

## Migration Tracking

### Tracking Table

Migrations are tracked in the `drizzle_migrations` table:

```sql
CREATE TABLE drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

The hash is extracted from the migration filename (e.g., `pg_00001_abc123.sql` → hash: `abc123`).

### How It Works

1. **Migration Detection**: The system reads all `.sql` files in `drizzle/migrations/`
2. **Status Check**: Compares filenames against applied migrations in the tracking table
3. **Application**: Only runs migrations that haven't been applied
4. **Recording**: Records the migration hash after successful application

## Rollback Procedures

### Automatic Rollback Tracking

The migration system can remove a migration from tracking:

```bash
pnpm run db:migrate:down
```

However, **this does not automatically rollback the SQL changes**. You must manually:

1. **Create Rollback SQL**
   Create a rollback script that reverses the migration changes.

2. **Execute Rollback**
   Run the rollback SQL manually or create a rollback migration file.

### Example: Rolling Back a Migration

Suppose you have migration `pg_00001_abc123.sql` that adds a column:

```sql
-- pg_00001_abc123.sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```

To rollback:

1. **Remove from tracking**:
   ```bash
   pnpm run db:migrate:down
   ```

2. **Create rollback SQL** (manually):
   ```sql
   -- rollback_pg_00001_abc123.sql
   ALTER TABLE users DROP COLUMN new_field;
   ```

3. **Execute rollback**:
   ```bash
   psql $DATABASE_URL -f rollback_pg_00001_abc123.sql
   ```

### Best Practices for Rollbacks

1. **Always test rollbacks in staging first**
2. **Backup database before rolling back**
3. **Document rollback procedures** for complex migrations
4. **Consider data migration** if rollback affects existing data

## Production Safety

### Pre-Migration Checklist

- [ ] Migration tested in staging environment
- [ ] Database backup created
- [ ] Migration SQL reviewed for safety
- [ ] Rollback procedure documented
- [ ] Application deployment plan coordinated
- [ ] Monitoring and alerts configured
- [ ] Maintenance window scheduled (if needed)

### Migration Safety Guidelines

1. **No Data Loss**: Ensure migrations don't drop columns/tables with data
2. **Backwards Compatible**: Make schema changes backwards compatible when possible
3. **Idempotent**: Migrations should be safe to run multiple times
4. **Atomic**: Use transactions where possible
5. **Reversible**: Plan for rollback scenarios

### Example: Safe Migration

**Good**: Adding a nullable column
```sql
ALTER TABLE users ADD COLUMN new_field TEXT;
```
✅ Safe: Doesn't affect existing data

**Bad**: Dropping a column
```sql
ALTER TABLE users DROP COLUMN important_field;
```
⚠️ Dangerous: Data loss risk

**Better**: Mark column as deprecated first
```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Step 2: Migrate data (application logic)
-- UPDATE users SET new_field = important_field;

-- Step 3: Remove old column (separate migration after verification)
-- ALTER TABLE users DROP COLUMN important_field;
```

## Troubleshooting

### Migration Fails Partway Through

If a migration fails:

1. **Check Error**: Review the error message
2. **Fix Issue**: Correct the migration SQL if needed
3. **Manual Cleanup**: May need to manually clean up partial changes
4. **Re-run**: Once fixed, run migration again

### Migration Already Applied But File Missing

If the tracking table says a migration is applied but the file is missing:

1. **Check Tracking**:
   ```bash
   pnpm run db:migrate:status
   ```

2. **Manual Cleanup**: Remove from tracking table:
   ```sql
   DELETE FROM drizzle_migrations WHERE hash = 'missing_hash';
   ```

### Database Schema Drift

If your database schema doesn't match migrations:

1. **Generate Fresh Migration**:
   ```bash
   pnpm run db:generate
   ```

2. **Review**: Check the generated migration
3. **Apply**: Run the migration to sync

Alternatively, use `db:push` in development:
```bash
pnpm run db:push  # Syncs schema directly (dev only)
```

## Migration File Structure

### File Naming

Drizzle generates migration files with this format:
```
pg_<sequence>_<hash>.sql
```

Example:
```
pg_00001_abc123def456.sql
pg_00002_xyz789ghi012.sql
```

### File Contents

Migration files contain PostgreSQL SQL:
```sql
-- Migration: pg_00001_abc123def456

CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  ...
);
```

## Environment Configuration

### Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string

### Example

```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Additional Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs
- **Drizzle Kit Docs**: https://orm.drizzle.team/kit-docs/overview
- **Schema File**: `shared/schema.ts`
- **Migration Script**: `server/scripts/migrate.ts`
- **Config File**: `drizzle.config.ts`

## Common Scenarios

### Adding a New Table

1. Add table definition to `shared/schema.ts`
2. Run `pnpm run db:generate`
3. Review generated migration
4. Run `pnpm run db:migrate`

### Adding a Column to Existing Table

1. Add column to table definition in `shared/schema.ts`
2. Run `pnpm run db:generate`
3. Review migration (should be safe if nullable)
4. Run `pnpm run db:migrate`

### Renaming a Column

1. Update column name in `shared/schema.ts`
2. Run `pnpm run db:generate`
3. Review migration (may require data migration)
4. Run `pnpm run db:migrate`
5. Update application code references

### Removing a Column

1. Remove column from `shared/schema.ts`
2. Run `pnpm run db:generate`
3. **⚠️ Review carefully** - will drop column and data
4. Consider multi-step approach:
   - Step 1: Mark as deprecated, don't use in code
   - Step 2: After period, remove from schema and migrate

---

**Note**: Always test migrations in a development/staging environment before applying to production!

