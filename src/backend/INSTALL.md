# Backend Installation Guide

## Quick Setup

### 1. Install Dependencies

```powershell
cd src/backend
npm install
```

This will install all required packages including `tsx` which is needed to run TypeScript files.

### 2. Set Up Environment Variables

Create a `.env` file in `src/backend/`:

```bash
# Copy from root .env.example or create new
DATABASE_URL=postgresql://user:password@localhost:5432/regenx
JWT_SECRET=your-random-32-character-secret-key
JWT_REFRESH_SECRET=your-random-32-character-refresh-secret
ONEINCH_API_KEY=your-1inch-api-key
PORT=3001
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
```

### 3. Set Up Database

```powershell
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 4. Verify Installation

```powershell
# Check if tsx is installed
npx tsx --version

# Should output: tsx version number
```

### 5. Run Tests

```powershell
# Test API connections
npm run test:api

# Test trading
npm run test:trading

# Test vault setup
npm run test:vault

# Full integration test
npm run test:integration
```

### 6. Start Backend Server

```powershell
npm run dev
```

## Troubleshooting

### "tsx is not recognized"
- Run `npm install` in the `src/backend` directory
- Make sure you're in the correct directory
- Check that `node_modules` folder exists

### "Cannot find module"
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### "Database connection failed"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npx prisma migrate dev`

### "ONEINCH_API_KEY not set"
- Add your 1inch API key to `.env` file
- Get key from: https://portal.1inch.dev/

## Next Steps

After installation:
1. ✅ Run `npm run test:api` to verify connections
2. ✅ Start backend with `npm run dev`
3. ✅ Test trading functionality
4. ✅ Set up inheritance vaults

