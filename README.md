# math-md

数学コンテンツに特化したPDF→Markdown変換Webアプリケーション。Gemini APIを使用して、PDFから数式・表・画像を含むコンテンツを抽出し、整形されたMarkdownファイルとして出力します。

## 特徴

- 📄 **簡単なPDFアップロード**: ドラッグ&ドロップまたはファイル選択でPDFをアップロード
- 🧮 **数式の正確な抽出**: LaTeX形式で数式を保持
- 📊 **表・画像の対応**: PDFの表や画像もMarkdown形式で出力
- 💾 **ローカルダウンロード**: 変換結果をMarkdownファイルとしてダウンロード
- 🚀 **シンプルなUI**: 使いやすいWebインターフェース

## 対応するPDF

- 学術論文
- 教科書
- 講義資料
- その他数式を含むあらゆるPDF文書

## 技術スタック

- **フロントエンド**: HTML/CSS/JavaScript
- **バックエンド**: Node.js + TypeScript + Express.js
- **PDF処理**: Google Gemini API
- **ドキュメント**: Context7

## セットアップ

### 前提条件

- Node.js (v18以上)
- npm または yarn
- Google Gemini APIキー

### インストール手順

1. リポジトリのクローン
```bash
git clone https://github.com/yourusername/math-md.git
cd math-md
```

2. バックエンドのセットアップ
```bash
cd backend
npm install
```

3. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してGemini APIキーを設定
```

4. 開発サーバーの起動
```bash
# バックエンド
npm run dev

# フロントエンド（別ターミナル）
cd ../frontend
# HTTPサーバーを起動（例: Python）
python -m http.server 8080
```

5. ブラウザでアクセス
```
http://localhost:8080
```

## 使い方

1. Webブラウザでアプリケーションにアクセス
2. PDFファイルをドラッグ&ドロップまたは「ファイルを選択」ボタンでアップロード
3. 変換処理の完了を待つ（進捗表示あり）
4. 「ダウンロード」ボタンをクリックしてMarkdownファイルを保存

## 出力形式

### 数式
数式はブロック形式で出力されます：
```markdown
$$
E = mc^2
$$
```

### 表
Markdownテーブル形式：
```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| A   | B   | C   |
```

### 画像
画像は以下の形式で参照されます：
```markdown
![画像の説明](image_path)
```

## 開発

### プロジェクト構造
```
math-md/
├── frontend/              # フロントエンドコード
├── backend/              # バックエンドコード
├── README.md
└── CLAUDE.md            # 開発者向けガイドライン
```

### ビルド
```bash
cd backend
npm run build
```

### テスト
```bash
npm run test
```

## ライセンス

MITライセンス

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを作成して変更内容について議論してください。