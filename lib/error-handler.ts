// エラーハンドリングユーティリティ

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  // ファイル関連
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  
  // API関連
  GEMINI_API_ERROR: 'GEMINI_API_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  
  // システム関連
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function createError(code: ErrorCode, message: string, statusCode?: number, details?: any): AppError {
  return new AppError(message, code, statusCode, details);
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // 特定のエラーパターンを検出
    if (error.message.includes('API key')) {
      return createError(ErrorCodes.GEMINI_API_ERROR, 'API キーが無効です', 401);
    }
    
    if (error.message.includes('rate limit')) {
      return createError(ErrorCodes.RATE_LIMIT_EXCEEDED, 'レート制限に達しました', 429);
    }
    
    if (error.message.includes('timeout')) {
      return createError(ErrorCodes.PROCESSING_TIMEOUT, '処理がタイムアウトしました', 408);
    }
    
    if (error.message.includes('network')) {
      return createError(ErrorCodes.NETWORK_ERROR, 'ネットワークエラーが発生しました', 503);
    }

    return createError(ErrorCodes.INTERNAL_ERROR, error.message);
  }

  return createError(ErrorCodes.INTERNAL_ERROR, '予期しないエラーが発生しました');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '予期しないエラーが発生しました';
}

export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : { error };

  console.error(`[${timestamp}] ${context || 'Error'}:`, errorInfo);
}