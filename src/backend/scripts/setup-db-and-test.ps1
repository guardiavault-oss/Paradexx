# Setup Database and Run Tests
Write-Host "Setting up database and running vault tests..." -ForegroundColor Cyan

# Set DATABASE_URL
$env:DATABASE_URL = "postgresql://postgres:regenx123@localhost:5432/regenx"

Write-Host "`n1. Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n2. Pushing database schema..." -ForegroundColor Yellow
npx prisma db push --accept-data-loss

Write-Host "`n3. Testing database connection..." -ForegroundColor Yellow
npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.\$queryRaw\`SELECT 1\`.then(() => { console.log('✅ Database connected!'); prisma.\$disconnect(); }).catch((e) => { console.log('❌ Database error:', e.message); prisma.\$disconnect(); process.exit(1); });"

Write-Host "`n4. Running vault tests..." -ForegroundColor Yellow
npm run test:vault:complete

