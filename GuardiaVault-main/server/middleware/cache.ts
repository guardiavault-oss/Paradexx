/**
 * Cache Middleware
 * Caches API responses to reduce database load and improve response times
 */

import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet, getCacheKey } from '../services/cache.js';
import { logInfo } from '../services/logger.js';

export interface CacheOptions {
  /** Cache duration in seconds (default: 5 minutes) */
  duration?: number;
  /** Custom cache key generator */
  keyGenerator?: (req: Request) => string;
  /** Whether to cache per user (uses session userId) */
  perUser?: boolean;
  /** Skip caching based on request condition */
  skip?: (req: Request) => boolean;
}

/**
 * Cache middleware for GET requests
 * Caches response data and serves from cache on subsequent requests
 *
 * @param options Cache configuration options
 * @returns Express middleware
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  const {
    duration = 300, // 5 minutes default
    keyGenerator,
    perUser = false,
    skip,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if condition is met
    if (skip && skip(req)) {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey: string;
      if (keyGenerator) {
        cacheKey = keyGenerator(req);
      } else {
        // Default key generation
        const userId = perUser && req.session ? (req.session as any).userId : 'public';
        cacheKey = getCacheKey('api', userId, req.originalUrl || req.url);
      }

      // Try to get from cache
      const cachedData = await cacheGet(cacheKey);

      if (cachedData) {
        logInfo('Cache hit', {
          key: cacheKey,
          path: req.originalUrl || req.url,
        });

        // Add cache header
        res.setHeader('X-Cache', 'HIT');

        return res.json(cachedData);
      }

      // Cache miss - capture response data
      const originalJson = res.json.bind(res);

      res.json = function (data: any): Response {
        // Cache the response data (fire and forget)
        cacheSet(cacheKey, data, duration).catch(() => {
          // Silently fail - caching is not critical
        });

        // Add cache header
        res.setHeader('X-Cache', 'MISS');

        logInfo('Cache miss - caching response', {
          key: cacheKey,
          path: req.originalUrl || req.url,
          duration,
        });

        return originalJson(data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
}

/**
 * Specific cache middleware for user-specific data
 * Caches per authenticated user
 */
export function userCacheMiddleware(durationSeconds: number = 300) {
  return cacheMiddleware({
    duration: durationSeconds,
    perUser: true,
    // Skip caching if user is not authenticated
    skip: (req) => {
      const session = req.session as any;
      return !session || !session.userId;
    },
  });
}

/**
 * Short-lived cache for frequently accessed data
 * Cache for 1 minute
 */
export function shortCacheMiddleware() {
  return cacheMiddleware({ duration: 60 });
}

/**
 * Long-lived cache for rarely changing data
 * Cache for 1 hour
 */
export function longCacheMiddleware() {
  return cacheMiddleware({ duration: 3600 });
}

/**
 * Create a cache invalidation middleware
 * Invalidates cache keys matching a pattern after mutation
 *
 * @param patterns Cache key patterns to invalidate
 * @returns Express middleware
 */
export function cacheInvalidationMiddleware(patterns: string | string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (data: any): Response {
      // Only invalidate cache on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns (fire and forget)
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];

        (async () => {
          const { cacheInvalidatePattern } = await import('../services/cache.js');
          for (const pattern of patternArray) {
            await cacheInvalidatePattern(pattern);
          }
        })().catch(() => {
          // Silently fail - cache invalidation is not critical
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Create user-specific cache invalidation middleware
 * Invalidates cache for the authenticated user
 *
 * @param resource Resource name (e.g., 'vaults', 'guardians')
 * @returns Express middleware
 */
export function userCacheInvalidationMiddleware(resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as any;
    if (!session || !session.userId) {
      return next();
    }

    const userId = session.userId;
    const pattern = getCacheKey('api', userId, `*${resource}*`);

    return cacheInvalidationMiddleware(pattern)(req, res, next);
  };
}
