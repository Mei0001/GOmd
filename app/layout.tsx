import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'math-md - PDF to Markdown Converter',
  description: '数学コンテンツに特化したPDF→Markdown変換Webアプリケーション。Gemini APIを使用して、PDFから数式・表・画像を含むコンテンツを抽出し、整形されたMarkdownファイルとして出力します。',
  keywords: ['PDF', 'Markdown', '数式', 'LaTeX', '変換', 'Gemini API', 'アクセシビリティ'],
  authors: [{ name: 'math-md' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'math-md - PDF to Markdown Converter',
    description: '数学コンテンツに特化したPDF→Markdown変換ツール',
    type: 'website',
    locale: 'ja_JP',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        {/* KaTeX CSS */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            {/* Skip to main content link */}
            <a 
              href="#main-content" 
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-primary-foreground"
            >
              メインコンテンツにスキップ
            </a>

            {/* ヘッダー */}
            <header className="border-b" role="banner">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold text-primary">
                      math-md
                    </h1>
                    <span className="text-sm text-muted-foreground" aria-label="アプリケーションの説明">
                      PDF to Markdown Converter
                    </span>
                  </div>
                  
                  <nav className="flex items-center space-x-4" role="navigation" aria-label="ユーティリティナビゲーション">
                    <span className="text-xs text-muted-foreground" aria-label="技術情報">
                      Powered by Gemini AI
                    </span>
                    <ThemeToggle />
                  </nav>
                </div>
              </div>
            </header>

            {/* メインコンテンツ */}
            <main id="main-content" className="container mx-auto px-4 py-8" role="main" tabIndex={-1}>
              {children}
            </main>

            {/* フッター */}
            <footer className="border-t mt-16" role="contentinfo">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold mb-3">math-md</h3>
                  <p className="text-sm text-muted-foreground">
                    数学コンテンツに特化したPDF→Markdown変換ツール。
                    Gemini APIを使用して高精度な変換を実現します。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">機能</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 数式のLaTeX形式保持</li>
                    <li>• 表・画像の抽出</li>
                    <li>• ドラッグ&ドロップ対応</li>
                    <li>• リアルタイム変換</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">対応形式</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 入力: PDF（最大10MB）</li>
                    <li>• 出力: Markdown（.md）</li>
                    <li>• 数式: LaTeX（$$...$$）</li>
                    <li>• 表: Markdownテーブル</li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
                <p>© 2024 math-md. Built with Next.js 15 & Gemini AI.</p>
              </div>
            </div>
          </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}