import { GeminiClient } from './client';
import { getConversionPrompt } from './prompts';
import { ConversionResult, ConversionOptions, ConversionMetadata } from '@/types';
import { calculateProcessingTime } from '@/lib/utils';
import { preparePDFForGemini } from '@/lib/pdf/simple-parser';

export class GeminiConverter {
  private client: GeminiClient;

  constructor(apiKey: string) {
    this.client = new GeminiClient(apiKey);
  }

  // PDFをMarkdownに変換
  async convert(
    file: File,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = new Date();

    try {
      // 1. PDFからテキスト抽出
      console.log('PDFからテキストを抽出中...');
      const { extractedText, processedText, metadata: pdfMetadata } = await preparePDFForGemini(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('PDFからテキストを抽出できませんでした');
      }

      console.log('抽出されたテキストの長さ:', extractedText.length);

      // 2. プロンプトの準備
      const prompt = getConversionPrompt('default');

      // 3. Geminiでテキストをマークダウンに変換
      console.log('Geminiでマークダウンに変換中...');
      const markdown = await this.client.generateContent(processedText, prompt);

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
      // PDFからテキスト抽出（ストリーミングではないが、処理を開始）
      const { extractedText, processedText } = await preparePDFForGemini(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('PDFからテキストを抽出できませんでした');
      }

      // プロンプトの準備
      const prompt = getConversionPrompt('default');

      // Geminiでマークダウンに変換（非ストリーミング）
      const markdown = await this.client.generateContent(processedText, prompt);

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
      // PDFからテキスト抽出
      const { extractedText, processedText } = await preparePDFForGemini(file);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('PDFからテキストを抽出できませんでした');
      }

      // 数式重点のプロンプトを使用
      const prompt = getConversionPrompt('math-focused');
      const markdown = await this.client.generateContent(processedText, prompt);

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