// Database Configuration - PostgreSQL with Prisma ORM

import { PrismaClient } from '@prisma/client';
import { logger } from '../services/logger.service';

// Singleton Prisma Client
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  try {
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️  Database not available - some features will be limited');
        logger.warn('   Start PostgreSQL or update DATABASE_URL in .env');
        return; // Don't fail in development
      } else {
        throw new Error('Failed to connect to database');
      }
    }
    
    logger.info('✅ Database connected successfully');
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️  Database connection failed - continuing without database');
      logger.warn('   Start PostgreSQL or update DATABASE_URL in .env');
      return; // Don't fail in development
    } else {
      logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }
}

export default prisma;
