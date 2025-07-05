/**
 * シンプルなPDFテキスト抽出（pdf-parseのバグを完全回避）
 */

// PDFのコンテンツストリームからテキストを抽出
function extractTextFromPDFBuffer(buffer: Buffer): string {
  const bufferString = buffer.toString('binary');
  const textChunks: string[] = [];
  
  // BTとETの間のテキストを抽出（PDFのテキストオブジェクト）
  const btPattern = /BT([\s\S]*?)ET/g;
  let match;
  
  while ((match = btPattern.exec(bufferString)) !== null) {
    const content = match[1];
    
    // Tjコマンド（テキスト表示）を探す
    const tjPattern = /\(((?:\\.|[^)])*)\)\s*Tj/g;
    let tjMatch;
    
    while ((tjMatch = tjPattern.exec(content)) !== null) {
      let text = tjMatch[1];
      
      // エスケープシーケンスを処理
      text = text
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\(\d{3})/g, (match, octal) => 
          String.fromCharCode(parseInt(octal, 8))
        );
      
      textChunks.push(text);
    }
  }
  
  // 抽出したテキストを結合
  return textChunks.join(' ').trim();
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // まずシンプルな方法で試す
    const simpleText = extractTextFromPDFBuffer(buffer);
    if (simpleText && simpleText.length > 50) {
      console.log('シンプルな抽出成功:', simpleText.length, '文字');
      return simpleText;
    }
    
    // それでもダメなら基本的なテキスト抽出
    const text = buffer.toString('utf-8')
      .replace(/[^\x20-\x7E\n\r\t\u3000-\u9FAF\uFF00-\uFFEF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length > 0) {
      console.log('基本的な抽出成功:', text.length, '文字');
      return text;
    }
    
    throw new Error('PDFからテキストを抽出できませんでした');
  } catch (error) {
    console.error('PDF抽出エラー:', error);
    throw error;
  }
}

/**
 * 抽出されたテキストを整形（数式部分を認識）
 */
export function preprocessTextForGemini(text: string): string {
  // 改行の正規化
  let processedText = text.replace(/\r\n/g, '\n');
  
  // 複数の改行を段落区切りとして扱う
  processedText = processedText.replace(/\n{3,}/g, '\n\n');
  
  // 数式らしきパターンをマーク
  const mathPatterns = [
    /^\s*[a-zA-Z]\s*=\s*.+$/gm,  // 例: x = 2y + 1
    /^\s*\d+\s*[+\-×÷]\s*\d+\s*=\s*\d+\s*$/gm,  // 例: 2 + 3 = 5
    /[∫∑∏∂∇√π]/g,  // 数学記号を含む
    /\^|_|\{|\}/g,  // 上付き・下付きらしきもの
    /\\[a-zA-Z]+/g,  // LaTeXコマンド
  ];
  
  // 数式候補にマーカーを付ける
  mathPatterns.forEach(pattern => {
    processedText = processedText.replace(pattern, (match) => {
      return `[数式候補] ${match}`;
    });
  });
  
  return processedText;
}

/**
 * PDFから抽出したテキストをGemini用に前処理
 */
export async function preparePDFForGemini(pdfFile: File): Promise<{
  extractedText: string;
  processedText: string;
  metadata: {
    fileName: string;
    fileSize: number;
    pageCount?: number;
  };
}> {
  // FileをBufferに変換
  const arrayBuffer = await pdfFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // PDFからテキスト抽出
  const extractedText = await extractTextFromPDF(buffer);
  
  // Gemini用に前処理
  const processedText = preprocessTextForGemini(extractedText);
  
  return {
    extractedText,
    processedText,
    metadata: {
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
    },
  };
}