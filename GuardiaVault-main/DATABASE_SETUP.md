# Database Setup Guide

## Quick Start (Docker - Recommended)

### Prerequisites
1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Start Docker Desktop application
   - Wait for it to fully start (whale icon in system tray)

### Setup Steps

1. **Start Docker Desktop** (if not already running)

2. **Start PostgreSQL database:**
   ```powershell
   docker-compose up -d postgres
   ```

3. **Verify database is running:**
   ```powershell
   docker ps
   ```
   You should see `guardiavault-db` container running.

4. **Wait for database to be ready:**
   ```powershell
   docker exec guardiavault-db pg_isready -U guardiavault
   ```
   Should return: `guardiavault-db:5432 - accepting connections`

5. **Run database migrations:**
   ```powershell
   # Push schema
   pnpm run db:push
   
   # Apply manual migrations
   npm run db:migrate
   ```

6. **Verify .env file has correct DATABASE_URL:**
   ```
   DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
   ```

## Alternative: Local PostgreSQL

If you prefer not to use Docker:

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use: `winget install PostgreSQL.PostgreSQL`

2. **Create database:**
   ```sql
   CREATE DATABASE guardiavault;
   CREATE USER guardiavault WITH PASSWORD 'changeme';
   GRANT ALL PRIVILEGES ON DATABASE guardiavault TO guardiavault;
   ```

3. **Update .env:**
   ```
   DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
   ```

4. **Run migrations:**
   ```powershell
   pnpm run db:push
   npm run db:migrate
   ```

## Cloud Database Options

### Neon (Recommended for development)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy connection string
4. Update .env:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Railway
1. Sign up at https://railway.app
2. Create PostgreSQL service
3. Copy connection string
4. Update .env with connection string

## Verification

After setup, verify database connection:

```powershell
# Test connection
node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: process.env.DATABASE_URL }); p.query('SELECT 1').then(() => { console.log('✅ Connected'); process.exit(0); }).catch(e => { console.log('❌ Failed:', e.message); process.exit(1); });"
```

## Troubleshooting

### Docker Desktop not running
- Start Docker Desktop application
- Wait for it to fully initialize
- Check system tray for Docker icon

### Connection refused
- Verify database container is running: `docker ps`
- Check DATABASE_URL in .env matches Docker setup
- Verify port 5432 is not blocked by firewall

### Migration errors
- Most migrations are idempotent (safe to re-run)
- Check database logs: `docker logs guardiavault-db`
- Verify user has CREATE TABLE permissions

## Next Steps

Once database is set up:
1. ✅ Run tests: `npm test`
2. ✅ Start server: `npm run dev`
3. ✅ Open Drizzle Studio: `npm run db:studio`

