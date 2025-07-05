// Gemini API関連の再エクスポート
import { GeminiClient } from './client';
import { GeminiConverter } from './converter';

export { GeminiClient, GeminiConverter };
export { 
  PDF_TO_MARKDOWN_PROMPT, 
  MATH_FOCUSED_PROMPT, 
  SIMPLE_CONVERSION_PROMPT,
  getConversionPrompt,
  createCustomPrompt 
} from './prompts';

// 環境変数からAPIキーを取得
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY環境変数が設定されていません');
  }
  return apiKey;
}

// デフォルトのGeminiクライアントを作成
export function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  return new GeminiClient(apiKey);
}

// デフォルトのGeminiコンバーターを作成
export function createGeminiConverter() {
  const apiKey = getGeminiApiKey();
  return new GeminiConverter(apiKey);
}