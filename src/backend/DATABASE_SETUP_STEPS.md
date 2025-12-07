# Database Setup Steps - Run These Commands

Your PostgreSQL container is running! ✅ Container ID: `f6c9a20e9f77...`

## Step 1: Update .env File

Add or update this line in `src/backend/.env`:

```
DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx
```

## Step 2: Push Database Schema

Run this command:

```powershell
cd src/backend
$env:DATABASE_URL="postgresql://postgres:regenx123@localhost:5432/regenx"
npx prisma db push --accept-data-loss
```

## Step 3: Generate Prisma Client

```powershell
npx prisma generate
```

## Step 4: Verify Database Connection

```powershell
npx tsx scripts/test-vault-complete.ts
```

You should see:
```
✅ Database: CONNECTED
```

## Step 5: Get Access Token (for full API tests)

### Start backend server:
```powershell
npm run dev
```

### In another terminal, register a user:
```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"displayName\":\"Test User\"}'
```

### Login:
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'
```

Copy the `accessToken` from the response.

### Add to .env:
```
TEST_ACCESS_TOKEN=your_access_token_here
```

## Step 6: Run Complete Vault Test

```powershell
npm run test:vault:complete
```

## Quick One-Liner Setup

Or run this all at once:

```powershell
cd src/backend
$env:DATABASE_URL="postgresql://postgres:regenx123@localhost:5432/regenx"
npx prisma db push --accept-data-loss
npx prisma generate
npm run test:vault:complete
```

## Troubleshooting

### Database Connection Error
```powershell
# Check if container is running
docker ps --filter "name=regenx-postgres"

# Check container logs
docker logs regenx-postgres

# Restart container if needed
docker restart regenx-postgres
```

### Prisma Errors
```powershell
# Reset Prisma
npx prisma generate
npx prisma db push --force-reset
```

## Expected Output

After setup, you should see:
```
✅ Vault Logic: PASSED
✅ Database: CONNECTED
⚠️  Guardian API: SKIPPED (needs TEST_ACCESS_TOKEN)
⚠️  Recovery API: SKIPPED (needs TEST_ACCESS_TOKEN)
⚠️  Beneficiary API: SKIPPED (needs TEST_ACCESS_TOKEN)
```

After adding TEST_ACCESS_TOKEN:
```
✅ Vault Logic: PASSED
✅ Database: CONNECTED
✅ Guardian API: WORKING
✅ Recovery API: WORKING
✅ Beneficiary API: WORKING
```

