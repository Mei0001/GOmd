import { NextRequest, NextResponse } from 'next/server';
import { createGeminiConverter } from '@/lib/gemini';
import { analyzeConversionQuality } from '@/lib/utils';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { caches, cacheUtils } from '@/lib/cache';
import { processFileWithMemoryControl } from '@/lib/memory-optimizer';

async function handleConversion(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    return NextResponse.json(
      { error: 'ファイルがアップロードされていません' },
      { status: 400 }
    );
  }
    // ファイル検証
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    if (allowedTypes.indexOf(file.type) === -1) {
      return NextResponse.json(
        { error: 'PDFまたは画像ファイル（JPG、PNG、GIF、BMP、WEBP）のみアップロード可能です' },
        { status: 400 }
      );
    }

  // Generate cache key
  const fileHash = await cacheUtils.getFileHash(file);
  const cacheKey = cacheUtils.generateConversionKey(fileHash);
  
  // Check cache first
  const cached = caches.conversionResults.get(cacheKey);
  if (cached) {
    console.log('キャッシュからレスポンスを返します');
    return NextResponse.json({
      success: true,
      markdown: cached.markdown,
      metadata: {
        ...cached.metadata,
        fileSize: file.size,
        qualityAnalysis: cached.quality,
        fromCache: true,
      }
    });
  }

  // Process with memory optimization
  return await processFileWithMemoryControl(
    file,
    async (buffer) => {
      console.log('GeminiでPDFを直接処理中...');
      const converter = createGeminiConverter();
      
      console.log(`ファイルサイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      if (file.size >= 20 * 1024 * 1024) {
        console.log('大きなファイルのため、File APIを使用します');
      }
      
      const conversionResult = await converter.convert(file);
      
      if (!conversionResult.success) {
        return NextResponse.json(
          { error: conversionResult.error?.message || '変換に失敗しました' },
          { status: 500 }
        );
      }
      
      const markdown = conversionResult.markdown || '';
      
      // 変換品質を分析
      const sampleText = markdown.substring(0, Math.min(1000, markdown.length));
      const qualityAnalysis = analyzeConversionQuality(sampleText, markdown);
      
      console.log(`変換完成度: ${qualityAnalysis.completeness}% (${qualityAnalysis.qualityLevel})`);
      console.log('構造要素:', qualityAnalysis.structureElements);
      
      // Cache the result
      caches.conversionResults.set(cacheKey, {
        markdown,
        metadata: {
          title: conversionResult.metadata?.title || 'Untitled',
          totalPages: conversionResult.metadata?.totalPages || 0,
          hasImages: conversionResult.metadata?.hasImages || false,
          hasFormulas: conversionResult.metadata?.hasFormulas || false,
          hasTables: conversionResult.metadata?.hasTables || false,
        },
        quality: qualityAnalysis,
      });
      
      return NextResponse.json({
        success: true,
        markdown,
        metadata: {
          ...conversionResult.metadata,
          fileSize: file.size,
          qualityAnalysis,
          fromCache: false,
        }
      });
    },
    {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      enableGC: true,
      trackMemory: true,
    }
  );
}

export const POST = withRateLimit(rateLimiters.conversion, async (request: Request) => {
  try {
    return await handleConversion(request as NextRequest);
  } catch (error) {
    console.error('API変換エラー:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '変換中にエラーが発生しました' 
      },
      { status: 500 }
    );
  }
});