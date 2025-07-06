/**
 * Memory optimization utilities
 */

/**
 * Memory usage tracking
 */
export class MemoryTracker {
  private snapshots: { timestamp: number; usage: NodeJS.MemoryUsage }[] = [];

  /**
   * Take a memory snapshot
   */
  snapshot(label?: string): NodeJS.MemoryUsage {
    const usage = process.memoryUsage();
    this.snapshots.push({ timestamp: Date.now(), usage });
    
    if (label) {
      console.log(`[Memory ${label}]`, {
        rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(usage.external / 1024 / 1024)} MB`,
      });
    }

    return usage;
  }

  /**
   * Get memory usage difference
   */
  getDiff(beforeLabel?: string): { diff: NodeJS.MemoryUsage; current: NodeJS.MemoryUsage } {
    const current = process.memoryUsage();
    const before = this.snapshots[this.snapshots.length - 1]?.usage || current;

    const diff = {
      rss: current.rss - before.rss,
      heapUsed: current.heapUsed - before.heapUsed,
      heapTotal: current.heapTotal - before.heapTotal,
      external: current.external - before.external,
      arrayBuffers: current.arrayBuffers - before.arrayBuffers,
    };

    if (beforeLabel) {
      console.log(`[Memory Diff ${beforeLabel}]`, {
        rss: `${diff.rss > 0 ? '+' : ''}${Math.round(diff.rss / 1024 / 1024)} MB`,
        heapUsed: `${diff.heapUsed > 0 ? '+' : ''}${Math.round(diff.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${diff.heapTotal > 0 ? '+' : ''}${Math.round(diff.heapTotal / 1024 / 1024)} MB`,
        external: `${diff.external > 0 ? '+' : ''}${Math.round(diff.external / 1024 / 1024)} MB`,
      });
    }

    return { diff, current };
  }

  /**
   * Clear old snapshots
   */
  cleanup(maxAge = 5 * 60 * 1000): void {
    const cutoff = Date.now() - maxAge;
    this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff);
  }
}

/**
 * Global memory tracker instance
 */
export const memoryTracker = new MemoryTracker();

/**
 * Memory optimization for large files
 */
export class FileBuffer {
  private buffer: ArrayBuffer | null = null;
  private size: number = 0;
  private lastAccessed: number = Date.now();

  constructor(private maxSize: number = 50 * 1024 * 1024) {} // 50MB default

  /**
   * Load file data with memory checks
   */
  async load(file: File): Promise<ArrayBuffer> {
    if (file.size > this.maxSize) {
      throw new Error(`File too large: ${file.size} bytes (max: ${this.maxSize})`);
    }

    // Check available memory
    const memBefore = process.memoryUsage();
    const availableMemory = 2 * 1024 * 1024 * 1024 - memBefore.heapUsed; // 2GB limit

    if (file.size > availableMemory * 0.5) {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    try {
      this.buffer = await file.arrayBuffer();
      this.size = this.buffer.byteLength;
      this.lastAccessed = Date.now();
      return this.buffer;
    } catch (error) {
      this.clear();
      throw new Error(`Failed to load file: ${error}`);
    }
  }

  /**
   * Get buffer with access tracking
   */
  get(): ArrayBuffer | null {
    if (this.buffer) {
      this.lastAccessed = Date.now();
    }
    return this.buffer;
  }

  /**
   * Clear buffer from memory
   */
  clear(): void {
    this.buffer = null;
    this.size = 0;
    
    // Suggest garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Check if buffer should be evicted
   */
  shouldEvict(maxAge: number = 10 * 60 * 1000): boolean {
    return Date.now() - this.lastAccessed > maxAge;
  }

  /**
   * Get buffer info
   */
  getInfo() {
    return {
      hasBuffer: this.buffer !== null,
      size: this.size,
      lastAccessed: this.lastAccessed,
      ageMs: Date.now() - this.lastAccessed,
    };
  }
}

/**
 * Streaming buffer for large file processing
 */
export class StreamingBuffer {
  private chunks: Uint8Array[] = [];
  private totalSize: number = 0;
  private maxChunkSize: number;
  private maxTotalSize: number;

  constructor(
    maxChunkSize: number = 1024 * 1024, // 1MB chunks
    maxTotalSize: number = 100 * 1024 * 1024 // 100MB total
  ) {
    this.maxChunkSize = maxChunkSize;
    this.maxTotalSize = maxTotalSize;
  }

  /**
   * Add chunk to buffer
   */
  addChunk(chunk: Uint8Array): void {
    if (this.totalSize + chunk.length > this.maxTotalSize) {
      throw new Error(`Buffer overflow: ${this.totalSize + chunk.length} > ${this.maxTotalSize}`);
    }

    this.chunks.push(chunk);
    this.totalSize += chunk.length;
  }

  /**
   * Get all data as single buffer
   */
  getBuffer(): ArrayBuffer {
    const result = new Uint8Array(this.totalSize);
    let offset = 0;

    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result.buffer;
  }

  /**
   * Process chunks with callback
   */
  processChunks<T>(processor: (chunk: Uint8Array, index: number) => T): T[] {
    return this.chunks.map(processor);
  }

  /**
   * Clear all chunks
   */
  clear(): void {
    this.chunks.length = 0;
    this.totalSize = 0;
    
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      chunkCount: this.chunks.length,
      totalSize: this.totalSize,
      maxChunkSize: this.maxChunkSize,
      maxTotalSize: this.maxTotalSize,
      averageChunkSize: this.chunks.length > 0 ? this.totalSize / this.chunks.length : 0,
    };
  }
}

/**
 * Memory monitoring middleware
 */
export const withMemoryMonitoring = (
  handler: (request: Request) => Promise<Response>,
  options: { logMemory?: boolean; forceGC?: boolean } = {}
) => {
  return async (request: Request): Promise<Response> => {
    const tracker = new MemoryTracker();
    
    if (options.logMemory) {
      tracker.snapshot('request-start');
    }

    try {
      const response = await handler(request);

      if (options.logMemory) {
        tracker.getDiff('request-complete');
      }

      return response;
    } catch (error) {
      if (options.logMemory) {
        tracker.getDiff('request-error');
      }
      throw error;
    } finally {
      if (options.forceGC && global.gc) {
        global.gc();
      }
    }
  };
};

/**
 * File processing with memory optimization
 */
export const processFileWithMemoryControl = async <T>(
  file: File,
  processor: (buffer: ArrayBuffer) => Promise<T>,
  options: {
    maxFileSize?: number;
    enableGC?: boolean;
    trackMemory?: boolean;
  } = {}
): Promise<T> => {
  const { maxFileSize = 50 * 1024 * 1024, enableGC = true, trackMemory = false } = options;
  
  let tracker: MemoryTracker | undefined;
  if (trackMemory) {
    tracker = new MemoryTracker();
    tracker.snapshot('file-process-start');
  }

  // Check file size
  if (file.size > maxFileSize) {
    throw new Error(`File too large: ${Math.round(file.size / 1024 / 1024)}MB (max: ${Math.round(maxFileSize / 1024 / 1024)}MB)`);
  }

  const fileBuffer = new FileBuffer(maxFileSize);
  
  try {
    const buffer = await fileBuffer.load(file);
    
    if (tracker) {
      tracker.getDiff('file-loaded');
    }

    const result = await processor(buffer);
    
    if (tracker) {
      tracker.getDiff('processing-complete');
    }

    return result;
  } finally {
    fileBuffer.clear();
    
    if (enableGC && global.gc) {
      global.gc();
    }
    
    if (tracker) {
      tracker.getDiff('cleanup-complete');
    }
  }
};

/**
 * Memory usage utilities
 */
export const memoryUtils = {
  /**
   * Format bytes to human readable
   */
  formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  },

  /**
   * Get current memory usage summary
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: this.formatBytes(usage.rss),
      heapUsed: this.formatBytes(usage.heapUsed),
      heapTotal: this.formatBytes(usage.heapTotal),
      external: this.formatBytes(usage.external),
      arrayBuffers: this.formatBytes(usage.arrayBuffers),
    };
  },

  /**
   * Check if memory usage is high
   */
  isMemoryHigh(threshold = 0.8): boolean {
    const usage = process.memoryUsage();
    const heapRatio = usage.heapUsed / usage.heapTotal;
    return heapRatio > threshold;
  },

  /**
   * Force garbage collection if available
   */
  forceGC(): boolean {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  },

  /**
   * Get memory pressure level
   */
  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const usage = process.memoryUsage();
    const heapRatio = usage.heapUsed / usage.heapTotal;
    
    if (heapRatio > 0.95) return 'critical';
    if (heapRatio > 0.85) return 'high';
    if (heapRatio > 0.7) return 'medium';
    return 'low';
  },
};