import { NextRequest } from 'next/server';
import { createGeminiConverter } from '@/lib/gemini';
import { rateLimiters } from '@/lib/rate-limiter';
import { caches, cacheUtils } from '@/lib/cache';
import { memoryTracker } from '@/lib/memory-optimizer';

// Edge Runtimeを使用してストリーミング性能を向上
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Rate limiting check
  const rateLimitResult = rateLimiters.conversion.check(request);
  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter }),
      { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Server-Sent Eventsのストリーム作成
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // イベント送信のヘルパー関数
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        // Memory tracking start
        memoryTracker.snapshot('stream-start');
        sendEvent('progress', { stage: 'init', message: 'ストリーミング開始', progress: 0 });

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
          sendEvent('error', { error: 'ファイルがアップロードされていません' });
          controller.close();
          return;
        }

        // ファイル検証
        if (file.type !== 'application/pdf') {
          sendEvent('error', { error: 'PDFファイルのみアップロード可能です' });
          controller.close();
          return;
        }

        sendEvent('progress', { 
          stage: 'upload', 
          message: `ファイル受信完了: ${file.name}`, 
          progress: 20 
        });

        // Check cache first
        const fileHash = await cacheUtils.getFileHash(file);
        const cacheKey = cacheUtils.generateConversionKey(fileHash);
        const cached = caches.conversionResults.get(cacheKey);
        
        if (cached) {
          sendEvent('progress', { 
            stage: 'cache', 
            message: 'キャッシュから結果を取得', 
            progress: 90 
          });
          
          sendEvent('result', {
            success: true,
            markdown: cached.markdown,
            metadata: {
              ...cached.metadata,
              fromCache: true,
            }
          });
          
          sendEvent('complete', { message: 'キャッシュから完了' });
          return;
        }

        // ファイルサイズ情報
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        sendEvent('progress', { 
          stage: 'processing', 
          message: `ファイルサイズ: ${fileSizeMB}MB`, 
          progress: 30 
        });
        
        memoryTracker.getDiff('file-loaded');

        // 処理方法の判定
        if (file.size >= 20 * 1024 * 1024) {
          sendEvent('progress', { 
            stage: 'processing', 
            message: '大きなファイルのため、File APIを使用します', 
            progress: 35 
          });
        }

        // Geminiコンバーターでストリーミング変換
        const converter = createGeminiConverter();

        sendEvent('progress', { 
          stage: 'conversion', 
          message: 'Gemini APIで変換開始', 
          progress: 40 
        });

        // 変換実行
        const conversionResult = await converter.convert(file);

        if (!conversionResult.success) {
          sendEvent('error', { 
            error: conversionResult.error?.message || '変換に失敗しました' 
          });
          controller.close();
          return;
        }

        sendEvent('progress', { 
          stage: 'conversion', 
          message: 'AI変換完了', 
          progress: 80 
        });

        // 品質分析
        sendEvent('progress', { 
          stage: 'analysis', 
          message: '品質分析中...', 
          progress: 90 
        });

        // 結果送信
        sendEvent('progress', { 
          stage: 'complete', 
          message: '変換完了', 
          progress: 100 
        });

        sendEvent('result', {
          success: true,
          markdown: conversionResult.markdown,
          metadata: conversionResult.metadata
        });

        sendEvent('complete', { message: 'ストリーミング完了' });

      } catch (error) {
        console.error('ストリーミング変換エラー:', error);
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };
        
        sendEvent('error', { 
          error: error instanceof Error ? error.message : '予期しないエラーが発生しました' 
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}