// Quick Database Setup
import dotenv from 'dotenv';
import { logger } from '../services/logger.service';
import { PrismaClient } from '@prisma/client';

// Set DATABASE_URL if not in .env
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:regenx123@localhost:5432/regenx';
}

const prisma = new PrismaClient();

async function setupDatabase() {
  logger.info('\n🚀 Setting up database...\n');

  try {
    // Test connection
    logger.info('1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1`;
    logger.info('   ✅ Database connected!\n');

    // Push schema
    logger.info('2. Pushing database schema...');
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    logger.info('   ✅ Schema pushed!\n');

    // Generate Prisma client
    logger.info('3. Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    logger.info('   ✅ Prisma client generated!\n');

    // Verify tables
    logger.info('4. Verifying tables...');
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    logger.info(`   ✅ Found ${tables.length} tables:`);
    tables.forEach(t => logger.info(`      - ${t.tablename}`));

    logger.info('\n✅ Database setup complete!\n');
    logger.info('Next steps:');
    logger.info('   1. Start backend: npm run dev');
    logger.info('   2. Register/login to get access token');
    logger.info('   3. Set TEST_ACCESS_TOKEN in .env');
    logger.info('   4. Run: npm run test:vault:complete\n');

  } catch (error: any) {
    logger.error('\n❌ Database setup failed:', error.message);
    if (error.message.includes('Can\'t reach database')) {
      logger.error('\n💡 Make sure PostgreSQL is running:');
      logger.error('   docker ps --filter "name=regenx-postgres"');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();

