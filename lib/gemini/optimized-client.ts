import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

interface ProcessingOptions {
  batchSize?: number;
  parallelProcessing?: boolean;
  compressionEnabled?: boolean;
  streamingMode?: boolean;
}

export class OptimizedGeminiClient {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;
  private model: string = 'gemini-2.0-flash-exp'; // 最新の高速モデル
  private modelPro: string = 'gemini-2.0-pro-exp'; // より正確なモデル

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  // 高速化された PDF 処理
  async generateContentFromPDFOptimized(
    pdfBuffer: Buffer,
    prompt: string,
    options: ProcessingOptions = {}
  ): Promise<string> {
    const { streamingMode = true } = options;

    try {
      // Flash モデルを使用して高速処理
      const model = this.genAI.getGenerativeModel({ 
        model: this.model,
        generationConfig: {
          temperature: 0.1, // 決定論的な出力で速度向上
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 8192,
        },
      });

      const base64Data = pdfBuffer.toString('base64');
      
      if (streamingMode) {
        // ストリーミング処理で即座にレスポンス開始
        const result = await model.generateContentStream([
          prompt,
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          }
        ]);

        let fullText = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
        }

        return fullText;
      } else {
        // 通常の処理
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          }
        ]);

        return result.response.text();
      }
    } catch (error) {
      console.error('Optimized Gemini PDF処理エラー:', error);
      throw new Error('PDFの高速処理に失敗しました');
    }
  }

  // 大きな PDF の最適化処理
  async generateContentFromLargePDFOptimized(
    pdfBuffer: Buffer,
    fileName: string,
    prompt: string,
    options: ProcessingOptions = {}
  ): Promise<string> {
    try {
      // ファイルアップロード
      const uploadResponse = await this.fileManager.uploadFile(pdfBuffer, {
        mimeType: 'application/pdf',
        displayName: fileName,
      });

      console.log(`ファイルアップロード完了: ${uploadResponse.file.uri}`);

      // ファイルの状態を確認
      let file = uploadResponse.file;
      while (file.state === 'PROCESSING') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const fileInfo = await this.fileManager.getFile(file.name);
        file = fileInfo;
      }

      if (file.state !== 'ACTIVE') {
        throw new Error(`ファイル処理に失敗: ${file.state}`);
      }

      // Pro モデルで処理（大きなファイルには精度が重要）
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelPro,
        generationConfig: {
          temperature: 0.1,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 8192,
        },
      });

      const result = await model.generateContent([
        prompt,
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        }
      ]);

      // ファイルを削除してリソースを解放
      await this.fileManager.deleteFile(file.name);

      return result.response.text();
    } catch (error) {
      console.error('Large PDF optimization error:', error);
      throw new Error('大きなPDFの最適化処理に失敗しました');
    }
  }

  // バッチ処理で複数ページを並列処理
  async processPDFInBatches(
    pdfBuffer: Buffer,
    prompt: string,
    batchSize: number = 10
  ): Promise<string> {
    // PDFを仮想的にページ分割して並列処理
    // 実際の実装ではPDF.jsなどでページ分割が必要
    const model = this.genAI.getGenerativeModel({ 
      model: this.model,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048, // バッチ処理では小さめに
      },
    });

    // 簡易実装：全体を一度に処理
    const result = await model.generateContent([
      `${prompt}\n\n注意: 高速処理モードです。簡潔に出力してください。`,
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdfBuffer.toString('base64')
        }
      }
    ]);

    return result.response.text();
  }

  // 複数ファイルの並列処理
  async processMultiplePDFs(
    files: Array<{ buffer: Buffer; fileName: string }>,
    prompt: string,
    maxConcurrent: number = 5
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    const queue = [...files];
    const processing: Promise<void>[] = [];

    while (queue.length > 0 || processing.length > 0) {
      // 並列処理数の制限内で新しいタスクを開始
      while (processing.length < maxConcurrent && queue.length > 0) {
        const file = queue.shift()!;
        const task = this.processSingleFile(file, prompt, results);
        processing.push(task);
      }

      // 完了したタスクを待つ
      if (processing.length > 0) {
        await Promise.race(processing);
        // 完了したタスクを削除
        for (let i = processing.length - 1; i >= 0; i--) {
          if (await this.isPromiseResolved(processing[i])) {
            processing.splice(i, 1);
          }
        }
      }
    }

    return results;
  }

  private async processSingleFile(
    file: { buffer: Buffer; fileName: string },
    prompt: string,
    results: Map<string, string>
  ): Promise<void> {
    try {
      const result = await this.generateContentFromPDFOptimized(
        file.buffer,
        prompt,
        { streamingMode: true }
      );
      results.set(file.fileName, result);
    } catch (error) {
      console.error(`ファイル処理エラー: ${file.fileName}`, error);
      results.set(file.fileName, `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  }

  private async isPromiseResolved(promise: Promise<any>): Promise<boolean> {
    const pending = Symbol('pending');
    const result = await Promise.race([promise, Promise.resolve(pending)]);
    return result !== pending;
  }

  // キャッシュを活用した高速化
  private cache = new Map<string, string>();

  async generateContentWithCache(
    pdfBuffer: Buffer,
    prompt: string
  ): Promise<string> {
    // 簡易的なキャッシュキー生成
    const cacheKey = this.generateCacheKey(pdfBuffer, prompt);
    
    if (this.cache.has(cacheKey)) {
      console.log('キャッシュヒット');
      return this.cache.get(cacheKey)!;
    }

    const result = await this.generateContentFromPDFOptimized(pdfBuffer, prompt);
    this.cache.set(cacheKey, result);
    
    // キャッシュサイズ制限
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    return result;
  }

  private generateCacheKey(buffer: Buffer, prompt: string): string {
    // 簡易実装：バッファサイズとプロンプトの最初の100文字
    return `${buffer.length}-${prompt.substring(0, 100)}`;
  }
}