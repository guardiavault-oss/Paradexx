# Complete Setup Instructions

## Quick Start (5 minutes)

### 1. Start Database

**Option A: Docker (Recommended)**
```powershell
# Start Docker Desktop first, then:
docker-compose up -d postgres

# Wait for database to be ready (about 10 seconds)
docker exec guardiavault-db pg_isready -U guardiavault
```

**Option B: Local PostgreSQL**
```powershell
# Create database
createdb guardiavault
# Or use psql:
psql -U postgres -c "CREATE DATABASE guardiavault;"
```

### 2. Configure Environment

Verify `.env` file exists and has:
```env
DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
SESSION_SECRET=your-generated-secret-here
NODE_ENV=development
```

### 3. Run Migrations

```powershell
# Push schema
pnpm run db:push

# Apply manual migrations
npm run db:migrate
```

### 4. Run Tests

```powershell
npm test
```

All tests should pass! ✅

### 5. Start Development Server

```powershell
npm run dev
```

Server will start on http://localhost:5000

## Detailed Setup

See `DATABASE_SETUP.md` for database setup details.

## Troubleshooting

### Database Connection Issues

**Error:** `ECONNREFUSED` or `Connection refused`

**Solutions:**
1. Verify Docker Desktop is running
2. Check database container: `docker ps`
3. Check DATABASE_URL in .env
4. Verify port 5432 is not blocked

### Migration Errors

**Error:** `relation already exists`

**Solutions:**
- This is normal if migrations were run before
- Migrations are idempotent (safe to re-run)
- Continue with other migrations

### Test Failures

**Error:** Database connection errors in tests

**Solutions:**
1. Ensure database is running
2. Check DATABASE_URL is set
3. Run migrations first
4. Some tests require database (integration tests)

## Next Steps

After setup:
1. ✅ Run all tests: `npm test`
2. ✅ Start server: `npm run dev`
3. ✅ Open Drizzle Studio: `npm run db:studio`
4. ✅ Review `COMPREHENSIVE_TESTING_PLAN.md`
5. ✅ Review `DEPLOYMENT_READINESS_CHECKLIST.md`

