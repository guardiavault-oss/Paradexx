/**
 * Redis Cache Service
 * Centralized caching layer for API responses and database queries
 * Reduces database load and improves response times
 */

import { createClient, RedisClientType } from 'redis';
import { logInfo, logError } from './logger.js';

let redisClient: RedisClientType | null = null;
let isRedisAvailable = false;

/**
 * Initialize and get Redis client
 * Falls back gracefully if Redis is unavailable
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  // Return cached client if available
  if (redisClient && isRedisAvailable) {
    return redisClient;
  }

  // Redis URL from environment
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_TLS_URL || 'redis://localhost:6379';

  try {
    // Create new Redis client
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logError(new Error('Redis connection failed after 10 retries'), {
              context: 'redis.reconnect',
            });
            isRedisAvailable = false;
            return new Error('Redis unavailable');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 500ms (max)
          return Math.min(retries * 50, 500);
        },
        connectTimeout: 5000,
      },
    });

    // Error handler
    redisClient.on('error', (err) => {
      logError(err, { context: 'redis.error' });
      isRedisAvailable = false;
    });

    // Connection success handler
    redisClient.on('connect', () => {
      logInfo('Redis connected successfully', { url: redisUrl });
      isRedisAvailable = true;
    });

    // Ready handler
    redisClient.on('ready', () => {
      logInfo('Redis client ready');
      isRedisAvailable = true;
    });

    // Reconnecting handler
    redisClient.on('reconnecting', () => {
      logInfo('Redis reconnecting...');
    });

    // Connect to Redis
    await redisClient.connect();

    return redisClient;
  } catch (error) {
    logError(error as Error, {
      context: 'redis.init',
      message: 'Redis unavailable - caching disabled',
    });
    isRedisAvailable = false;
    redisClient = null;
    return null;
  }
}

/**
 * Get value from cache
 * Returns null if key doesn't exist or Redis is unavailable
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable) {
      return null;
    }

    const data = await client.get(key);
    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  } catch (error) {
    logError(error as Error, {
      context: 'cache.get',
      key,
      note: 'Cache miss - will fetch from database',
    });
    return null;
  }
}

/**
 * Set value in cache with expiration
 * @param key Cache key
 * @param value Value to cache (will be JSON stringified)
 * @param expirationSeconds TTL in seconds (default: 5 minutes)
 */
export async function cacheSet(
  key: string,
  value: any,
  expirationSeconds: number = 300
): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable) {
      return; // Gracefully skip caching if Redis unavailable
    }

    await client.setEx(key, expirationSeconds, JSON.stringify(value));
  } catch (error) {
    logError(error as Error, {
      context: 'cache.set',
      key,
      note: 'Failed to cache - continuing without cache',
    });
  }
}

/**
 * Delete specific key from cache
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable) {
      return;
    }

    await client.del(key);
  } catch (error) {
    logError(error as Error, {
      context: 'cache.del',
      key,
    });
  }
}

/**
 * Invalidate all keys matching a pattern
 * Example: cacheInvalidatePattern('user:123:*')
 */
export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable) {
      return;
    }

    // Scan for keys matching pattern
    const keys: string[] = [];
    for await (const key of client.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      keys.push(key);
    }

    // Delete all matching keys
    if (keys.length > 0) {
      await client.del(keys);
      logInfo(`Invalidated ${keys.length} cache keys`, { pattern });
    }
  } catch (error) {
    logError(error as Error, {
      context: 'cache.invalidatePattern',
      pattern,
    });
  }
}

/**
 * Get or set cached value with callback
 * If key exists, return cached value
 * If key doesn't exist, execute callback and cache result
 *
 * @param key Cache key
 * @param fetchFn Function to fetch data if not cached
 * @param expirationSeconds TTL in seconds (default: 5 minutes)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expirationSeconds: number = 300
): Promise<T> {
  // Try to get from cache
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  const data = await fetchFn();

  // Cache the result
  await cacheSet(key, data, expirationSeconds);

  return data;
}

/**
 * Increment a counter in cache
 * Useful for rate limiting
 */
export async function cacheIncrement(
  key: string,
  expirationSeconds?: number
): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client || !isRedisAvailable) {
      return 0;
    }

    const value = await client.incr(key);

    // Set expiration on first increment
    if (value === 1 && expirationSeconds) {
      await client.expire(key, expirationSeconds);
    }

    return value;
  } catch (error) {
    logError(error as Error, {
      context: 'cache.increment',
      key,
    });
    return 0;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisReady(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Disconnect from Redis
 * Call this during graceful shutdown
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logInfo('Redis disconnected');
    } catch (error) {
      logError(error as Error, { context: 'redis.disconnect' });
    } finally {
      redisClient = null;
      isRedisAvailable = false;
    }
  }
}

/**
 * Generate cache key with namespace
 * Example: getCacheKey('user', '123', 'vaults') => 'guardia:user:123:vaults'
 */
export function getCacheKey(...parts: (string | number)[]): string {
  return `guardia:${parts.join(':')}`;
}
