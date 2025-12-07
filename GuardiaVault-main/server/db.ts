import * as schema from "@shared/schema";
import { logInfo, logWarn, logError, logDebug } from "./services/logger";

// Determine which database driver to use based on DATABASE_URL
// - Neon serverless URLs contain 'neon.tech' - use Neon driver
// - Local/standard PostgreSQL - use standard pg driver
let pool: any = null;
let db: any = null;
let dbInitializing = false;
let dbInitialized = false;
let healthCheckInterval: NodeJS.Timeout | null = null;
let connectionLost = false;
let lastHealthCheck: Date | null = null;
let healthCheckFailed = false;

// Connection pool configuration
interface PoolConfig {
  connectionString: string;
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// Retry configuration
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff: 1s, 2s, 4s, 8s, 16s
const HEALTH_CHECK_INTERVAL_MS = 30000; // 30 seconds

/**
 * Exponential backoff delay calculation
 */
function getRetryDelay(attempt: number): number {
  if (attempt >= RETRY_DELAYS.length) {
    return RETRY_DELAYS[RETRY_DELAYS.length - 1];
  }
  return RETRY_DELAYS[attempt];
}

/**
 * Check if pool is exhausted (all connections in use)
 */
function checkPoolExhaustion(poolInstance: any): void {
  if (!poolInstance) return;

  try {
    // Pool stats vary by driver, try to get common properties
    const totalCount = poolInstance.totalCount || 0;
    const idleCount = poolInstance.idleCount || 0;
    const waitingCount = poolInstance.waitingCount || 0;
    const activeCount = (totalCount - idleCount) || 0;

    // Log pool stats periodically
    if (totalCount > 0) {
      logInfo(`📊 [DB Pool] Active: ${activeCount}, Idle: ${idleCount}, Waiting: ${waitingCount}, Total: ${totalCount}`);
    }

    // Alert if pool is exhausted
    if (waitingCount > 0) {
      logWarn(`⚠️  [DB Pool] Pool exhausted! ${waitingCount} requests waiting for connections`);
    }

    // Alert if all connections are active
    if (activeCount >= totalCount && totalCount > 0) {
      logWarn(`⚠️  [DB Pool] All ${totalCount} connections are active`);
    }
  } catch (error) {
    // Some pool implementations don't expose these stats
    // This is fine, just skip monitoring
  }
}

/**
 * Test database connection with a simple query
 */
async function testConnection(poolInstance: any): Promise<boolean> {
  if (!poolInstance) return false;

  try {
    // Use a simple query that works with both pg and Neon
    const client = await poolInstance.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (error: any) {
    const errorMsg = error?.message || String(error) || 'Unknown error';
    const errorCode = error?.code || 'UNKNOWN';
    const errorStack = error?.stack ? `\nStack: ${error.stack}` : '';
    logError(new Error(`❌ [DB Health] Connection test failed: ${errorMsg} (code: ${errorCode})${errorStack}`));
    return false;
  }
}

/**
 * Create database connection with retry logic
 */
async function createConnection(poolConfig: PoolConfig, isNeon: boolean): Promise<{ pool: any; db: any }> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        logDebug(`🔄 [DB Retry] Attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (isNeon) {
        // Use Neon serverless driver (for Neon cloud databases)
        const neonPackage = await import('@neondatabase/serverless');
        const drizzleNeon = await import('drizzle-orm/neon-serverless');
        const ws = await import("ws");
        
        neonPackage.neonConfig.webSocketConstructor = ws.default;
        const newPool = new neonPackage.Pool(poolConfig);
        
        // Test connection before returning
        const connected = await testConnection(newPool);
        if (!connected) {
          throw new Error("Connection test failed");
        }

        const newDb = drizzleNeon.drizzle({ client: newPool, schema });
        logInfo(`✅ [DB Retry] Database connection initialized (Neon serverless) on attempt ${attempt + 1}`);
        return { pool: newPool, db: newDb };
      } else {
        // Use standard PostgreSQL driver (for local Docker or standard PostgreSQL)
        const pgModule = await import('pg');
        const drizzlePg = await import('drizzle-orm/node-postgres');
        
        const newPool = new pgModule.Pool(poolConfig);
        
        // Test connection before returning
        const connected = await testConnection(newPool);
        if (!connected) {
          throw new Error("Connection test failed");
        }

        const newDb = drizzlePg.drizzle({ client: newPool, schema });
        logInfo(`✅ [DB Retry] Database connection initialized (PostgreSQL) on attempt ${attempt + 1} (max: ${poolConfig.max}, min: ${poolConfig.min})`);
        return { pool: newPool, db: newDb };
      }
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error) || 'Unknown error';
      const errorCode = error?.code || 'UNKNOWN';
      const errorStack = error?.stack ? `\nStack: ${error.stack.substring(0, 500)}` : '';

      logError(new Error(`❌ [DB Retry] Attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS} failed: ${errorMessage} (code: ${errorCode})${errorStack}`));

      // Handle specific error types
      if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
        logError(new Error(`   ⏱️  Connection timeout - database may be unreachable`));
      } else if (errorCode === 'ECONNREFUSED' || errorMessage.includes('refused')) {
        logError(new Error(`   🔌 Connection refused - database may be restarting`));
      } else if (errorCode === 'ENOTFOUND' || errorMessage.includes('ENOTFOUND')) {
        logError(new Error(`   🌐 Network error - host not found`));
      } else if (errorMessage.includes('password') || errorCode === '28P01') {
        logError(new Error(`   🔑 Authentication failed - check credentials`));
        // Don't retry on auth errors
        throw error;
      }
    }
  }

  // All retries exhausted
  const errorMsg = `Failed to connect to database after ${MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message || 'Unknown error'}`;
  logError(new Error(`❌ [DB Retry] ${errorMsg}`));
  throw new Error(errorMsg);
}

/**
 * Initialize database connection with retry logic
 */
async function initializeDatabase() {
  if (dbInitializing || dbInitialized) return;
  dbInitializing = true;

  if (!process.env.DATABASE_URL) {
    logInfo("⚠️  DATABASE_URL not set - using in-memory storage");
    dbInitializing = false;
    return;
  }

  try {
    const dbUrl = process.env.DATABASE_URL;
    const isNeon = dbUrl.includes('neon.tech');
    
    // Connection pool configuration
    const poolConfig: PoolConfig = {
      connectionString: dbUrl,
      max: parseInt(process.env.DB_POOL_MAX || "20"), // Maximum 20 connections
      min: parseInt(process.env.DB_POOL_MIN || "2"), // Minimum 2 connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Increased timeout to 10 seconds for retries
    };

    // Create connection with retry logic
    const { pool: newPool, db: newDb } = await createConnection(poolConfig, isNeon);
    
    pool = newPool;
    db = newDb;
    dbInitialized = true;
    connectionLost = false;
    healthCheckFailed = false;
    lastHealthCheck = new Date();

    // Set up error handlers for the pool
    if (pool) {
      pool.on('error', (err: Error) => {
        logError(new Error(`❌ [DB Pool] Unexpected pool error: ${err.message}`));
        connectionLost = true;
        healthCheckFailed = true;
      });

      // For pg Pool, also listen to connect event errors
      if (pool.on && typeof pool.on === 'function') {
        pool.on('connect', (client: any) => {
          client.on('error', (err: Error) => {
            logError(new Error(`❌ [DB Client] Client error: ${err.message}`));
            connectionLost = true;
            healthCheckFailed = true;
          });
        });
      }
    }

    // Start health check monitoring
    startHealthCheckMonitoring();

    logInfo("✅ [DB] Database connection initialized successfully");
  } catch (error: any) {
    logError(new Error(`❌ [DB] Failed to initialize database: ${error.message}`));
    logInfo("⚠️  Will use in-memory storage instead");
    pool = null;
    db = null;
    dbInitialized = false;
    connectionLost = true;
    healthCheckFailed = true;
  } finally {
    dbInitializing = false;
  }
}

/**
 * Health check monitoring - ping database every 30 seconds
 */
function startHealthCheckMonitoring() {
  // Clear existing interval if any
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }

  healthCheckInterval = setInterval(async () => {
    if (!pool || !db) {
      healthCheckFailed = true;
      connectionLost = true;
      return;
    }

    try {
      const isHealthy = await testConnection(pool);
      lastHealthCheck = new Date();
      
      if (isHealthy) {
        if (healthCheckFailed || connectionLost) {
          logInfo("✅ [DB Health] Connection restored");
          healthCheckFailed = false;
          connectionLost = false;
        }

        // Monitor pool stats
        checkPoolExhaustion(pool);
      } else {
        healthCheckFailed = true;
        connectionLost = true;
        logWarn("⚠️  [DB Health] Connection test failed - attempting reconnect...");
        await attemptReconnect();
      }
    } catch (error: any) {
      healthCheckFailed = true;
      connectionLost = true;
      logError(new Error(`❌ [DB Health] Health check error: ${error.message}`));
      await attemptReconnect();
    }
  }, HEALTH_CHECK_INTERVAL_MS);

  logInfo(`✅ [DB Health] Health check monitoring started (interval: ${HEALTH_CHECK_INTERVAL_MS}ms)`);
}

/**
 * Attempt to reconnect to database
 */
async function attemptReconnect() {
  if (dbInitializing) {
    logInfo("⏳ [DB Reconnect] Reconnection already in progress...");
    return;
  }

  logInfo("🔄 [DB Reconnect] Attempting to reconnect...");

  // Close existing connections
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      // Ignore errors when closing
    }
  }

  pool = null;
  db = null;
  dbInitialized = false;
  dbInitializing = false;

  // Reinitialize
  await initializeDatabase();
}

/**
 * Get database connection health status
 */
export async function getDatabaseHealth(): Promise<{
  connected: boolean;
  lastHealthCheck: Date | null;
  poolStats: {
    total?: number;
    idle?: number;
    active?: number;
    waiting?: number;
  };
}> {
  const poolStats: any = {};
  
  if (pool) {
    try {
      poolStats.total = pool.totalCount || 0;
      poolStats.idle = pool.idleCount || 0;
      poolStats.active = (pool.totalCount || 0) - (pool.idleCount || 0);
      poolStats.waiting = pool.waitingCount || 0;
    } catch (error) {
      // Stats not available
    }
  }

  return {
    connected: dbInitialized && !connectionLost && !healthCheckFailed,
    lastHealthCheck,
    poolStats,
  };
}

// Start initialization immediately (non-blocking)
initializeDatabase().catch((error) => {
  logError(new Error(`❌ [DB] Database initialization error: ${error.message || error}`));
});

export { pool, db };
export type DbType = typeof db;

// Export a function to wait for database to be ready
export async function waitForDatabase(timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (!dbInitialized && !db && (Date.now() - startTime) < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return !!db;
}

/**
 * Close database connections gracefully
 */
export async function closeDatabase(): Promise<void> {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }

  if (pool) {
    try {
      await pool.end();
      logInfo('✅ [DB] Database connections closed');
    } catch (error: any) {
      logError(new Error(`❌ [DB] Error closing database: ${error.message}`));
    }
    pool = null;
    db = null;
    dbInitialized = false;
  }
}

// Cleanup on process exit
process.on('SIGTERM', () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  if (pool) {
    pool.end().catch(() => {});
  }
});

process.on('SIGINT', () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  if (pool) {
    pool.end().catch(() => {});
  }
});
