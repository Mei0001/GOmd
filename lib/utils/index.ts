import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSSクラスの統合
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 遅延実行
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ファイル名からMarkdownファイル名を生成
export function generateMarkdownFileName(pdfFileName: string): string {
  const nameWithoutExt = pdfFileName.replace(/\.pdf$/i, '');
  return `${nameWithoutExt}.md`;
}

// 現在時刻のフォーマット
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// 処理時間の計算
export function calculateProcessingTime(startTime: Date, endTime: Date): number {
  return endTime.getTime() - startTime.getTime();
}

// エラーメッセージの生成
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '予期しないエラーが発生しました';
}

// 処理時間の人間可読形式変換
export function formatProcessingTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  }
  return `${seconds}秒`;
}

// テキストの省略
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

// 安全なJSON解析
export function safeJsonParse<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

// Base64エンコード
export function encodeBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

// Base64デコード
export function decodeBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString();
}

// URLの検証
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 文字列のサニタイズ
export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '');
}

// マークダウン変換の完成度を計算
export function calculateMarkdownCompleteness(
  extractedText: string,
  markdown: string
): number {
  // 基本的な要素のスコア
  let score = 0;
  let maxScore = 100;

  // 1. テキスト長の比較 (30点)
  const textLengthRatio = Math.min(1, markdown.length / Math.max(extractedText.length, 1));
  score += textLengthRatio * 30;

  // 2. Markdown要素の存在確認 (40点)
  const markdownElements = {
    headings: (markdown.match(/^#+\s/gm) || []).length > 0 ? 10 : 0,
    mathBlocks: (markdown.match(/\$\$[\s\S]*?\$\$/g) || []).length > 0 ? 15 : 0,
    tables: (markdown.match(/\|.*\|/g) || []).length > 0 ? 8 : 0,
    lists: (markdown.match(/^[\s]*[-*+]\s/gm) || []).length > 0 ? 7 : 0,
  };
  
  score += Object.values(markdownElements).reduce((sum, val) => sum + val, 0);

  // 3. 数式の検出精度 (20点)
  const mathPatterns = [
    /[∫∑∏∂∇√π]/g,  // 数学記号
    /\^|_/g,         // 上付き・下付き
    /\\[a-zA-Z]+/g,  // LaTeXコマンド
    /[=<>≤≥≠]/g,    // 等号・不等号
  ];
  
  let mathDetectionScore = 0;
  mathPatterns.forEach(pattern => {
    const extractedMatches = (extractedText.match(pattern) || []).length;
    const markdownMatches = (markdown.match(pattern) || []).length;
    
    if (extractedMatches > 0) {
      const ratio = Math.min(1, markdownMatches / extractedMatches);
      mathDetectionScore += ratio * 5; // 各パターン5点
    }
  });
  
  score += mathDetectionScore;

  // 4. 構造の保持 (10点)
  const structureScore = markdown.includes('\n\n') ? 10 : 0; // 段落分けの存在
  score += structureScore;

  // パーセンテージで返す
  return Math.min(100, Math.round(score));
}

// 変換品質の分析
export interface ConversionQuality {
  completeness: number;
  mathElementsCount: number;
  structureElements: {
    headings: number;
    paragraphs: number;
    tables: number;
    lists: number;
    mathBlocks: number;
  };
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor';
}

export function analyzeConversionQuality(
  extractedText: string,
  markdown: string
): ConversionQuality {
  const completeness = calculateMarkdownCompleteness(extractedText, markdown);
  
  const structureElements = {
    headings: (markdown.match(/^#+\s/gm) || []).length,
    paragraphs: markdown.split('\n\n').length,
    tables: (markdown.match(/\|.*\|/g) || []).length,
    lists: (markdown.match(/^[\s]*[-*+]\s/gm) || []).length,
    mathBlocks: (markdown.match(/\$\$[\s\S]*?\$\$/g) || []).length,
  };
  
  const mathElementsCount = Object.values(structureElements).reduce((sum, val) => sum + val, 0);
  
  let qualityLevel: ConversionQuality['qualityLevel'] = 'poor';
  if (completeness >= 90) qualityLevel = 'excellent';
  else if (completeness >= 75) qualityLevel = 'good';
  else if (completeness >= 60) qualityLevel = 'fair';
  
  return {
    completeness,
    mathElementsCount,
    structureElements,
    qualityLevel,
  };
}