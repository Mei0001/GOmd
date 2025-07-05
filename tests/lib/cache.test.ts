import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache, caches, cacheUtils } from '@/lib/cache';

describe('MemoryCache', () => {
  let cache: MemoryCache<string>;

  beforeEach(() => {
    cache = new MemoryCache<string>({
      maxSize: 3,
      ttl: 1000, // 1 second
      cleanupInterval: 500,
    });
  });

  it('should store and retrieve values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('should handle TTL expiration', async () => {
    cache.set('key1', 'value1', 100); // 100ms TTL
    expect(cache.get('key1')).toBe('value1');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(cache.get('key1')).toBeNull();
  });

  it('should evict LRU when cache is full', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Access key1 to make it recently used
    cache.get('key1');
    
    // Add key4, should evict key2 (least recently used)
    cache.set('key4', 'value4');
    
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBeNull(); // Evicted
    expect(cache.get('key3')).toBe('value3');
    expect(cache.get('key4')).toBe('value4');
  });

  it('should check if key exists', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('should delete keys', () => {
    cache.set('key1', 'value1');
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeNull();
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should provide cache statistics', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.validEntries).toBe(2);
    expect(stats.expiredEntries).toBe(0);
  });

  it('should compute and cache values', async () => {
    const computeFn = vi.fn().mockResolvedValue('computed-value');
    
    // First call should compute
    const result1 = await cache.getOrCompute('key1', computeFn);
    expect(result1).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    const result2 = await cache.getOrCompute('key1', computeFn);
    expect(result2).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1); // Not called again
  });
});

describe('cacheUtils', () => {
  it('should generate consistent file keys', () => {
    const mockFile1 = new File(['content'], 'test.pdf', { 
      type: 'application/pdf',
      lastModified: 1234567890 
    });
    const mockFile2 = new File(['content'], 'test.pdf', { 
      type: 'application/pdf',
      lastModified: 1234567890 
    });
    
    const key1 = cacheUtils.generateFileKey(mockFile1);
    const key2 = cacheUtils.generateFileKey(mockFile2);
    
    expect(key1).toBe(key2);
    expect(key1).toContain('test.pdf');
  });

  it('should generate conversion keys', () => {
    const fileHash = 'abc123';
    const key1 = cacheUtils.generateConversionKey(fileHash);
    const key2 = cacheUtils.generateConversionKey(fileHash, { option: 'value' });
    
    expect(key1).toContain('conv:abc123');
    expect(key2).toContain('conv:abc123');
    expect(key1).not.toBe(key2); // Different options should create different keys
  });

  it('should generate file hash', async () => {
    const mockFile = new File(['test content'], 'test.pdf');
    const hash = await cacheUtils.getFileHash(mockFile);
    
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(16); // Truncated hash length
  });

  it('should clear all caches', () => {
    caches.fileContent.set('test', { 
      content: new ArrayBuffer(0), 
      hash: 'test', 
      size: 0, 
      lastModified: Date.now() 
    });
    caches.conversionResults.set('test', { 
      markdown: 'test', 
      metadata: { 
        title: 'test', 
        totalPages: 1, 
        hasImages: false, 
        hasFormulas: false, 
        hasTables: false 
      }, 
      quality: { 
        score: 1, 
        confidence: 1, 
        issues: [] 
      } 
    });
    
    cacheUtils.clearAll();
    
    expect(caches.fileContent.get('test')).toBeNull();
    expect(caches.conversionResults.get('test')).toBeNull();
  });

  it('should get combined stats', () => {
    const stats = cacheUtils.getAllStats();
    
    expect(stats).toHaveProperty('fileContent');
    expect(stats).toHaveProperty('conversionResults');
    expect(stats).toHaveProperty('apiResponses');
    expect(stats).toHaveProperty('fileMetadata');
  });
});