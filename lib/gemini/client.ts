import { GoogleGenerativeAI } from '@google/generative-ai';
import { UploadedFile } from '@/types';

export class GeminiClient {
  private ai: GoogleGenerativeAI;
  private model: string = 'gemini-2.0-flash-exp';

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  // ファイルアップロード
  async uploadFile(file: File): Promise<UploadedFile> {
    try {
      // ファイルのバイナリデータを取得
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);

      // 一時的なファイル情報を返す（実際のAPIでは適切な実装が必要）
      return {
        uri: `temp://${file.name}`,
        mimeType: file.type,
        name: file.name,
        sizeBytes: file.size,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(), // 1時間後
      };
    } catch (error) {
      console.error('ファイルアップロードエラー:', error);
      throw new Error('ファイルのアップロードに失敗しました');
    }
  }

  // コンテンツ生成（ストリーミング）- テキストベース
  async generateContentStream(extractedText: string, prompt: string) {
    try {
      const model = this.ai.getGenerativeModel({ model: this.model });
      
      // プロンプトとPDFから抽出したテキストを組み合わせる
      const fullPrompt = `${prompt}

以下はPDFから抽出したテキストです：

---
${extractedText}
---

上記のテキストを分析して、数式はLaTeX形式（$$...$$）で、表はMarkdownテーブル形式で、適切にMarkdownに変換してください。`;
      
      const response = await model.generateContentStream(fullPrompt);
      return response;
    } catch (error) {
      console.error('コンテンツ生成エラー:', error);
      throw new Error('コンテンツの生成に失敗しました');
    }
  }

  // コンテンツ生成（非ストリーミング）- テキストベース
  async generateContent(extractedText: string, prompt: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: this.model });
      
      // プロンプトとPDFから抽出したテキストを組み合わせる
      const fullPrompt = `${prompt}

以下はPDFから抽出したテキストです：

---
${extractedText}
---

上記のテキストを分析して、数式はLaTeX形式（$$...$$）で、表はMarkdownテーブル形式で、適切にMarkdownに変換してください。`;
      
      const response = await model.generateContent(fullPrompt);
      const text = response.response.text();
      return text;
    } catch (error) {
      console.error('コンテンツ生成エラー:', error);
      throw new Error('コンテンツの生成に失敗しました');
    }
  }
  
  // 旧バージョン（互換性のため残す）
  async generateContentFromFile(file: UploadedFile, prompt: string): Promise<string> {
    // 現在は使用しない
    throw new Error('このメソッドは廃止されました。generateContentを使用してください。');
  }

  // ファイル削除
  async deleteFile(fileUri: string): Promise<void> {
    try {
      // 一時的な実装 - 実際のAPIでは適切な削除処理を行う
      console.log('ファイル削除:', fileUri);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      // ファイル削除の失敗は致命的ではないため、エラーをスローしない
    }
  }

  // アップロードされたファイルの一覧取得
  async listFiles(): Promise<UploadedFile[]> {
    try {
      // 一時的な実装 - 空の配列を返す
      return [];
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
      throw new Error('ファイル一覧の取得に失敗しました');
    }
  }

  // ファイル情報の取得
  async getFile(fileUri: string): Promise<UploadedFile> {
    try {
      // 一時的な実装 - ダミーデータを返す
      return {
        uri: fileUri,
        mimeType: 'application/pdf',
        name: 'dummy.pdf',
        sizeBytes: 0,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 3600000).toISOString(),
      };
    } catch (error) {
      console.error('ファイル情報取得エラー:', error);
      throw new Error('ファイル情報の取得に失敗しました');
    }
  }
}