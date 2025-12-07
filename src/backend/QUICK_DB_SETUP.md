# Quick Database Setup for Vault Testing

## ✅ Vault Logic Test Results

Your vault logic test **PASSED**! ✅
- Guardian validation: ✅
- Threshold validation: ✅  
- Timelock validation: ✅
- Beneficiary allocation: ✅

## 🚀 Quick Database Setup

### Option 1: Docker (Easiest)

```powershell
# Check if Docker is installed
docker --version

# If Docker is available, run:
docker run -d --name regenx-postgres -e POSTGRES_PASSWORD=regenx123 -e POSTGRES_DB=regenx -p 5432:5432 postgres:15

# Wait a few seconds for PostgreSQL to start
Start-Sleep -Seconds 5

# Update .env file with:
# DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx
```

### Option 2: Railway (Recommended for Production)

1. Go to Railway dashboard: https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Copy `DATABASE_URL` from service variables
5. Update `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

### Option 3: Local PostgreSQL

1. Install PostgreSQL: https://www.postgresql.org/download/windows/
2. Create database:
   ```sql
   CREATE DATABASE regenx;
   ```
3. Update `.env`:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/regenx
   ```

## 📋 Setup Steps

### 1. Update .env File

Add or update `DATABASE_URL` in `src/backend/.env`:
```
DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx
```

### 2. Run Migrations

```powershell
cd src/backend
npx prisma migrate dev
npx prisma generate
```

### 3. Start Backend Server

```powershell
npm run dev
```

### 4. Get Access Token

```powershell
# Register test user
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"displayName\":\"Test User\"}'

# Login
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'

# Copy the "accessToken" from the response
```

### 5. Add Token to .env

Add to `src/backend/.env`:
```
TEST_ACCESS_TOKEN=your_access_token_here
```

### 6. Run Complete Test

```powershell
npm run test:vault:complete
```

## 🎯 Expected Results

### Without Database:
```
✅ Vault Logic: PASSED
⚠️  Database: NOT AVAILABLE
⚠️  Guardian API: SKIPPED
⚠️  Recovery API: SKIPPED
⚠️  Beneficiary API: SKIPPED
```

### With Database + Auth:
```
✅ Vault Logic: PASSED
✅ Database: CONNECTED
✅ Guardian API: WORKING
✅ Recovery API: WORKING
✅ Beneficiary API: WORKING
```

## 🔧 Troubleshooting

### Docker Not Found
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Or use Railway PostgreSQL instead

### Database Connection Error
- Check if PostgreSQL is running: `docker ps` (for Docker)
- Verify `DATABASE_URL` format in `.env`
- Check firewall/port 5432

### Prisma Errors
```powershell
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## ✅ Current Status

- ✅ Vault logic validation: **WORKING**
- ✅ API endpoints: **IMPLEMENTED**
- ✅ Database schema: **READY**
- ⚠️  Database connection: **NEEDS SETUP**
- ⚠️  Authentication: **NEEDS TOKEN**

**Your vault system is ready - just needs database + auth token!**

