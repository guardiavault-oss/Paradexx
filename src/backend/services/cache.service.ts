// Redis Caching Service

import Redis from 'ioredis';
import { logger } from '../services/logger.service';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Flag to track if we've already logged the Redis unavailable message
let redisErrorLogged = false;

export class CacheService {
  private redis: Redis | null = null;
  private defaultTTL = 300; // 5 minutes
  private isAvailable = false;

  constructor() {
    // Skip Redis connection attempts if no REDIS_URL configured
    if (!process.env.REDIS_URL) {
      if (!redisErrorLogged) {
        logger.info('ℹ️  Redis not configured - caching disabled (optional)');
        redisErrorLogged = true;
      }
      return;
    }

    this.redis = new Redis(REDIS_URL, {
      retryStrategy: () => null, // Don't retry - Redis is optional
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
    });

    this.redis.on('connect', () => {
      this.isAvailable = true;
      logger.info('✅ Redis connected');
    });

    this.redis.on('error', () => {
      this.isAvailable = false;
      // Only log once
      if (!redisErrorLogged) {
        logger.warn('⚠️  Redis not available - caching disabled (optional)');
        redisErrorLogged = true;
      }
    });

    // Try to connect, but don't fail if unavailable
    this.redis.connect().catch(() => {
      if (!redisErrorLogged) {
        logger.warn('⚠️  Redis connection failed - continuing without cache');
        redisErrorLogged = true;
      }
    });
  }

  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    try {
      // Check if Redis is connected
      if (!this.redis || this.redis.status !== 'ready') {
        return null; // Return null if Redis not available
      }
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set value in cache
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      // Check if Redis is connected
      if (!this.redis || this.redis.status !== 'ready') {
        return; // Silently fail if Redis not available
      }
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;
      
      await this.redis.setex(key, expiry, serialized);
    } catch (error) {
      // Silently fail if Redis not available
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  // Delete from cache
  async del(key: string): Promise<void> {
    try {
      if (!this.redis || !this.isAvailable) return;
      await this.redis.del(key);
    } catch (error) {
      // Silent fail for optional cache
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis || !this.isAvailable) return false;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  // Get or set (lazy loading)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate value
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttl);

    return value;
  }

  // Increment counter
  async incr(key: string): Promise<number> {
    try {
      if (!this.redis || !this.isAvailable) return 0;
      return await this.redis.incr(key);
    } catch (error) {
      return 0;
    }
  }

  // Set with expiry
  async setex(key: string, seconds: number, value: any): Promise<void> {
    try {
      if (!this.redis || !this.isAvailable) return;
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, seconds, serialized);
    } catch (error) {
      // Silent fail for optional cache
    }
  }

  // Get multiple keys
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.redis || !this.isAvailable) return keys.map(() => null);
      const values = await this.redis.mget(...keys);
      return values.map(v => v ? JSON.parse(v) as T : null);
    } catch (error) {
      return keys.map(() => null);
    }
  }

  // Set multiple keys
  async mset(items: Record<string, any>, ttl?: number): Promise<void> {
    try {
      if (!this.redis || !this.isAvailable) return;
      const pipeline = this.redis.pipeline();
      
      for (const [key, value] of Object.entries(items)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      // Silent fail for optional cache
    }
  }

  // Delete pattern
  async delPattern(pattern: string): Promise<number> {
    try {
      if (!this.redis || !this.isAvailable) return 0;
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      return 0;
    }
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    try {
      if (!this.redis || !this.isAvailable) return -1;
      return await this.redis.ttl(key);
    } catch (error) {
      return -1;
    }
  }

  // Flush all cache
  async flushAll(): Promise<void> {
    try {
      if (!this.redis || !this.isAvailable) return;
      await this.redis.flushall();
      logger.info('Cache flushed');
    } catch (error) {
      // Silent fail for optional cache
    }
  }

  // Close connection
  async disconnect(): Promise<void> {
    if (!this.redis) return;
    await this.redis.quit();
  }
}

// Cache key builders
export const CacheKeys = {
  // Token prices
  tokenPrice: (address: string, chainId: number) => 
    `price:token:${chainId}:${address.toLowerCase()}`,
  
  // Gas prices
  gasPrice: (chainId: number) => `gas:${chainId}`,
  
  // Token metadata
  tokenMetadata: (address: string, chainId: number) =>
    `metadata:token:${chainId}:${address.toLowerCase()}`,
  
  // NFT metadata
  nftMetadata: (address: string, tokenId: string) =>
    `metadata:nft:${address.toLowerCase()}:${tokenId}`,
  
  // User balance
  userBalance: (userId: string, chainId: number) =>
    `balance:user:${userId}:${chainId}`,
  
  // Rug check result
  rugCheck: (address: string, chainId: number) =>
    `rug:${chainId}:${address.toLowerCase()}`,
  
  // Whale info
  whaleInfo: (address: string) =>
    `whale:${address.toLowerCase()}`,
  
  // Transaction
  transaction: (hash: string) =>
    `tx:${hash.toLowerCase()}`,
  
  // Rate limit
  rateLimit: (userId: string, endpoint: string) =>
    `ratelimit:${userId}:${endpoint}`,
};

// Export singleton
export const cacheService = new CacheService();
