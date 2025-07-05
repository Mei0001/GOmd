/**
 * Rate limiting utilities for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Default key generator using IP address
 */
const defaultKeyGenerator = (request: Request): string => {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || 'unknown';
  return `ip:${ip}`;
};

/**
 * Clean up expired entries from the store
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: defaultKeyGenerator,
      ...config,
    };
  }

  /**
   * Check if request is within rate limit
   */
  check(request: Request): RateLimitResult {
    const key = this.config.keyGenerator(request);
    const now = Date.now();
    const resetTime = now + this.config.windowMs;

    // Clean up expired entries periodically
    if (Math.random() < 0.1) {
      cleanupExpiredEntries();
    }

    const existing = rateLimitStore.get(key);

    if (!existing || now >= existing.resetTime) {
      // First request or expired window
      rateLimitStore.set(key, {
        count: 1,
        resetTime,
      });

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime,
      };
    }

    if (existing.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.config.maxRequests,
        remaining: 0,
        resetTime: existing.resetTime,
        retryAfter: Math.ceil((existing.resetTime - now) / 1000),
      };
    }

    // Increment count
    existing.count++;
    rateLimitStore.set(key, existing);

    return {
      success: true,
      limit: this.config.maxRequests,
      remaining: this.config.maxRequests - existing.count,
      resetTime: existing.resetTime,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(request: Request): void {
    const key = this.config.keyGenerator(request);
    rateLimitStore.delete(key);
  }
}

/**
 * Create response headers for rate limiting
 */
export const createRateLimitHeaders = (result: RateLimitResult): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
};

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  // Strict rate limiting for conversion API
  conversion: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 conversions per 15 minutes
  }),

  // General API rate limiting
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  }),

  // File upload rate limiting
  upload: new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20, // 20 uploads per 5 minutes
  }),
};

/**
 * Middleware helper for Next.js API routes
 */
export const withRateLimit = (
  limiter: RateLimiter,
  handler: (request: Request) => Promise<Response>
) => {
  return async (request: Request): Promise<Response> => {
    const result = limiter.check(request);
    const headers = createRateLimitHeaders(result);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );
    }

    try {
      const response = await handler(request);
      
      // Add rate limit headers to successful responses
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      // Add rate limit headers to error responses
      const errorResponse = new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      );

      return errorResponse;
    }
  };
};