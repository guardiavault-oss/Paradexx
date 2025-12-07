/**
 * Cache Management System
 * Supports localStorage, sessionStorage, and in-memory cache
 */

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  storage?: 'local' | 'session' | 'memory';
  prefix?: string;
}

interface CacheItem<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private prefix: string = 'paradox_';

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
  }

  /**
   * Set a value in cache
   */
  set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): void {
    const {
      ttl = 1000 * 60 * 60, // Default 1 hour
      storage = 'memory',
      prefix = this.prefix,
    } = options;

    const cacheItem: CacheItem<T> = {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    };

    const fullKey = `${prefix}${key}`;

    try {
      if (storage === 'local') {
        localStorage.setItem(fullKey, JSON.stringify(cacheItem));
      } else if (storage === 'session') {
        sessionStorage.setItem(fullKey, JSON.stringify(cacheItem));
      } else {
        this.memoryCache.set(fullKey, cacheItem);
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Fallback to memory cache
      this.memoryCache.set(fullKey, cacheItem);
    }
  }

  /**
   * Get a value from cache
   */
  get<T>(
    key: string,
    options: Pick<CacheOptions, 'storage' | 'prefix'> = {}
  ): T | null {
    const {
      storage = 'memory',
      prefix = this.prefix,
    } = options;

    const fullKey = `${prefix}${key}`;

    try {
      let cacheItem: CacheItem<T> | null = null;

      if (storage === 'local') {
        const item = localStorage.getItem(fullKey);
        if (item) cacheItem = JSON.parse(item);
      } else if (storage === 'session') {
        const item = sessionStorage.getItem(fullKey);
        if (item) cacheItem = JSON.parse(item);
      } else {
        cacheItem = this.memoryCache.get(fullKey) || null;
      }

      if (!cacheItem) return null;

      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        this.delete(key, { storage, prefix });
        return null;
      }

      return cacheItem.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  delete(
    key: string,
    options: Pick<CacheOptions, 'storage' | 'prefix'> = {}
  ): void {
    const {
      storage = 'memory',
      prefix = this.prefix,
    } = options;

    const fullKey = `${prefix}${key}`;

    try {
      if (storage === 'local') {
        localStorage.removeItem(fullKey);
      } else if (storage === 'session') {
        sessionStorage.removeItem(fullKey);
      } else {
        this.memoryCache.delete(fullKey);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear(
    options: Pick<CacheOptions, 'storage' | 'prefix'> = {}
  ): void {
    const {
      storage = 'memory',
      prefix = this.prefix,
    } = options;

    try {
      if (storage === 'local') {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        });
      } else if (storage === 'session') {
        const keys = Object.keys(sessionStorage);
        keys.forEach((key) => {
          if (key.startsWith(prefix)) {
            sessionStorage.removeItem(key);
          }
        });
      } else {
        const keys = Array.from(this.memoryCache.keys());
        keys.forEach((key) => {
          if (key.startsWith(prefix)) {
            this.memoryCache.delete(key);
          }
        });
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Check if key exists and is not expired
   */
  has(
    key: string,
    options: Pick<CacheOptions, 'storage' | 'prefix'> = {}
  ): boolean {
    return this.get(key, options) !== null;
  }

  /**
   * Get cache size
   */
  size(storage: 'local' | 'session' | 'memory' = 'memory'): number {
    try {
      if (storage === 'memory') {
        return this.memoryCache.size;
      } else {
        const store = storage === 'local' ? localStorage : sessionStorage;
        return Object.keys(store).filter((key) =>
          key.startsWith(this.prefix)
        ).length;
      }
    } catch {
      return 0;
    }
  }

  /**
   * Get all keys
   */
  keys(storage: 'local' | 'session' | 'memory' = 'memory'): string[] {
    try {
      if (storage === 'memory') {
        return Array.from(this.memoryCache.keys()).map((key) =>
          key.replace(this.prefix, '')
        );
      } else {
        const store = storage === 'local' ? localStorage : sessionStorage;
        return Object.keys(store)
          .filter((key) => key.startsWith(this.prefix))
          .map((key) => key.replace(this.prefix, ''));
      }
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const cache = new CacheManager();

// Specific cache instances
export const walletCache = new CacheManager('paradox_wallet_');
export const transactionCache = new CacheManager('paradox_tx_');
export const tokenCache = new CacheManager('paradox_token_');
export const nftCache = new CacheManager('paradox_nft_');

// Helper functions
export const cacheHelpers = {
  /**
   * Cache with automatic JSON serialization
   */
  setJSON: <T>(key: string, value: T, options?: CacheOptions) => {
    cache.set(key, value, options);
  },

  getJSON: <T>(key: string, options?: Pick<CacheOptions, 'storage' | 'prefix'>): T | null => {
    return cache.get<T>(key, options);
  },

  /**
   * Memoize a function with cache
   */
  memoize: <T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ) => {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      const cached = cache.get(key, options);
      
      if (cached !== null) {
        return cached as ReturnType<T>;
      }

      const result = fn(...args);
      cache.set(key, result, options);
      return result as ReturnType<T>;
    }) as T;
  },

  /**
   * Cache async function result
   */
  asyncMemoize: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    options?: CacheOptions
  ) => {
    return (async (...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      const cached = cache.get(key, options);
      
      if (cached !== null) {
        return cached as ReturnType<T>;
      }

      const result = await fn(...args);
      cache.set(key, result, options);
      return result as ReturnType<T>;
    }) as T;
  },
};

// Cleanup expired cache on load
if (typeof window !== 'undefined') {
  // Clean up expired items every 5 minutes
  setInterval(() => {
    ['local', 'session'].forEach((storage) => {
      const keys = cache.keys(storage as 'local' | 'session');
      keys.forEach((key) => {
        cache.get(key, { storage: storage as 'local' | 'session' });
      });
    });
  }, 5 * 60 * 1000);
}
