/**
 * Redis client service
 *
 * This module provides a centralized Redis client for session storage and caching.
 * If REDIS_URL is not configured, all functions will return null or no-op.
 */

import type { Redis } from "ioredis";
import { logInfo, logError } from "./logger";

let redisClientInstance: Redis | null = null;

/**
 * Get or create a Redis client instance
 * Returns null if Redis is not configured
 */
export async function getRedisClient(): Promise<Redis | null> {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (redisClientInstance) {
    return redisClientInstance;
  }

  try {
    // Dynamic import to avoid build errors if ioredis isn't installed
    const RedisModule = await import("ioredis");
    const RedisConstructor = RedisModule.default || RedisModule;

    redisClientInstance = new RedisConstructor(process.env.REDIS_URL, {
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    redisClientInstance.on("error", (err: Error) => {
      logError(err, { context: 'redisClient.connection' });
    });

    redisClientInstance.on("connect", () => {
      logInfo('Redis connected successfully', { context: 'redisClient.connection' });
    });

    return redisClientInstance;
  } catch (error) {
    logError(error as Error, { context: 'getRedisClient' });
    return null;
  }
}

/**
 * Close Redis connection gracefully
 * Used during server shutdown
 */
export async function closeRedis(): Promise<void> {
  if (!redisClientInstance) return;

  try {
    await redisClientInstance.quit();
    redisClientInstance = null;
    logInfo('Redis connection closed', { context: 'closeRedis' });
  } catch (error) {
    logError(error as Error, { context: 'closeRedis' });
    try {
      redisClientInstance.disconnect();
      redisClientInstance = null;
    } catch {
      // ignore disconnect errors
    }
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!process.env.REDIS_URL) return false;

  const client = await getRedisClient();
  if (!client) return false;

  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

