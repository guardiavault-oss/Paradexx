# Database Setup Options - GuardiaVault

Since Docker Desktop is not currently running, here are your options for setting up the database:

## Option 1: Start Docker Desktop (Recommended)

### Steps:
1. **Install Docker Desktop** (if not installed):
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and restart your computer

2. **Start Docker Desktop:**
   - Open Docker Desktop application
   - Wait for it to fully start (green "Running" status in system tray)

3. **Start database:**
   ```powershell
   docker-compose up -d postgres
   ```

4. **Verify database is running:**
   ```powershell
   docker ps
   docker exec guardiavault-db pg_isready -U guardiavault
   ```

5. **Run migrations:**
   ```powershell
   npm run db:migrate
   ```

## Option 2: Local PostgreSQL Installation

### Steps:
1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use: `winget install PostgreSQL.PostgreSQL`
   - Or use: `choco install postgresql` (if you have Chocolatey)

2. **Start PostgreSQL service:**
   ```powershell
   # If installed as service, it should start automatically
   # Or start manually:
   net start postgresql-x64-16  # Adjust version number
   ```

3. **Create database and user:**
   ```sql
   -- Connect to PostgreSQL (default superuser)
   psql -U postgres
   
   -- Create database
   CREATE DATABASE guardiavault;
   
   -- Create user
   CREATE USER guardiavault WITH PASSWORD 'changeme';
   
   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE guardiavault TO guardiavault;
   
   -- Exit
   \q
   ```

4. **Update .env file:**
   ```env
   DATABASE_URL=postgresql://guardiavault:changeme@localhost:5432/guardiavault
   ```

5. **Run migrations:**
   ```powershell
   npm run db:migrate
   ```

## Option 3: Cloud Database (Neon - Free Tier)

### Steps:
1. **Sign up for Neon:**
   - Go to https://neon.tech
   - Create a free account
   - Create a new project

2. **Get connection string:**
   - Copy the connection string from Neon dashboard
   - Format: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

3. **Update .env file:**
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

4. **Run migrations:**
   ```powershell
   npm run db:migrate
   ```

## Option 4: Railway (Free Tier)

### Steps:
1. **Sign up for Railway:**
   - Go to https://railway.app
   - Create a free account

2. **Create PostgreSQL service:**
   - Click "New Project"
   - Select "PostgreSQL"
   - Railway will create a database automatically

3. **Get connection string:**
   - Copy the DATABASE_URL from Railway dashboard
   - Update your .env file

4. **Run migrations:**
   ```powershell
   npm run db:migrate
   ```

## Quick Test: Verify Database Connection

After setting up the database, test the connection:

```powershell
# Test connection with Node.js
node -e "const { Pool } = require('pg'); const p = new Pool({ connectionString: process.env.DATABASE_URL }); require('dotenv').config(); p.query('SELECT 1').then(() => { console.log('✅ Database connected!'); process.exit(0); }).catch(e => { console.log('❌ Connection failed:', e.message); process.exit(1); });"
```

## Troubleshooting

### "Connection refused"
- Database not running
- Wrong host/port in DATABASE_URL
- Firewall blocking connection

### "Authentication failed"
- Wrong username/password in DATABASE_URL
- User doesn't have permissions

### "Database does not exist"
- Create the database first
- Check DATABASE_URL database name

## Recommendation

For **development**, I recommend:
- **Option 1 (Docker)** - If you have Docker Desktop
- **Option 3 (Neon)** - If you want a cloud database (no local setup)

For **production**, use:
- **Option 3 (Neon)** or **Option 4 (Railway)** - Managed cloud databases

## Next Steps After Database Setup

Once your database is running:

1. ✅ Run migrations: `npm run db:migrate`
2. ✅ Run tests: `npm test`
3. ✅ Start server: `npm run dev`
4. ✅ Open Drizzle Studio: `npm run db:studio`

