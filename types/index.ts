// PDF変換結果の型定義
export interface ConversionResult {
  success: boolean;
  markdown?: string;
  metadata?: ConversionMetadata;
  error?: ConversionError;
}

// 複数ファイル変換結果の型定義
export interface BatchConversionResult {
  success: boolean;
  results: ConversionResult[];
  metadata?: BatchConversionMetadata;
  error?: ConversionError;
}

// 変換メタデータ
export interface ConversionMetadata {
  fileName: string;
  pageCount: number;
  processingTime: number;
  extractedAt: Date;
  qualityAnalysis?: {
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

// バッチ変換メタデータ
export interface BatchConversionMetadata {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalProcessingTime: number;
  processedAt: Date;
}

// 変換オプション
export interface ConversionOptions {
  mathFormat?: 'block' | 'inline';
  includeImages?: boolean;
  preserveFormatting?: boolean;
}

// アップロードファイル情報
export interface UploadedFile {
  uri: string;
  mimeType: string;
  name: string;
  sizeBytes: number;
  createTime: string;
  updateTime: string;
  expirationTime: string;
}

// エラー型定義
export interface ConversionError {
  code: ErrorCode;
  message: string;
  details?: any;
}

// エラーコード
export enum ErrorCode {
  // ファイル関連
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  
  // API関連
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  
  // システム関連
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

// ファイルアップロード状態
export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// ファイルアップロード状態管理
export interface FileUploadState {
  file: File | null;
  status: UploadStatus;
  progress: number;
  result: ConversionResult | null;
  error: string | null;
}

// 複数ファイルアップロード状態管理
export interface MultipleFileUploadState {
  files: File[];
  status: UploadStatus;
  progress: number;
  results: ConversionResult[];
  errors: string[];
}

// 個別ファイルアップロード状態
export interface FileUploadItem {
  file: File;
  status: UploadStatus;
  progress: number;
  result: ConversionResult | null;
  error: string | null;
}