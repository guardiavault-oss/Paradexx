# Optional Services Configuration

## Overview

The backend server can run without Redis and PostgreSQL in development mode. These services are optional but recommended for production.

## Current Status

### ✅ What Works Without Services

- **API Endpoints** - All REST endpoints work
- **Trading API** - 1inch integration works (no cache)
- **OAuth** - Google/GitHub authentication works
- **JWT Authentication** - Works without database (in-memory)

### ⚠️ What's Limited Without Services

- **Database** - User registration/login requires PostgreSQL
- **Redis** - Caching disabled, queues disabled
- **Real-time Updates** - WebSocket works but no persistence

## Running Without Services

### Development Mode (Current)

The server will:
- ✅ Start successfully without PostgreSQL
- ✅ Start successfully without Redis
- ⚠️ Show warnings but continue running
- ⚠️ Some features will be limited

### Production Mode

The server will:
- ❌ Fail to start without PostgreSQL
- ⚠️ Warn about Redis but continue
- ✅ Require all critical services

## Starting Services (Optional)

### PostgreSQL

**Option 1: Docker**
```powershell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=regenx postgres
```

**Option 2: Local Installation**
- Install PostgreSQL from https://www.postgresql.org/download/
- Start PostgreSQL service
- Update `DATABASE_URL` in `.env`

**Option 3: Railway/Supabase**
- Get `DATABASE_URL` from provider
- Update `DATABASE_URL` in `.env`

### Redis

**Option 1: Docker**
```powershell
docker run -d -p 6379:6379 redis
```

**Option 2: Local Installation**
- Install Redis from https://redis.io/download
- Start Redis service
- Update `REDIS_URL` in `.env` if needed

**Option 3: Railway/Upstash**
- Get `REDIS_URL` from provider
- Update `REDIS_URL` in `.env`

## Testing Without Services

You can test trading functionality without database/Redis:

```powershell
# Test trading (works without DB/Redis)
npm run test:trading

# Test API connections (will warn about DB/Redis)
npm run test:api
```

## Next Steps

1. **For Trading Tests**: No services needed - just update `ONEINCH_API_KEY`
2. **For Full Testing**: Start PostgreSQL for user/auth features
3. **For Production**: Both PostgreSQL and Redis required

