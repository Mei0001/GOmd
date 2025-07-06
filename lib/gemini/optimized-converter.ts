import { OptimizedGeminiClient } from './optimized-client';
import { getConversionPrompt } from './prompts';
import { ConversionResult, ConversionOptions, ConversionMetadata } from '@/types';
import { calculateProcessingTime } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface OptimizedConversionOptions extends ConversionOptions {
  useFlashModel?: boolean;
  enableStreaming?: boolean;
  batchProcessing?: boolean;
  maxConcurrentFiles?: number;
}

export class OptimizedGeminiConverter {
  private client: OptimizedGeminiClient;

  constructor(apiKey: string) {
    this.client = new OptimizedGeminiClient(apiKey);
  }

  // 最適化された単一ファイル変換
  async convertOptimized(
    file: File,
    options: OptimizedConversionOptions = {}
  ): Promise<ConversionResult> {
    const startTime = performance.now();
    const {
      useFlashModel = true,
      enableStreaming = true,
      batchProcessing = false,
    } = options;

    try {
      logger.info('最適化変換開始', { 
        fileName: file.name, 
        fileSize: file.size,
        options 
      });

      // PDFファイルをBufferに変換
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      // プロンプトの準備（簡潔版）
      const prompt = this.getOptimizedPrompt(options);

      // 変換実行
      let markdown: string;
      
      if (file.size < 5 * 1024 * 1024) { // 5MB未満は超高速処理
        markdown = await this.client.generateContentFromPDFOptimized(
          pdfBuffer,
          prompt,
          { streamingMode: enableStreaming }
        );
      } else if (file.size < 20 * 1024 * 1024) { // 20MB未満は通常の最適化処理
        if (batchProcessing) {
          markdown = await this.client.processPDFInBatches(pdfBuffer, prompt);
        } else {
          markdown = await this.client.generateContentFromPDFOptimized(
            pdfBuffer,
            prompt,
            { streamingMode: enableStreaming }
          );
        }
      } else { // 20MB以上は大容量最適化処理
        markdown = await this.client.generateContentFromLargePDFOptimized(
          pdfBuffer,
          file.name,
          prompt
        );
      }

      const endTime = performance.now();
      const processingTime = Math.round(endTime - startTime);

      logger.info('最適化変換完了', { 
        fileName: file.name, 
        processingTime,
        outputLength: markdown.length 
      });

      // メタデータの作成
      const metadata: ConversionMetadata = {
        fileName: file.name,
        fileSize: file.size,
        totalPages: this.estimatePageCount(markdown),
        processingTime,
        extractedAt: new Date(),
        hasFormulas: /\$\$.*?\$\$/.test(markdown),
        hasTables: /\|.*\|/.test(markdown),
        hasImages: /!\[.*?\]\(.*?\)/.test(markdown),
      };

      return {
        success: true,
        markdown,
        metadata,
      };
    } catch (error) {
      logger.error('最適化変換エラー', error as Error, { fileName: file.name });
      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR' as any,
          message: error instanceof Error ? error.message : '変換中にエラーが発生しました',
        },
      };
    }
  }

  // 複数ファイルの超高速並列変換
  async convertMultipleOptimized(
    files: File[],
    options: OptimizedConversionOptions = {}
  ): Promise<Map<string, ConversionResult>> {
    const { maxConcurrentFiles = 10 } = options; // 最大同時処理数を増加
    const results = new Map<string, ConversionResult>();
    const startTime = performance.now();

    logger.info('複数ファイル最適化変換開始', { 
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    // ファイルをサイズ順にソート（小さいファイルから処理）
    const sortedFiles = [...files].sort((a, b) => a.size - b.size);

    // バッファに変換
    const fileBuffers = await Promise.all(
      sortedFiles.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        fileName: file.name,
        originalFile: file,
      }))
    );

    // 並列処理
    const queue = [...fileBuffers];
    const processing: Promise<void>[] = [];

    while (queue.length > 0 || processing.length > 0) {
      // 新しいタスクを開始
      while (processing.length < maxConcurrentFiles && queue.length > 0) {
        const fileData = queue.shift()!;
        const task = this.processFileOptimized(fileData, results, options);
        processing.push(task);
      }

      // 完了したタスクを待つ
      if (processing.length > 0) {
        await Promise.race(processing);
        // 完了したタスクを削除
        for (let i = processing.length - 1; i >= 0; i--) {
          try {
            await Promise.race([processing[i], Promise.resolve()]);
            processing.splice(i, 1);
          } catch {
            // エラーは個別に処理済み
          }
        }
      }
    }

    const endTime = performance.now();
    logger.info('複数ファイル最適化変換完了', { 
      fileCount: files.length,
      totalTime: Math.round(endTime - startTime),
      successCount: Array.from(results.values()).filter(r => r.success).length
    });

    return results;
  }

  private async processFileOptimized(
    fileData: { buffer: Buffer; fileName: string; originalFile: File },
    results: Map<string, ConversionResult>,
    options: OptimizedConversionOptions
  ): Promise<void> {
    const result = await this.convertOptimized(fileData.originalFile, options);
    results.set(fileData.fileName, result);
  }

  // 最適化されたプロンプト（簡潔版）
  private getOptimizedPrompt(options: OptimizedConversionOptions): string {
    const basePrompt = `PDFをMarkdown形式に変換してください。

重要な指示:
1. 数式は必ず$$で囲んでLaTeX形式で出力
2. 表はMarkdownテーブル形式で簡潔に
3. 画像は![説明](image)形式で参照
4. 不要な装飾や冗長な説明は省略
5. 構造を保ちつつ簡潔に出力

出力形式: Markdownのみ（説明文なし）`;

    if (options.useFlashModel) {
      return basePrompt + '\n\n高速処理モード: 最も重要な内容のみ抽出';
    }

    return basePrompt;
  }

  private estimatePageCount(markdown: string): number {
    const lines = markdown.split('\n').length;
    return Math.max(1, Math.ceil(lines / 40));
  }

  // ストリーミング変換（リアルタイム出力）
  async convertStreamOptimized(
    file: File,
    onProgress?: (chunk: string) => void
  ): Promise<ConversionResult> {
    const startTime = performance.now();

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);
      const prompt = this.getOptimizedPrompt({ enableStreaming: true });

      // Gemini Flash でストリーミング処理
      const model = new (await import('@google/generative-ai')).GoogleGenerativeAI(
        process.env.GEMINI_API_KEY!
      ).getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContentStream([
        prompt,
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64')
          }
        }
      ]);

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        onProgress?.(chunkText);
      }

      const endTime = performance.now();

      return {
        success: true,
        markdown: fullText,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          processingTime: Math.round(endTime - startTime),
          extractedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STREAMING_ERROR' as any,
          message: error instanceof Error ? error.message : 'ストリーミング変換エラー',
        },
      };
    }
  }
}