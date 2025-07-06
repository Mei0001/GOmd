import { NextRequest, NextResponse } from 'next/server';
import { createGeminiConverter } from '@/lib/gemini';
import { analyzeConversionQuality } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
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

    // Geminiで直接PDF処理
    console.log('GeminiでPDFを直接処理中...');
    const converter = createGeminiConverter();
    
    // ファイルサイズを確認してログ出力
    console.log(`ファイルサイズ: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    if (file.size >= 20 * 1024 * 1024) {
      console.log('大きなファイルのため、File APIを使用します');
    }
    
    // converterを使用してPDFを直接変換
    const conversionResult = await converter.convert(file);
    
    if (!conversionResult.success) {
      return NextResponse.json(
        { error: conversionResult.error?.message || '変換に失敗しました' },
        { status: 500 }
      );
    }
    
    const markdown = conversionResult.markdown || '';
    
    // 変換品質を分析（PDFから直接変換したため、元テキストとしてMarkdownの一部を使用）
    const sampleText = markdown.substring(0, Math.min(1000, markdown.length)); // 品質分析用のサンプル
    const qualityAnalysis = analyzeConversionQuality(sampleText, markdown);
    
    console.log(`変換完成度: ${qualityAnalysis.completeness}% (${qualityAnalysis.qualityLevel})`);
    console.log('構造要素:', qualityAnalysis.structureElements);
    
    return NextResponse.json({
      success: true,
      markdown,
      metadata: {
        ...conversionResult.metadata,
        fileSize: file.size,
        qualityAnalysis,
      }
    });
    
  } catch (error) {
    console.error('API変換エラー:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '変換中にエラーが発生しました' 
      },
      { status: 500 }
    );
  }
}