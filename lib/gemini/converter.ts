import { GeminiClient } from './client';
import { getConversionPrompt } from './prompts';
import { ConversionResult, ConversionOptions, ConversionMetadata } from '@/types';
import { calculateProcessingTime } from '@/lib/utils';

export class GeminiConverter {
  private client: GeminiClient;

  constructor(apiKey: string) {
    this.client = new GeminiClient(apiKey);
  }

  // ファイルをMarkdownに変換（PDFと画像に対応）
  async convert(
    file: File,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = new Date();

    try {
      // ファイルタイプに応じて処理を分岐
      if (file.type === 'application/pdf') {
        return await this.convertPDF(file, options, startTime);
      } else if (file.type.startsWith('image/')) {
        return await this.convertImage(file, options, startTime);
      } else {
        throw new Error('サポートされていないファイル形式です');
      }
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

  // PDFをMarkdownに変換（Geminiネイティブ処理）
  private async convertPDF(
    file: File,
    options: ConversionOptions,
    startTime: Date
  ): Promise<ConversionResult> {
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
  }

  // 画像をMarkdownに変換
  private async convertImage(
    file: File,
    options: ConversionOptions,
    startTime: Date
  ): Promise<ConversionResult> {
    // 1. 画像ファイルをBufferに変換
    console.log('画像ファイルをバッファに変換中...');
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 2. 画像解析プロンプトの準備
    const prompt = `この画像を詳しく分析して、以下の形式でMarkdownに変換してください：

1. 画像の内容を詳細に説明
2. テキストが含まれている場合は、そのテキストを正確に抽出
3. 数式が含まれている場合は、LaTeX形式（$$...$$）で記述
4. 図表やグラフがある場合は、その内容を構造化して説明
5. 画像のタイトルや説明を適切に付与

以下の形式で出力してください：
- 画像の説明は自然な文章で記述
- 数式は$$...$$で囲む
- 表がある場合はMarkdownテーブル形式で記述
- 見出しレベルは適切に設定`;

    // 3. GeminiでImageを直接処理してMarkdownに変換
    console.log('Geminiで画像を直接処理中...');
    const markdown = await this.client.generateContentFromImage(imageBuffer, file.type, prompt);

    // 4. メタデータの作成
    const endTime = new Date();
    const metadata: ConversionMetadata = {
      fileName: file.name,
      pageCount: 1, // 画像は常に1ページ
      processingTime: calculateProcessingTime(startTime, endTime),
      extractedAt: endTime,
    };

    return {
      success: true,
      markdown,
      metadata,
    };
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
      const supportedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/webp'
      ];
      
      if (supportedTypes.indexOf(file.type) === -1) {
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