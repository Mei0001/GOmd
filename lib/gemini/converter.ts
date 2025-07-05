import { GeminiClient } from './client';
import { getConversionPrompt } from './prompts';
import { ConversionResult, ConversionOptions, ConversionMetadata } from '@/types';
import { calculateProcessingTime } from '@/lib/utils';

export class GeminiConverter {
  private client: GeminiClient;

  constructor(apiKey: string) {
    this.client = new GeminiClient(apiKey);
  }

  // PDFをMarkdownに変換（Geminiネイティブ処理）
  async convert(
    file: File,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = new Date();

    try {
      // 1. PDFファイルをBufferに変換
      console.log('PDFファイルをバッファに変換中...');
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // 2. プロンプトの準備
      const prompt = getConversionPrompt('default');

      // 3. GeminiでPDFを直接処理してMarkdownに変換
      console.log('GeminiでPDFを直接処理中...');
      let markdown: string;
      
      // ファイルサイズで処理方法を切り替え（20MB未満は直接処理、以上はFile API）
      if (file.size < 20 * 1024 * 1024) {
        markdown = await this.client.generateContentFromPDF(pdfBuffer, prompt);
      } else {
        markdown = await this.client.generateContentFromLargePDF(pdfBuffer, file.name, prompt);
      }

      // 4. メタデータの作成
      const endTime = new Date();
      const metadata: ConversionMetadata = {
        fileName: file.name,
        pageCount: await this.estimatePageCount(markdown),
        processingTime: calculateProcessingTime(startTime, endTime),
        extractedAt: endTime,
      };

      return {
        success: true,
        markdown,
        metadata,
      };
    } catch (error) {
      console.error('変換エラー:', error);
      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR' as any,
          message: error instanceof Error ? error.message : '変換中にエラーが発生しました',
        },
      };
    }
  }

  // ストリーミング変換（現在は非ストリーミングと同じ処理）
  async convertStream(
    file: File,
    options: ConversionOptions = {}
  ): Promise<{
    stream: ReadableStream<string>;
    metadata: ConversionMetadata;
  }> {
    const startTime = new Date();

    try {
      // PDFファイルをBufferに変換
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // プロンプトの準備
      const prompt = getConversionPrompt('default');

      // GeminiでPDFを直接処理してMarkdownに変換（非ストリーミング）
      let markdown: string;
      
      if (file.size < 20 * 1024 * 1024) {
        markdown = await this.client.generateContentFromPDF(pdfBuffer, prompt);
      } else {
        markdown = await this.client.generateContentFromLargePDF(pdfBuffer, file.name, prompt);
      }

      // ストリームとして返す（一度に全部送信）
      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue(markdown);
          controller.close();
        },
      });

      // メタデータの作成
      const metadata: ConversionMetadata = {
        fileName: file.name,
        pageCount: await this.estimatePageCount(markdown),
        processingTime: calculateProcessingTime(startTime, new Date()),
        extractedAt: new Date(),
      };

      return { stream, metadata };
    } catch (error) {
      console.error('ストリーミング変換エラー:', error);
      throw error;
    }
  }

  // 数式重点変換
  async convertMathFocused(file: File): Promise<ConversionResult> {
    const startTime = new Date();

    try {
      // PDFファイルをBufferに変換
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // 数式重点のプロンプトを使用
      const prompt = getConversionPrompt('math-focused');
      
      let markdown: string;
      
      if (file.size < 20 * 1024 * 1024) {
        markdown = await this.client.generateContentFromPDF(pdfBuffer, prompt);
      } else {
        markdown = await this.client.generateContentFromLargePDF(pdfBuffer, file.name, prompt);
      }

      const endTime = new Date();
      const metadata: ConversionMetadata = {
        fileName: file.name,
        pageCount: await this.estimatePageCount(markdown),
        processingTime: calculateProcessingTime(startTime, endTime),
        extractedAt: endTime,
      };

      return {
        success: true,
        markdown,
        metadata,
      };
    } catch (error) {
      console.error('数式重点変換エラー:', error);
      return {
        success: false,
        error: {
          code: 'MATH_CONVERSION_ERROR' as any,
          message: error instanceof Error ? error.message : '数式変換中にエラーが発生しました',
        },
      };
    }
  }

  // ページ数の推定
  private async estimatePageCount(markdown: string): Promise<number> {
    // 改行数やコンテンツ量から推定
    const lines = markdown.split('\n').length;
    const estimatedPages = Math.max(1, Math.ceil(lines / 50)); // 50行で1ページと仮定
    return estimatedPages;
  }

  // 変換可能かチェック
  async canConvert(file: File): Promise<boolean> {
    try {
      // ファイルタイプのチェック
      if (file.type !== 'application/pdf') {
        return false;
      }

      // ファイルサイズのチェック（10MB以下）
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // 変換統計の取得
  async getConversionStats(markdown: string): Promise<{
    characterCount: number;
    wordCount: number;
    mathBlockCount: number;
    tableCount: number;
    headingCount: number;
  }> {
    const characterCount = markdown.length;
    const wordCount = markdown.split(/\s+/).length;
    const mathBlockCount = (markdown.match(/\$\$[\s\S]*?\$\$/g) || []).length;
    const tableCount = (markdown.match(/\|.*\|/g) || []).length;
    const headingCount = (markdown.match(/^#+\s/gm) || []).length;

    return {
      characterCount,
      wordCount,
      mathBlockCount,
      tableCount,
      headingCount,
    };
  }
}