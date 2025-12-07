# Inheritance Vault Testing Guide

## Quick Start

### Option 1: Docker (Recommended)

```powershell
# Start PostgreSQL with Docker
npm run setup:db

# Or manually:
docker run -d --name regenx-postgres -e POSTGRES_PASSWORD=regenx123 -e POSTGRES_DB=regenx -p 5432:5432 postgres:15
```

Update `.env`:
```
DATABASE_URL=postgresql://postgres:regenx123@localhost:5432/regenx
```

### Option 2: Railway Database

1. Go to Railway dashboard
2. Add PostgreSQL service
3. Copy `DATABASE_URL` from service variables
4. Update `.env` file

### Option 3: Local PostgreSQL

1. Install PostgreSQL: https://www.postgresql.org/download/
2. Create database: `createdb regenx`
3. Update `.env`:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/regenx
```

## Setup Steps

### 1. Start Database

```powershell
# Using Docker
npm run setup:db

# Or start your PostgreSQL service
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
# Register a test user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Copy the accessToken from response
```

### 5. Set Test Token

Add to `.env`:
```
TEST_ACCESS_TOKEN=your_access_token_here
```

### 6. Run Tests

```powershell
# Complete vault test (works with or without database)
npm run test:vault:complete

# Original vault test (requires database)
npm run test:vault
```

## Test Flow

### 1. Vault Logic Test ✅
- Validates guardian count (min 2)
- Validates threshold (M-of-N)
- Validates timelock period (7 days - 1 year)
- Validates beneficiary allocation (must equal 100%)

### 2. Guardian API Test
- **GET** `/api/guardians` - List guardians
- **POST** `/api/guardians` - Add guardian
- **POST** `/api/guardians/accept` - Accept invitation
- **POST** `/api/guardians/recovery` - Initiate recovery

### 3. Beneficiary API Test
- **GET** `/api/beneficiaries` - List beneficiaries
- **POST** `/api/beneficiaries` - Add beneficiary
- **PUT** `/api/beneficiaries/:id` - Update beneficiary
- **DELETE** `/api/beneficiaries/:id` - Remove beneficiary

### 4. Recovery Flow Test
- Initiate recovery request
- Guardian approvals (M-of-N)
- Timelock period validation
- Recovery execution

## API Endpoints

### Guardians

```bash
# List guardians
GET /api/guardians
Authorization: Bearer {token}

# Add guardian
POST /api/guardians
Authorization: Bearer {token}
{
  "email": "guardian@example.com",
  "name": "Guardian Name"
}

# Accept invitation
POST /api/guardians/accept
Authorization: Bearer {token}
{
  "inviteToken": "token_from_email"
}

# Initiate recovery
POST /api/guardians/recovery
Authorization: Bearer {token}
{
  "requesterEmail": "beneficiary@example.com",
  "reason": "Account recovery"
}
```

### Beneficiaries

```bash
# List beneficiaries
GET /api/beneficiaries
Authorization: Bearer {token}

# Add beneficiary
POST /api/beneficiaries
Authorization: Bearer {token}
{
  "name": "Beneficiary Name",
  "email": "beneficiary@example.com",
  "percentage": 50,
  "relationship": "Spouse"
}

# Update beneficiary
PUT /api/beneficiaries/:id
Authorization: Bearer {token}
{
  "percentage": 60
}

# Remove beneficiary
DELETE /api/beneficiaries/:id
Authorization: Bearer {token}
```

## Expected Test Results

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

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server at `localhost:5432`
```
**Solution**: Start PostgreSQL or use Railway database URL

### Authentication Error
```
⚠️  Authentication required
```
**Solution**: Set `TEST_ACCESS_TOKEN` in `.env` after logging in

### Prisma Schema Error
```
Error: Prisma schema validation error
```
**Solution**: Run `npx prisma generate` and `npx prisma migrate dev`

### No Guardians Error
```
Error: No guardians found
```
**Solution**: Add guardians first using `POST /api/guardians`

## Next Steps

1. ✅ Test vault logic (works without database)
2. ⚠️  Set up database (Docker/Railway)
3. ⚠️  Get access token (register/login)
4. ⚠️  Test guardian API
5. ⚠️  Test beneficiary API
6. ⚠️  Test recovery flow
7. ⚠️  Deploy to Railway

## Smart Contract Integration

The vault logic is tested, but actual smart contract deployment requires:
- Contract addresses (already in `.env`)
- Web3 provider connection
- Gas fees for deployment
- Guardian wallet addresses

This will be tested in the next phase.

