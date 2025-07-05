# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

math-mdは、数学コンテンツに特化したPDF→Markdown変換Webアプリケーションです。Gemini APIを使用して、PDFから数式を含むコンテンツを抽出し、整形されたMarkdownファイルとして出力します。

### 主要機能
- WebUIからのPDFファイルアップロード（ドラッグ&ドロップ対応）
- Gemini APIを使用したPDF内容の抽出
- 数式のLaTeX形式での保持と出力
- 表・画像の抽出とMarkdown形式での埋め込み
- 変換済みMarkdownファイルのダウンロード

## 技術スタック

### フレームワーク
- **Next.js 15** (App Router)
  - React Server Components (RSC)
  - Server Actions
  - Streaming対応
  - Turbopack（開発環境）

### 言語・型定義
- TypeScript 5.x
- Zod（スキーマバリデーション）

### スタイリング
- Tailwind CSS 3.x
- shadcn/ui（UIコンポーネント）
- Radix UI（アクセシブルなコンポーネント）

### 状態管理
- React Hook Form（フォーム管理）
- TanStack Query（サーバー状態管理）

### ファイル処理
- react-dropzone（ドラッグ&ドロップ）
- FormData API（ファイルアップロード）

### API統合
- Google Generative AI SDK（Gemini API）
- Context7（ドキュメント参照）

### 開発ツール
- ESLint + Prettier
- Vitest（ユニットテスト）
- Playwright（E2Eテスト）

## 詳細要件
**厳守事項**
 'TODO.md'を常に確認して実装が終了した時点でチェックを入れてください。

### 1. ファイルアップロード
- ドラッグ&ドロップとファイル選択の両方に対応
- 対応PDF：論文、教科書、学校資料など数式を含むあらゆるPDF
- ファイルサイズ制限：なし（実装時に必要に応じて設定）

### 2. PDF処理
- すべての処理をGemini APIに委託
- テキスト、数式、表、画像をすべて抽出
- 図表のキャプション：不要

### 3. 数式の処理
- Gemini APIが出力する形式を使用
- 数式はブロック形式（`$$...$$`）で統一
  - 理由：複雑な数式の可読性が高く、論文や教科書では一般的

### 4. 出力
- Markdownファイル形式のみ
- ローカルの任意の場所にダウンロード可能
- ファイル名：元のPDFファイル名.md

### 5. パフォーマンス
- 処理時間：Gemini APIの処理速度に依存
- 進捗表示：実装可能であれば追加

## プロジェクト構造

```
math-md/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホームページ
│   ├── api/                 # API Routes
│   │   └── convert/
│   │       └── route.ts     # PDF変換エンドポイント
│   └── _components/         # ページ固有コンポーネント
├── components/              # 共通コンポーネント
│   ├── ui/                  # shadcn/uiコンポーネント
│   └── features/            # 機能別コンポーネント
│       ├── FileUploader.tsx
│       ├── ConversionProgress.tsx
│       └── MarkdownPreview.tsx
├── lib/                     # ユーティリティ・設定
│   ├── gemini.ts           # Gemini APIクライアント
│   ├── utils.ts            # 汎用ユーティリティ
│   └── validations.ts      # Zodスキーマ
├── hooks/                   # カスタムフック
├── types/                   # TypeScript型定義
├── public/                  # 静的ファイル
├── tests/                   # テストファイル
├── .env.local              # 環境変数
├── next.config.js          # Next.js設定
├── tailwind.config.ts      # Tailwind設定
├── package.json
└── tsconfig.json
```

## 開発手順

1. Next.js 15プロジェクトのセットアップ
   ```bash
   npx create-next-app@latest math-md --typescript --tailwind --app
   cd math-md
   ```

2. 依存関係のインストール
   ```bash
   # UIコンポーネント
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card progress toast
   
   # 追加パッケージ
   npm install @google/generative-ai react-dropzone 
   npm install @tanstack/react-query zod react-hook-form
   npm install -D @types/node
   ```

3. 環境変数の設定
   ```bash
   # .env.local
   GEMINI_API_KEY=your_api_key_here
   ```

4. コア機能の実装
   - Server Actionを使用したファイルアップロード
   - Gemini APIとの統合（streaming対応）
   - リアルタイム進捗表示
   - Markdownプレビュー機能

5. UI/UXの実装
   - ドラッグ&ドロップゾーン
   - 進捗インジケーター
   - エラーハンドリング
   - レスポンシブデザイン

6. パフォーマンス最適化
   - React Server Componentsの活用
   - 部分的なハイドレーション
   - 画像の最適化

## 注意事項

- Gemini APIのレート制限に注意
- 大きなPDFファイルの処理時のタイムアウト対策
- セキュリティ：アップロードされたファイルの適切な管理と削除
- CORS設定（フロントエンドとバックエンドが別ポートの場合）

## Gemini API使用方針

- すべてのPDF処理をGeminiに委託
- プロンプトで明確に指示：
  - 数式はLaTeX形式で抽出
  - 表はMarkdownテーブル形式
  - 画像は![alt text](image)形式で参照
- Context7を使用してGemini APIのドキュメントを参照