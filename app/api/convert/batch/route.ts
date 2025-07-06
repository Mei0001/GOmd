import { NextRequest, NextResponse } from 'next/server';
import { createGeminiConverter } from '@/lib/gemini';
import { analyzeConversionQuality } from '@/lib/utils';
import { ConversionResult, BatchConversionResult } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルがアップロードされていません' },
        { status: 400 }
      );
    }

    // ファイル数の制限（最大10ファイル）
    if (files.length > 10) {
      return NextResponse.json(
        { error: 'アップロードできるファイルは最大10個までです' },
        { status: 400 }
      );
    }

    // 各ファイルの検証
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];

    for (const file of files) {
      if (allowedTypes.indexOf(file.type) === -1) {
        return NextResponse.json(
          { error: `サポートされていないファイル形式です: ${file.name}` },
          { status: 400 }
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `ファイルサイズが大きすぎます: ${file.name}` },
          { status: 400 }
        );
      }
    }

    const converter = createGeminiConverter();
    const results: ConversionResult[] = [];
    const startTime = new Date();

    console.log(`バッチ処理開始: ${files.length}ファイル`);

    // 各ファイルを順次処理
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`ファイル ${i + 1}/${files.length} を処理中: ${file.name}`);

      try {
        // ファイル変換
        const conversionResult = await converter.convert(file);
        
        if (conversionResult.success && conversionResult.markdown) {
          // 変換品質を分析
          const sampleText = conversionResult.markdown.substring(0, Math.min(1000, conversionResult.markdown.length));
          const qualityAnalysis = analyzeConversionQuality(sampleText, conversionResult.markdown);
          
          // メタデータに品質分析を追加
          if (conversionResult.metadata) {
            conversionResult.metadata.qualityAnalysis = qualityAnalysis;
          }

          console.log(`${file.name} の変換完了 (品質: ${qualityAnalysis.completeness}%)`);
        }

        results.push(conversionResult);
      } catch (error) {
        console.error(`ファイル ${file.name} の変換エラー:`, error);
        results.push({
          success: false,
          error: {
            code: 'CONVERSION_ERROR' as any,
            message: `${file.name}: ${error instanceof Error ? error.message : '変換に失敗しました'}`,
          },
        });
      }
    }

    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();
    const successfulFiles = results.filter(r => r.success).length;
    const failedFiles = results.filter(r => !r.success).length;

    console.log(`バッチ処理完了: 成功 ${successfulFiles}, 失敗 ${failedFiles}`);

    // バッチ処理結果を作成
    const batchResult: BatchConversionResult = {
      success: successfulFiles > 0,
      results: results,
      metadata: {
        totalFiles: files.length,
        successfulFiles: successfulFiles,
        failedFiles: failedFiles,
        totalProcessingTime: processingTime,
        processedAt: endTime,
      }
    };

    return NextResponse.json(batchResult);
    
  } catch (error) {
    console.error('バッチ処理エラー:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'バッチ処理中にエラーが発生しました' 
      },
      { status: 500 }
    );
  }
}