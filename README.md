# math-md

> 数学コンテンツに特化したPDF・画像→Markdown変換Webアプリケーション

**math-md**は、Gemini AIを使用してPDFや画像ファイルから数式・表・図表を含むコンテンツを高精度で抽出し、整形されたMarkdownファイルとして出力する最新のWebアプリケーションです。

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-cyan)](https://tailwindcss.com/)
[![Gemini API](https://img.shields.io/badge/Gemini%20API-2.0-orange)](https://ai.google.dev/)

## ✨ 主要機能

### 📄 ファイル処理
- **PDF変換**: 学術論文、教科書、講義資料などのPDFを高精度変換
- **画像変換**: JPEG、PNG、GIF、BMP、WEBP画像からテキスト・数式を抽出
- **複数ファイル処理**: 最大50ファイルの一括処理（10並列処理）
- **高速化モード**: gemini-2.0-flash-expによる超高速変換

### 🧮 数式・コンテンツ処理
- **LaTeX数式**: 数式をLaTeX形式（$$...$$）で正確に抽出
- **表の変換**: PDFの表をMarkdownテーブル形式で出力
- **画像・図表**: 図表の説明と参照を適切に処理
- **文書構造**: 見出し、段落、リストを適切に構造化

### 🚀 パフォーマンス
- **ストリーミング処理**: リアルタイムでの変換結果表示
- **インテリジェントキャッシング**: 同一ファイルの再処理を回避
- **レート制限**: API制限を考慮した安全な処理
- **メモリ最適化**: 大容量ファイルに対応

### 🎨 ユーザーエクスペリエンス
- **ダークモード**: 目に優しいダークテーマ対応
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **PDFプレビュー**: アップロード前にPDFの内容を確認
- **進捗表示**: 詳細な変換進捗とステータス表示
- **変換品質分析**: 変換結果の完成度を自動評価

## 🛠️ 技術スタック

### フレームワーク・ライブラリ
- **Next.js 15** - App Router、RSC、Server Actions
- **TypeScript 5** - 型安全な開発
- **Tailwind CSS 3** - モダンなスタイリング
- **shadcn/ui** - 高品質UIコンポーネント
- **Framer Motion** - スムーズなアニメーション

### AI・ファイル処理
- **Google Gemini API** - AI駆動の変換エンジン
  - gemini-2.0-flash-exp（高速処理）
  - gemini-2.0-pro-exp（高精度処理）
- **react-pdf** - PDFプレビュー機能
- **React Dropzone** - ドラッグ&ドロップ対応

### 開発・テスト・デプロイ
- **Vitest** - 高速ユニットテスト
- **Playwright** - E2Eテスト
- **ESLint + Prettier** - コード品質管理
- **Vercel** - 本番環境デプロイ

## 🚀 クイックスタート

### 前提条件
- Node.js 18.0 以上
- npm または yarn
- [Google AI Studio](https://aistudio.google.com/app/apikey)でのGemini APIキー取得

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/Mei0001/GOmd.git
cd math-md

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localファイルを編集してGemini APIキーを設定
```

### 環境変数設定

`.env.local`ファイルに以下を設定：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 開発サーバー起動

```bash
# 開発環境での起動
npm run dev

# 本番ビルド
npm run build

# 本番環境での起動
npm start
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス

## 📖 使い方

### 基本的な使用方法

1. **ファイルアップロード**
   - ドラッグ&ドロップまたは「ファイルを選択」でPDF・画像ファイルをアップロード
   - PDFプレビューで内容を事前確認可能

2. **処理モードの選択**
   - **単一ファイル**: 1つのファイルを詳細処理
   - **複数ファイル**: 最大10ファイルを並列処理（3並列）
   - **高速処理**: 最大50ファイルを超高速処理（10並列）

3. **変換処理**
   - リアルタイム進捗表示
   - 処理速度メトリクス（ページ/秒）
   - エラーハンドリングと再試行

4. **結果の活用**
   - Markdownプレビュー表示
   - 変換品質スコア表示
   - ワンクリックダウンロード

### 対応ファイル形式

| 形式 | 拡張子 | 最大サイズ | 説明 |
|------|--------|------------|------|
| PDF | `.pdf` | 100MB | 学術論文、教科書、資料 |
| JPEG | `.jpg`, `.jpeg` | 10MB | 写真、スキャン画像 |
| PNG | `.png` | 10MB | 図表、スクリーンショット |
| GIF | `.gif` | 10MB | アニメーション画像 |
| BMP | `.bmp` | 10MB | ビットマップ画像 |
| WebP | `.webp` | 10MB | 最新画像フォーマット |

## 📋 出力形式例

### 数式
```markdown
$$
\frac{d}{dx}\left( \int_{a}^{x} f(t) \, dt\right) = f(x)
$$
```

### 表
```markdown
| パラメータ | 値 | 単位 |
|------------|----|----- |
| 速度 | 299,792,458 | m/s |
| 質量 | 9.109 × 10⁻³¹ | kg |
```

### 構造化された文書
```markdown
# 第1章: イントロダクション

## 1.1 背景

本研究では...

### 1.1.1 先行研究

- Smith et al. (2023)の研究では...
- Johnson (2022)は以下を示した：

$$E = mc^2$$
```

## 🧪 テスト

```bash
# ユニットテスト実行
npm run test

# E2Eテスト実行
npm run test:e2e

# テストカバレッジ確認
npm run test:coverage
```

## 🚀 デプロイメント

### Vercelへのデプロイ

```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数設定
vercel env add GEMINI_API_KEY
```

### その他のプラットフォーム

アプリケーションはNext.js 15のStandalone出力モードを使用しており、以下のプラットフォームでもデプロイ可能：

- **Netlify**: `npm run build && npm run start`
- **Railway**: Dockerfileまたは直接デプロイ
- **AWS/GCP**: コンテナまたはServerless

## 📁 プロジェクト構造

```
math-md/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── convert/              # 変換エンドポイント
│   │   └── convert/stream/       # ストリーミング変換
│   ├── layout.tsx                # ルートレイアウト
│   └── page.tsx                  # ホームページ
├── components/                   # Reactコンポーネント
│   ├── features/                 # 機能別コンポーネント
│   │   ├── FileUploader.tsx      # ファイルアップロード
│   │   ├── MultipleFileUploader.tsx
│   │   ├── EnhancedMultipleFileUploader.tsx
│   │   ├── MarkdownPreview.tsx   # Markdownプレビュー
│   │   └── PDFPreview.tsx        # PDFプレビュー
│   ├── ui/                       # UIコンポーネント
│   └── theme/                    # テーマ関連
├── lib/                          # ユーティリティ・設定
│   ├── gemini/                   # Gemini API統合
│   │   ├── client.ts             # 標準クライアント
│   │   ├── optimized-client.ts   # 高速化クライアント
│   │   ├── converter.ts          # 変換ロジック
│   │   └── optimized-converter.ts
│   ├── cache.ts                  # キャッシング
│   ├── rate-limiter.ts           # レート制限
│   └── memory-optimizer.ts       # メモリ最適化
├── types/                        # TypeScript型定義
├── tests/                        # テストファイル
├── docs/                         # API仕様書
└── CLAUDE.md                     # 開発者ガイドライン
```

## 🔧 設定・カスタマイズ

### パフォーマンス調整

`next.config.js`で以下を調整可能：

```javascript
const nextConfig = {
  // バンドル最適化
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // Turbopack設定
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};
```

### Gemini API設定

異なるモデルを使用する場合：

```typescript
// lib/gemini/optimized-client.ts
private model: string = 'gemini-2.0-flash-exp'; // 高速
private modelPro: string = 'gemini-2.0-pro-exp'; // 高精度
```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- TypeScriptの型安全性を維持
- Prettierでコードフォーマット
- テストカバレッジ80%以上
- コミットメッセージは[Conventional Commits](https://www.conventionalcommits.org/)に準拠

## 📚 ドキュメント

- [API仕様書](./docs/API.md)
- [開発者ガイド](./CLAUDE.md)
- [TODO リスト](./TODO.md)

## 🐛 トラブルシューティング

### よくある問題

**Q: Gemini APIエラーが発生する**
A: `.env.local`のAPIキーが正しく設定されているか確認してください。

**Q: PDFプレビューが表示されない**
A: ブラウザがWebAssemblyをサポートしているか確認してください。

**Q: 大きなファイルの処理が失敗する**
A: ファイルサイズ制限（PDF: 100MB、画像: 10MB）を確認してください。

**Q: ビルドエラーが発生する**
A: Node.js 18以上、依存関係の最新バージョンを使用してください。

詳細なトラブルシューティングは[Issues](https://github.com/Mei0001/GOmd/issues)をご確認ください。

## 📄 ライセンス

このプロジェクトは[MIT License](LICENSE)の下で公開されています。

## 🙏 謝辞

- [Google AI](https://ai.google.dev/) - Gemini APIの提供
- [Vercel](https://vercel.com/) - デプロイメントプラットフォーム
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネントライブラリ
- オープンソースコミュニティの皆様

---

**Built with ❤️ using Next.js 15, TypeScript, and Gemini AI**