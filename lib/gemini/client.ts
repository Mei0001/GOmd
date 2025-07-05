import { GoogleGenAI } from '@google/genai';

export class GeminiClient {
  private ai: GoogleGenAI;
  private model: string = 'gemini-2.5-pro';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  // PDFファイルを直接処理してMarkdownを生成（20MB未満）
  async generateContentFromPDF(pdfBuffer: Buffer, prompt: string): Promise<string> {
    try {
      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64')
          }
        }
      ];

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents
      });

      return response.text || '';
    } catch (error) {
      console.error('Gemini PDF処理エラー:', error);
      throw new Error('PDFの処理に失敗しました');
    }
  }

  // 大きなPDFファイル用（File API使用、20MB以上）
  async generateContentFromLargePDF(pdfBuffer: Buffer, fileName: string, prompt: string): Promise<string> {
    try {
      const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      const file = await this.ai.files.upload({
        file: fileBlob,
        config: {
          displayName: fileName,
        },
      });

      // ファイル処理完了まで待機
      if (!file.name) {
        throw new Error('ファイル名が取得できませんでした');
      }
      
      let getFile = await this.ai.files.get({ name: file.name });
      while (getFile.state === 'PROCESSING') {
        console.log(`ファイル処理中: ${getFile.state}`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        getFile = await this.ai.files.get({ name: file.name });
      }

      if (getFile.state === 'FAILED') {
        throw new Error('ファイル処理に失敗しました');
      }

      const contents: any[] = [
        { text: prompt }
      ];

      if (file.uri && file.mimeType) {
        // @google/genai のAPIに合わせた正しい形式
        const { createPartFromUri } = await import('@google/genai');
        const fileContent = createPartFromUri(file.uri, file.mimeType);
        contents.push(fileContent);
      }

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: contents,
      });

      return response.text || '';
    } catch (error) {
      console.error('Gemini 大きなPDF処理エラー:', error);
      throw new Error('大きなPDFの処理に失敗しました');
    }
  }

  // API接続テスト
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ text: 'Hello' }]
      });
      return !!response.text;
    } catch (error) {
      console.error('Gemini API 接続テストエラー:', error);
      return false;
    }
  }

  // 後方互換性のためのメソッド（廃止予定）
  async generateContent(_extractedText: string, _prompt: string): Promise<string> {
    console.warn('generateContent method is deprecated. Use generateContentFromPDF instead.');
    // このメソッドは後方互換性のために残すが、新しいPDF処理は使用しない
    throw new Error('このメソッドは廃止されました。generateContentFromPDFを使用してください。');
  }
}