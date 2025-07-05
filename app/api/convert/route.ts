import { NextRequest, NextResponse } from 'next/server';
import { createGeminiConverter } from '@/lib/gemini';
import { extractTextFromPDF } from '@/lib/pdf/simple-parser';
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
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDFファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // PDFからテキスト抽出
    console.log('PDFからテキストを抽出中...');
    const extractedText = await extractTextFromPDF(buffer);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'PDFからテキストを抽出できませんでした' },
        { status: 400 }
      );
    }
    
    console.log('抽出されたテキストの長さ:', extractedText.length);
    
    // Geminiで変換
    const converter = createGeminiConverter();
    
    // converterを使用して変換
    const mockFile = new File([buffer], file.name, { type: 'application/pdf' });
    const conversionResult = await converter.convert(mockFile);
    
    if (!conversionResult.success) {
      return NextResponse.json(
        { error: conversionResult.error?.message || '変換に失敗しました' },
        { status: 500 }
      );
    }
    
    const markdown = conversionResult.markdown;
    
    // 変換品質を分析
    const qualityAnalysis = analyzeConversionQuality(extractedText, markdown);
    
    console.log(`変換完成度: ${qualityAnalysis.completeness}% (${qualityAnalysis.qualityLevel})`);
    console.log('構造要素:', qualityAnalysis.structureElements);
    
    return NextResponse.json({
      success: true,
      markdown,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        textLength: extractedText.length,
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