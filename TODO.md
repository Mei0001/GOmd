# TODO - math-md 実装タスクリスト

## 📋 プロジェクトセットアップ

### 1. 初期セットアップ
- [x] Next.js 15プロジェクトの作成
  ```bash
  npx create-next-app@latest math-md --typescript --tailwind --app
  ```
- [x] 必要な依存関係のインストール
  ```bash
  npm install @google/generative-ai react-dropzone zod react-hook-form
  npm install @tanstack/react-query react-markdown katex
  npm install -D @types/katex
  ```
- [x] shadcn/uiのセットアップ
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card progress toast alert
  ```
- [x] 環境変数の設定（.env.local）
  - [x] GEMINI_API_KEYの取得と設定
- [x] .gitignoreの更新

### 2. プロジェクト構造の作成
- [x] ディレクトリ構造の作成
  - [x] app/actions/
  - [x] app/api/convert/stream/
  - [x] components/features/
  - [x] components/ui/
  - [x] lib/gemini/
  - [x] lib/validations/
  - [x] lib/utils/
  - [x] types/
  - [x] hooks/

## 🔧 基本実装（Phase 1 - MVP）

### 3. 型定義とユーティリティ
- [x] types/index.ts - 基本的な型定義
  - [x] ConversionResult
  - [x] ConversionOptions
  - [x] UploadedFile
  - [x] ErrorCode
- [x] lib/validations/file.ts - ファイルバリデーション
- [x] lib/utils/index.ts - 汎用ユーティリティ関数

### 4. Gemini API統合
- [x] lib/gemini/client.ts - Gemini APIクライアント
  - [x] @google/genai SDKへの移行
  - [x] gemini-2.5-proモデル使用
  - [x] PDFネイティブ処理機能
  - [x] File API対応（大容量ファイル）
- [x] lib/gemini/prompts.ts - プロンプト定義
  - [x] PDF直接処理用プロンプト最適化
  - [x] インライン・ブロック数式対応
- [x] lib/gemini/converter.ts - 変換ロジック
  - [x] PDF直接処理への対応

### 5. API Routes実装
- [x] app/api/convert/route.ts
  - [x] PDF直接処理への移行
  - [x] 変換品質分析機能
  - [x] エラーハンドリング
  - [x] レスポンス形式の定義
  - [x] 複数ファイル対応

### 6. UIコンポーネント実装
- [x] components/features/FileUploader.tsx
  - [x] ドラッグ&ドロップ対応
  - [x] ファイル選択UI
  - [x] アップロード状態管理
  - [x] API Route連携対応
  - [x] PDFプレビュー統合
- [x] components/features/ConversionProgress.tsx
  - [x] 進捗バー表示
  - [x] ステータステキスト
  - [x] 詳細ログ表示機能
- [x] components/features/MarkdownPreview.tsx
  - [x] Markdown表示
  - [x] 数式レンダリング（KaTeX）
  - [x] 変換品質表示機能
  - [x] 統計情報表示
- [x] components/features/PDFPreview.tsx
  - [x] PDF表示機能
  - [x] ページナビゲーション
  - [x] ズーム・回転機能
  - [x] 動的インポート対応（SSR回避）
- [x] components/features/MultipleFileUploader.tsx
  - [x] 複数ファイルアップロード
  - [x] 並列処理（最大3ファイル同時）
  - [x] 詳細な進捗ログ
  - [x] 個別・一括ダウンロード機能

### 7. メインページ実装
- [x] app/page.tsx - ホームページ
  - [x] レイアウト構成
  - [x] コンポーネント統合
  - [x] 単一・複数ファイルモード切り替え
  - [x] タブ式UI実装
- [x] app/layout.tsx - ルートレイアウト
  - [x] メタデータ設定
  - [x] グローバルスタイル

### 8. 基本機能テスト
- [x] ファイルアップロード動作確認
- [x] PDF変換動作確認
- [x] ダウンロード機能確認
- [x] エラーハンドリング確認
- [x] PDFプレビュー機能確認
- [x] 複数ファイル処理確認
- [x] 変換品質表示確認

## 🚀 機能拡張（Phase 2）

### 9. ストリーミング対応
- [x] app/api/convert/stream/route.ts
  - [x] Edge Runtime設定
  - [x] ストリーミングレスポンス実装
  - [x] Server-Sent Events対応
- [x] components/features/StreamingUploader.tsx
  - [x] リアルタイム表示
  - [x] ストリーミング状態管理

### 10. エラーハンドリング強化
- [x] lib/error-handler.ts - エラーハンドリングユーティリティ
- [x] components/ui/ErrorBoundary.tsx - エラー境界
- [x] トースト通知の実装

### 11. パフォーマンス最適化
- [x] lib/rate-limiter.ts - レート制限実装
- [x] lib/cache.ts - キャッシング機能
- [x] メモリ効率の改善

### 12. UI/UX改善
- [x] ダークモード対応
- [x] レスポンシブデザイン調整
- [x] アニメーション追加
- [x] アクセシビリティ改善

## 🧪 テスト実装（Phase 3）

### 13. 単体テスト
- [x] Vitestセットアップ
- [x] lib/gemini/のテスト
- [x] lib/validations/のテスト
- [x] コンポーネントのテスト

### 14. E2Eテスト
- [x] Playwrightセットアップ
- [x] 変換フローのテスト
- [x] エラーケースのテスト
- [x] ダウンロード機能のテスト

### 15. 統合テスト
- [x] API Routesのテスト
- [x] Server Actionsのテスト

## 📦 デプロイメント準備

### 16. ビルド最適化
- [x] next.config.js設定
- [x] Turbopack設定確認
- [x] 環境変数の確認

### 17. Vercelデプロイ
- [x] vercel.json作成
- [x] 環境変数設定
- [x] デプロイテスト
- [x] カスタムドメイン設定（必要に応じて）

### 18. 監視・ログ設定
- [x] Vercel Analytics設定
- [x] エラートラッキング設定
- [x] ログ収集設定

## 📚 ドキュメント整備

### 19. 開発ドキュメント
- [x] API仕様書更新
- [x] コンポーネントドキュメント
- [x] 環境構築手順

### 20. ユーザードキュメント
- [x] 使い方ガイド
- [x] FAQ
- [x] トラブルシューティング

## 🎯 完了基準

### MVP完了条件 ✅
- [x] PDFファイルをアップロードできる
- [x] Markdownに変換できる
- [x] 変換結果をダウンロードできる
- [x] 基本的なエラーハンドリングが機能する

### Phase 2完了条件 ✅
- [x] ストリーミング対応が機能する
- [x] パフォーマンスが最適化されている
- [x] UI/UXが洗練されている

### Phase 3完了条件 ✅
- [x] テストカバレッジ80%以上
- [x] 本番環境へのデプロイ完了
- [x] ドキュメントが整備されている

### 🚀 新機能追加完了 ✅
- [x] **高速化最適化**
  - [x] OptimizedGeminiClient実装（gemini-2.0-flash-exp使用）
  - [x] OptimizedGeminiConverter実装（並列処理・ストリーミング対応）
  - [x] EnhancedMultipleFileUploader実装（50ファイル・10並列処理対応）
  - [x] ファイルサイズ別処理最適化（5MB/20MB閾値）
  - [x] リアルタイム処理速度メトリクス表示
- [x] **画像ファイル対応**
  - [x] JPEG、PNG、GIF、BMP、WEBP対応追加
  - [x] 画像専用変換ロジック実装
  - [x] 画像解析プロンプト最適化

## 📅 推定スケジュール

- **Phase 1 (MVP)**: 1-2週間
  - セットアップ: 2日
  - 基本実装: 5-7日
  - テスト・調整: 3日

- **Phase 2 (機能拡張)**: 2-3週間
  - ストリーミング: 3-4日
  - 最適化: 4-5日
  - UI/UX改善: 5-7日

- **Phase 3 (テスト・デプロイ)**: 1-2週間
  - テスト実装: 4-5日
  - デプロイ: 2-3日
  - ドキュメント: 2-3日

## 📝 メモ

- Gemini APIキーは事前に取得が必要
- 開発はTurbopackを使用して高速化
- コミットは機能単位で小さく
- 定期的にCLAUDE.mdを参照して開発方針を確認