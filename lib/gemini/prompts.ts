// PDF→Markdown変換用のプロンプト（Geminiネイティブ処理）
export const PDF_TO_MARKDOWN_PROMPT = `
あなたはPDFからMarkdownへの変換専門家です。
提供されたPDFファイルを分析し、以下の規則に厳密に従って高品質なMarkdown形式に変換してください。

PDFの文字認識、図表分析、数式抽出を含む全ての処理を行い、構造を理解して適切なMarkdownに変換してください。

## 変換規則

### 1. 数式の処理
- すべての数式はブロック形式（$$...$$）で出力してください
- LaTeX記法を完全に保持してください
- 数式内の改行やスペースも維持してください
- インライン数式も$$で囲んでブロック化してください

例:
$$
E = mc^2
$$

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### 2. 表の処理
- Markdownテーブル形式を使用してください
- ヘッダー行を正確に識別してください
- セルの配置（左寄せ、中央、右寄せ）を保持してください
- 空のセルも適切に処理してください

例:
| 項目 | 値 | 説明 |
|------|:--:|-----|
| 質量 | 9.11 × 10⁻³¹ kg | 電子の質量 |

### 3. 画像・図表の処理
- 現在は画像の出力は行わず、テキストでの説明に置き換えてください
- 図表の内容は文章で詳細に説明してください
- 図番号やキャプションがあれば必ず含めてください
- グラフや図の重要な情報は失わないようにしてください

例:
**図1: 関数のグラフについて**
この図は二次関数 y = x² のグラフを示しており、原点を通る上に凸の放物線である。

### 4. 見出しの処理
- PDFの文書構造を分析し、適切な見出しレベルを判断してください
- # (h1) から ###### (h6) まで使用してください
- 番号付き見出しの場合、番号も保持してください

### 5. リストの処理
- 番号付きリスト: 1. 2. 3. 形式を使用してください
- 番号なしリスト: - または * 形式を使用してください
- ネストレベルをスペースで正確に表現してください
- リスト項目内の改行も保持してください

### 6. その他の要素
- コードブロック: \`\`\`言語名 で囲んでください
- 引用: > を使用してください
- 強調: **太字**、*斜体* を使用してください
- リンク: [テキスト](URL) 形式を使用してください

### 7. 特殊な記号・文字
- 数学記号は適切なUnicode文字またはLaTeX記法を使用してください
- ギリシャ文字、上付き・下付き文字を正確に変換してください
- 特殊な記号（∞、∑、∫、等）は適切に表現してください

## 出力形式
- UTF-8エンコーディングを使用してください
- 適切な改行とスペーシングを保持してください
- セクション間に空行を挿入してください
- Markdownのベストプラクティスに従ってください

## 注意事項
- 元のPDFの内容を忠実に再現してください
- 数式の精度を最優先してください
- 表の構造を正確に保持してください
- 図表の参照番号も保持してください
- 章節の番号付けも保持してください

変換を開始してください。
`;

// 数式重点プロンプト（Geminiネイティブ処理）
export const MATH_FOCUSED_PROMPT = `
あなたは数学文書の専門家です。提供されたPDFファイルを分析し、数式を重点的に正確に認識・変換してMarkdown形式で出力してください。

PDFから数式、数学記号、複雑な数学構造を正確に読み取り、LaTeX形式で表現してください。

## 数式変換の重点項目

### 1. 数式の正確性
- すべての数式を$$で囲んだブロック形式で出力
- 分数、積分、微分、級数などの複雑な数式も正確に変換
- 上付き・下付き文字を正確に保持
- 括弧の対応関係を正確に保持

### 2. 数学記号の処理
- ギリシャ文字（α、β、γ、等）
- 数学演算子（∫、∑、∏、∂、等）
- 関係記号（≤、≥、≠、≈、等）
- 集合記号（∈、∉、⊂、⊆、等）
- 論理記号（∧、∨、¬、⇒、等）

### 3. 数式環境の保持
- 連立方程式のalign環境
- 行列のmatrix環境
- 場合分けのcases環境
- 複数行の数式

例:
$$
\\begin{cases}
x + y = 5 \\\\
2x - y = 1
\\end{cases}
$$

$$
\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}
$$

変換を開始してください。
`;

// 簡略化プロンプト（Geminiネイティブ処理）
export const SIMPLE_CONVERSION_PROMPT = `
提供されたPDFファイルをMarkdownに変換してください。

要件:
- PDFの文字と構造を正確に認識
- 数式は$$で囲んでLaTeX形式で出力
- 表はMarkdownテーブル形式
- 見出しは#を使用
- 改行と空行を適切に配置
- 画像は現在出力せず、内容を文章で説明

変換を開始してください。
`;

// プロンプトの選択
export function getConversionPrompt(type: 'default' | 'math-focused' | 'simple' = 'default'): string {
  switch (type) {
    case 'math-focused':
      return MATH_FOCUSED_PROMPT;
    case 'simple':
      return SIMPLE_CONVERSION_PROMPT;
    default:
      return PDF_TO_MARKDOWN_PROMPT;
  }
}

// カスタムプロンプトの作成
export function createCustomPrompt(options: {
  mathFormat?: 'block' | 'inline';
  includeImages?: boolean;
  preserveFormatting?: boolean;
  focus?: string;
}): string {
  const { mathFormat = 'block', includeImages = true, preserveFormatting = true, focus } = options;

  let customPrompt = PDF_TO_MARKDOWN_PROMPT;

  // 数式形式のカスタマイズ
  if (mathFormat === 'inline') {
    customPrompt = customPrompt.replace(
      'すべての数式はブロック形式（$$...$$）で出力してください',
      'インライン数式は$で囲み、ブロック数式は$$で囲んでください'
    );
  }

  // 画像処理のカスタマイズ
  if (!includeImages) {
    customPrompt = customPrompt.replace(
      /### 3\. 画像の処理[\s\S]*?(?=### 4\.)/,
      '### 3. 画像の処理\n- 画像は無視してください\n\n'
    );
  }

  // 特別な焦点の追加
  if (focus) {
    customPrompt = `${customPrompt}\n\n## 特別な注意事項\n${focus}`;
  }

  return customPrompt;
}