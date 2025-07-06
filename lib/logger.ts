/**
 * Centralized logging system for the application
 */

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
  duration?: number;
  metadata?: Record<string, any>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    if (this.isProduction && (level === 'error' || level === 'warn')) return true;
    return false;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error,
      metadata,
    };
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const logData = {
      ...entry,
      error: entry.error ? {
        name: entry.error.name,
        message: entry.error.message,
        stack: entry.error.stack,
      } : undefined,
    };

    // In development, use console with colors
    if (this.isDevelopment) {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      console.log(
        `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} - ${entry.message}`,
        entry.context ? `\nContext: ${JSON.stringify(entry.context, null, 2)}` : '',
        entry.metadata ? `\nMetadata: ${JSON.stringify(entry.metadata, null, 2)}` : '',
        entry.error ? `\nError: ${entry.error.stack}` : ''
      );
    } else {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logData));
    }

    // Send to external logging service if configured
    if (this.isProduction && entry.level === 'error') {
      this.sendToExternalService(logData);
    }
  }

  private async sendToExternalService(logData: LogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // Could be Sentry, LogRocket, DataDog, etc.
    try {
      if (process.env.SENTRY_DSN) {
        // Example Sentry integration
        // Sentry.captureException(logData.error || new Error(logData.message), {
        //   contexts: { custom: logData.context },
        //   extra: logData.metadata,
        // });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry('debug', message, context, undefined, metadata));
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry('info', message, context, undefined, metadata));
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry('warn', message, context, undefined, metadata));
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.writeLog(this.createLogEntry('error', message, context, error, metadata));
  }

  // Performance monitoring
  time(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      this.info(`Performance: ${label}`, undefined, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // API request logging
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    this.writeLog(this.createLogEntry(
      level,
      `${method} ${url} ${statusCode}`,
      context,
      undefined,
      { method, url, statusCode, duration }
    ));
  }

  // File processing logging
  logFileProcessing(
    operation: string,
    filename: string,
    fileSize: number,
    duration?: number,
    success = true,
    error?: Error,
    context?: LogContext
  ): void {
    const message = `File ${operation}: ${filename} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`;
    const metadata = { operation, filename, fileSize, duration, success };

    if (success) {
      this.info(message, context, metadata);
    } else {
      this.error(message, error, context, metadata);
    }
  }

  // Conversion logging
  logConversion(
    filename: string,
    inputSize: number,
    outputSize: number,
    duration: number,
    qualityScore?: number,
    success = true,
    error?: Error,
    context?: LogContext
  ): void {
    const message = `Conversion ${success ? 'completed' : 'failed'}: ${filename}`;
    const metadata = {
      filename,
      inputSize,
      outputSize,
      duration,
      qualityScore,
      success,
      compressionRatio: outputSize / inputSize,
    };

    if (success) {
      this.info(message, context, metadata);
    } else {
      this.error(message, error, context, metadata);
    }
  }

  // Rate limiting logging
  logRateLimit(
    key: string,
    remaining: number,
    resetTime: number,
    blocked = false,
    context?: LogContext
  ): void {
    const message = blocked
      ? `Rate limit exceeded for ${key}`
      : `Rate limit check for ${key}`;
    
    const metadata = { key, remaining, resetTime, blocked };

    if (blocked) {
      this.warn(message, context, metadata);
    } else {
      this.debug(message, context, metadata);
    }
  }

  // Cache logging
  logCache(
    operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
    key: string,
    size?: number,
    context?: LogContext
  ): void {
    const message = `Cache ${operation}: ${key}`;
    const metadata = { operation, key, size };
    
    this.debug(message, context, metadata);
  }

  // Memory usage logging
  logMemoryUsage(label: string, context?: LogContext): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const metadata = {
        rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
        external: `${Math.round(usage.external / 1024 / 1024)} MB`,
      };
      
      this.debug(`Memory usage: ${label}`, context, metadata);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Middleware for Next.js API routes
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  operationName?: string
): T {
  return (async (...args: Parameters<T>) => {
    const [request] = args;
    const start = performance.now();
    const requestId = crypto.randomUUID();
    
    const context: LogContext = {
      requestId,
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    };

    const url = new URL(request.url);
    const operation = operationName || `${request.method} ${url.pathname}`;

    logger.info(`Request started: ${operation}`, context);

    try {
      const response = await handler(...args);
      const duration = performance.now() - start;
      
      logger.logRequest(
        request.method,
        url.pathname,
        response.status,
        duration,
        context
      );

      return response;
    } catch (error) {
      const duration = performance.now() - start;
      
      logger.error(
        `Request failed: ${operation}`,
        error as Error,
        context,
        { duration }
      );

      throw error;
    }
  }) as T;
}

// Utility for client-side logging
export const clientLogger = {
  error: (message: string, error?: Error, metadata?: Record<string, any>) => {
    console.error(message, error, metadata);
    
    // Send to external service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Example: Send to analytics or error tracking
      // analytics.track('Client Error', { message, error: error?.message, metadata });
    }
  },
  
  info: (message: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, metadata);
    }
  },
};