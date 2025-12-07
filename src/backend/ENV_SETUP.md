# Environment Variables Setup

## Quick Setup

### 1. Create .env file

Run the setup script:
```powershell
.\create-env.ps1
```

Or manually copy the template:
```powershell
Copy-Item env.template .env
```

### 2. Edit .env file

Open `.env` and fill in your values:

#### Required Variables

```bash
# Database - PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/regenx

# JWT Secrets - Generate random 32-character strings
JWT_SECRET=your-random-32-character-secret-key-here
JWT_REFRESH_SECRET=your-random-32-character-refresh-secret-here

# Trading API - Get from https://portal.1inch.dev/
ONEINCH_API_KEY=your-1inch-api-key
```

#### Recommended Variables

```bash
# Web3 Provider (choose at least one)
ALCHEMY_API_KEY=your-alchemy-key
# OR
INFURA_API_KEY=your-infura-key

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Generate JWT Secrets

You can generate random secrets using PowerShell:

```powershell
# Generate JWT_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate JWT_REFRESH_SECRET
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Or use an online generator: https://randomkeygen.com/

### 4. Get API Keys

**1inch API (Required for trading):**
1. Go to https://portal.1inch.dev/
2. Sign up / Login
3. Create a new API key
4. Copy the key to `ONEINCH_API_KEY`

**Alchemy (Recommended):**
1. Go to https://www.alchemy.com/
2. Sign up / Login
3. Create a new app
4. Copy the API key to `ALCHEMY_API_KEY`

**Infura (Alternative):**
1. Go to https://www.infura.io/
2. Sign up / Login
3. Create a new project
4. Copy the API key to `INFURA_API_KEY`

### 5. Database Setup

**Option 1: Local PostgreSQL**
```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/regenx
```

**Option 2: Railway PostgreSQL (for deployment)**
```bash
DATABASE_URL=<from-railway-dashboard>
```

**Option 3: Supabase PostgreSQL**
```bash
DATABASE_URL=<from-supabase-dashboard>
```

### 6. Verify Setup

After creating `.env`, run:
```powershell
npm run test:api
```

This will verify all environment variables are set correctly.

## Minimum Configuration

For basic testing, you need at minimum:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/regenx
JWT_SECRET=random-32-chars
JWT_REFRESH_SECRET=random-32-chars
ONEINCH_API_KEY=your-key
```

## Troubleshooting

### "DATABASE_URL: MISSING"
- Create `.env` file in `src/backend/` directory
- Add `DATABASE_URL=...` line

### "ONEINCH_API_KEY not set"
- Get API key from https://portal.1inch.dev/
- Add to `.env` file

### Database connection fails
- Check PostgreSQL is running
- Verify connection string format
- Test connection: `psql DATABASE_URL`

