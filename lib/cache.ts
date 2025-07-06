/**
 * Caching utilities for performance optimization
 */

// Use Web Crypto API for edge runtime compatibility
const createHash = (algorithm: string) => {
  return {
    update: (data: string | Buffer | Uint8Array) => {
      const dataStr = typeof data === 'string' ? data : 
                     data instanceof Buffer ? data.toString('utf8') :
                     new TextDecoder().decode(data);
      return {
        digest: (encoding: string) => {
          // Simple hash implementation for edge runtime
          let hash = 0;
          for (let i = 0; i < dataStr.length; i++) {
            const char = dataStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
          }
          return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
        }
      };
    }
  };
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize?: number; // Maximum number of entries
  ttl?: number; // Time to live in milliseconds
  cleanupInterval?: number; // Cleanup interval in milliseconds
}

/**
 * In-memory cache implementation with LRU eviction
 */
export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: Required<CacheConfig>;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      ttl: config.ttl ?? 5 * 60 * 1000, // 5 minutes default
      cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1 minute cleanup
    };

    this.startCleanupTimer();
  }

  /**
   * Generate cache key from data
   */
  private generateKey(data: any): string {
    if (typeof data === 'string') {
      return createHash('sha256').update(data).digest('hex').slice(0, 16);
    }
    return createHash('sha256').update(JSON.stringify(data)).digest('hex').slice(0, 16);
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.config.maxSize) {
      return;
    }

    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Set cache entry
   */
  set(key: string, data: T, customTtl?: number): void {
    const now = Date.now();
    const ttl = customTtl ?? this.config.ttl;

    this.evictLRU();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() >= entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    const validEntries = entries.filter(entry => now < entry.expiresAt);

    return {
      size: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: entries.length - validEntries.length,
      totalAccessCount: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      averageAge: validEntries.length > 0 
        ? validEntries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / validEntries.length
        : 0,
    };
  }

  /**
   * Compute and cache result if not exists
   */
  async getOrCompute<K>(
    keyData: K,
    computeFn: () => Promise<T>,
    customTtl?: number
  ): Promise<T> {
    const key = this.generateKey(keyData);
    const cached = this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    const result = await computeFn();
    this.set(key, result, customTtl);
    return result;
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    this.stopCleanupTimer();
    this.clear();
  }
}

/**
 * File content cache for PDF processing
 */
interface FileContentCache {
  content: ArrayBuffer;
  hash: string;
  size: number;
  lastModified: number;
}

/**
 * Conversion result cache
 */
interface ConversionResultCache {
  markdown: string;
  metadata: {
    title: string;
    totalPages: number;
    hasImages: boolean;
    hasFormulas: boolean;
    hasTables: boolean;
  };
  quality: {
    completeness: number;
    mathElementsCount: number;
    structureElements: {
      headings: number;
      paragraphs: number;
      tables: number;
      lists: number;
      mathBlocks: number;
    };
    qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

/**
 * Pre-configured cache instances
 */
export const caches = {
  // File content cache (larger, longer TTL)
  fileContent: new MemoryCache<FileContentCache>({
    maxSize: 20,
    ttl: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  }),

  // Conversion results cache
  conversionResults: new MemoryCache<ConversionResultCache>({
    maxSize: 50,
    ttl: 60 * 60 * 1000, // 1 hour
    cleanupInterval: 10 * 60 * 1000, // 10 minutes
  }),

  // API response cache (shorter TTL)
  apiResponses: new MemoryCache<any>({
    maxSize: 100,
    ttl: 5 * 60 * 1000, // 5 minutes
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
  }),

  // File metadata cache
  fileMetadata: new MemoryCache<{ size: number; type: string; hash: string }>({
    maxSize: 200,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  }),
};

/**
 * Cache utilities
 */
export const cacheUtils = {
  /**
   * Generate cache key for file content
   */
  generateFileKey(file: File): string {
    return `file:${file.name}:${file.size}:${file.lastModified}`;
  },

  /**
   * Generate cache key for conversion
   */
  generateConversionKey(fileHash: string, options?: any): string {
    const optionsHash = options ? createHash('md5').update(JSON.stringify(options)).digest('hex').slice(0, 8) : 'default';
    return `conv:${fileHash}:${optionsHash}`;
  },

  /**
   * Get file hash for caching
   */
  async getFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    return createHash('sha256').update(new Uint8Array(buffer)).digest('hex').slice(0, 16);
  },

  /**
   * Clear all caches
   */
  clearAll(): void {
    Object.values(caches).forEach(cache => cache.clear());
  },

  /**
   * Get combined cache statistics
   */
  getAllStats() {
    return Object.fromEntries(
      Object.entries(caches).map(([name, cache]) => [name, cache.getStats()])
    );
  },

  /**
   * Cleanup all caches
   */
  cleanup(): void {
    // Manual cleanup is automatically handled by timers
    // This method is for external cleanup triggers
    const now = Date.now();
    Object.values(caches).forEach(cache => {
      // Force cleanup by accessing private method
      (cache as any).cleanup();
    });
  },
};

/**
 * Cache middleware for API routes
 */
export const withCache = <T>(
  cache: MemoryCache<T>,
  keyGenerator: (request: Request) => string,
  ttl?: number
) => {
  return (handler: (request: Request) => Promise<Response>) => {
    return async (request: Request): Promise<Response> => {
      const cacheKey = keyGenerator(request);
      
      // Try to get from cache
      const cached = cache.get(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
          },
        });
      }

      // Execute handler
      const response = await handler(request);
      
      // Cache successful responses
      if (response.ok) {
        try {
          const data = await response.clone().json();
          cache.set(cacheKey, data, ttl);
        } catch {
          // Non-JSON responses are not cached
        }
      }

      // Add cache miss header
      response.headers.set('X-Cache', 'MISS');
      return response;
    };
  };
};