import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        await prisma.$connect();
        console.log('✅ Database connection successful!');

        // Test basic query
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('✅ Basic query successful:', result);

        // Test if tables exist
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
        console.log('✅ Database tables:', tables);

        console.log('✅ All database tests passed!');

    } catch (error) {
        console.error('❌ Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
