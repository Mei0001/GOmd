import { z } from 'zod';

// ファイルアップロードのバリデーションスキーマ
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, {
      message: 'ファイルサイズは10MB以下にしてください',
    })
    .refine((file) => file.type === 'application/pdf', {
      message: 'PDFファイルのみアップロード可能です',
    })
    .refine((file) => file.name.length > 0, {
      message: 'ファイル名が必要です',
    }),
  options: z.object({
    mathFormat: z.enum(['block', 'inline']).default('block'),
    includeImages: z.boolean().default(true),
    preserveFormatting: z.boolean().default(true),
  }).optional(),
});

// 変換オプションのバリデーション
export const ConversionOptionsSchema = z.object({
  mathFormat: z.enum(['block', 'inline']).default('block'),
  includeImages: z.boolean().default(true),
  preserveFormatting: z.boolean().default(true),
});

// ファイルサイズの制限チェック
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 許可されるファイル形式
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/bmp',
  'image/webp'
] as const;

// ファイルバリデーション関数
export function validateFile(file: File): { valid: boolean; error?: string } {
  // サイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'ファイルサイズは10MB以下にしてください' };
  }

  // 形式チェック
  if (!Array.from(ALLOWED_FILE_TYPES).includes(file.type)) {
    return { valid: false, error: 'PDFまたは画像ファイル（JPG、PNG、GIF、BMP、WEBP）のみアップロード可能です' };
  }

  // ファイル名チェック
  if (!file.name || file.name.length === 0) {
    return { valid: false, error: 'ファイル名が必要です' };
  }

  return { valid: true };
}

// ファイル拡張子の取得
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// ファイルサイズの人間可読形式変換
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}