import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, rateLimiters, createRateLimitHeaders, withRateLimit } from '@/lib/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockRequest: Request;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 3,
    });

    mockRequest = new Request('http://localhost:3000/api/test', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    });

    // Clear any existing rate limit data
    vi.clearAllTimers();
  });

  it('should allow requests within limit', () => {
    const result1 = rateLimiter.check(mockRequest);
    const result2 = rateLimiter.check(mockRequest);
    const result3 = rateLimiter.check(mockRequest);

    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);
    
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);
    
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it('should block requests exceeding limit', () => {
    // Use up the limit
    rateLimiter.check(mockRequest);
    rateLimiter.check(mockRequest);
    rateLimiter.check(mockRequest);

    // Fourth request should be blocked
    const result = rateLimiter.check(mockRequest);
    
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should reset after time window', () => {
    const shortLimiter = new RateLimiter({
      windowMs: 100, // 100ms window
      maxRequests: 1,
    });

    // First request should succeed
    const result1 = shortLimiter.check(mockRequest);
    expect(result1.success).toBe(true);

    // Second request should fail
    const result2 = shortLimiter.check(mockRequest);
    expect(result2.success).toBe(false);

    // Wait for window to reset
    vi.advanceTimersByTime(150);

    // Third request should succeed after reset
    const result3 = shortLimiter.check(mockRequest);
    expect(result3.success).toBe(true);
  });

  it('should use custom key generator', () => {
    const customLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 1,
      keyGenerator: () => 'custom-key',
    });

    const request1 = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' },
    });

    const request2 = new Request('http://localhost:3000/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' },
    });

    // Both requests should be counted under the same key
    const result1 = customLimiter.check(request1);
    const result2 = customLimiter.check(request2);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false); // Same key, so blocked
  });

  it('should reset specific key', () => {
    // Use up the limit
    rateLimiter.check(mockRequest);
    rateLimiter.check(mockRequest);
    rateLimiter.check(mockRequest);

    // Fourth request should be blocked
    const blockedResult = rateLimiter.check(mockRequest);
    expect(blockedResult.success).toBe(false);

    // Reset the key
    rateLimiter.reset(mockRequest);

    // Next request should succeed
    const result = rateLimiter.check(mockRequest);
    expect(result.success).toBe(true);
  });
});

describe('createRateLimitHeaders', () => {
  it('should create correct headers for successful request', () => {
    const result = {
      success: true,
      limit: 10,
      remaining: 7,
      resetTime: 1640995200000, // Jan 1, 2022
    };

    const headers = createRateLimitHeaders(result);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('7');
    expect(headers['X-RateLimit-Reset']).toBe('1640995200');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('should create correct headers for blocked request', () => {
    const result = {
      success: false,
      limit: 10,
      remaining: 0,
      resetTime: 1640995200000,
      retryAfter: 300,
    };

    const headers = createRateLimitHeaders(result);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['X-RateLimit-Reset']).toBe('1640995200');
    expect(headers['Retry-After']).toBe('300');
  });
});

describe('withRateLimit', () => {
  it('should allow requests within limit', async () => {
    const mockHandler = vi.fn().mockResolvedValue(
      new Response('success', { status: 200 })
    );

    const limitedHandler = withRateLimit(
      new RateLimiter({ windowMs: 60000, maxRequests: 5 }),
      mockHandler
    );

    const response = await limitedHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
  });

  it('should block requests exceeding limit', async () => {
    const limitedLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 1 });
    const mockHandler = vi.fn().mockResolvedValue(
      new Response('success', { status: 200 })
    );

    const limitedHandler = withRateLimit(limitedLimiter, mockHandler);

    // First request should succeed
    const response1 = await limitedHandler(mockRequest);
    expect(response1.status).toBe(200);

    // Second request should be blocked
    const response2 = await limitedHandler(mockRequest);
    expect(response2.status).toBe(429);
    expect(mockHandler).toHaveBeenCalledTimes(1); // Handler not called second time

    const errorData = await response2.json();
    expect(errorData.error).toBe('Rate limit exceeded');
  });

  it('should add rate limit headers to error responses', async () => {
    const mockHandler = vi.fn().mockRejectedValue(new Error('Server error'));

    const limitedHandler = withRateLimit(
      new RateLimiter({ windowMs: 60000, maxRequests: 5 }),
      mockHandler
    );

    const response = await limitedHandler(mockRequest);

    expect(response.status).toBe(500);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('4');
  });
});

describe('predefined rate limiters', () => {
  it('should have conversion rate limiter', () => {
    expect(rateLimiters.conversion).toBeInstanceOf(RateLimiter);
    
    const result = rateLimiters.conversion.check(mockRequest);
    expect(result.limit).toBe(10); // As defined in the implementation
  });

  it('should have API rate limiter', () => {
    expect(rateLimiters.api).toBeInstanceOf(RateLimiter);
    
    const result = rateLimiters.api.check(mockRequest);
    expect(result.limit).toBe(60); // As defined in the implementation
  });

  it('should have upload rate limiter', () => {
    expect(rateLimiters.upload).toBeInstanceOf(RateLimiter);
    
    const result = rateLimiters.upload.check(mockRequest);
    expect(result.limit).toBe(20); // As defined in the implementation
  });
});