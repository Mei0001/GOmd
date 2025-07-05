'use server';

import { createGeminiConverter } from '@/lib/gemini';
import { validateFile } from '@/lib/validations/file';
import { ConversionResult, ConversionOptions } from '@/types';
import { getErrorMessage } from '@/lib/utils';

// PDFをMarkdownに変換するServer Action
export async function convertPdfToMarkdown(
  formData: FormData
): Promise<ConversionResult> {
  try {
    // 1. フォームデータからファイルを取得
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_FORMAT' as any,
          message: 'ファイルが選択されていません',
        },
      };
    }

    // 2. ファイルバリデーション
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_FORMAT' as any,
          message: validation.error || 'ファイル形式が無効です',
        },
      };
    }

    // 3. 変換オプションの取得
    const options: ConversionOptions = {
      mathFormat: (formData.get('mathFormat') as 'block' | 'inline') || 'block',
      includeImages: formData.get('includeImages') === 'true',
      preserveFormatting: formData.get('preserveFormatting') === 'true',
    };

    // 4. Gemini APIを使用して変換
    const converter = createGeminiConverter();
    const result = await converter.convert(file, options);

    return result;
  } catch (error) {
    console.error('Server Action変換エラー:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR' as any,
        message: getErrorMessage(error),
      },
    };
  }
}

// 数式重点変換のServer Action
export async function convertPdfToMarkdownMathFocused(
  formData: FormData
): Promise<ConversionResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_FORMAT' as any,
          message: 'ファイルが選択されていません',
        },
      };
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_FILE_FORMAT' as any,
          message: validation.error || 'ファイル形式が無効です',
        },
      };
    }

    const converter = createGeminiConverter();
    const result = await converter.convertMathFocused(file);

    return result;
  } catch (error) {
    console.error('数式重点変換エラー:', error);
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR' as any,
        message: getErrorMessage(error),
      },
    };
  }
}

// ファイル変換可能性チェックのServer Action
export async function checkFileConvertibility(
  formData: FormData
): Promise<{ canConvert: boolean; error?: string }> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      return { canConvert: false, error: 'ファイルが選択されていません' };
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return { canConvert: false, error: validation.error };
    }

    const converter = createGeminiConverter();
    const canConvert = await converter.canConvert(file);

    return { canConvert };
  } catch (error) {
    console.error('変換可能性チェックエラー:', error);
    return { canConvert: false, error: getErrorMessage(error) };
  }
}

// Markdownファイルのダウンロード用データ生成
export async function generateMarkdownDownload(
  markdown: string,
  fileName: string
): Promise<{ blob: string; filename: string }> {
  try {
    // Markdownコンテンツをbase64エンコード
    const blob = Buffer.from(markdown, 'utf-8').toString('base64');
    
    // ファイル名の生成（.mdを追加）
    const filename = fileName.replace(/\.pdf$/i, '.md');

    return { blob, filename };
  } catch (error) {
    console.error('ダウンロードデータ生成エラー:', error);
    throw new Error('ダウンロードデータの生成に失敗しました');
  }
}