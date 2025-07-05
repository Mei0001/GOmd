'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Eye, EyeOff, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMarkdownFileName, ConversionQuality } from '@/lib/utils';

// KaTeXのCSSをインポート
import 'katex/dist/katex.min.css';

interface MarkdownPreviewProps {
  markdown: string;
  fileName: string;
  metadata?: {
    pageCount: number;
    processingTime: number;
    extractedAt: Date;
    qualityAnalysis?: ConversionQuality;
  };
}

export function MarkdownPreview({ markdown, fileName, metadata }: MarkdownPreviewProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  // Markdownファイルのダウンロード
  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = generateMarkdownFileName(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // クリップボードにコピー
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      // TODO: トースト通知を追加
      console.log('Markdownをクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
    }
  };

  // プレビュー/編集モードの切り替え
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // 生のMarkdown表示の切り替え
  const toggleRawMarkdown = () => {
    setShowRawMarkdown(!showRawMarkdown);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>変換結果プレビュー</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* プレビュー切り替えボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreviewMode}
                className="flex items-center space-x-1"
              >
                {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{isPreviewMode ? 'Raw' : 'Preview'}</span>
              </Button>

              {/* コピーボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex items-center space-x-1"
              >
                <Copy className="h-4 w-4" />
                <span>コピー</span>
              </Button>

              {/* ダウンロードボタン */}
              <Button
                onClick={handleDownload}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>ダウンロード</span>
              </Button>
            </div>
          </div>

          {/* メタデータ表示 */}
          {metadata && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📄 ファイル名: {generateMarkdownFileName(fileName)}</p>
              <p>📊 推定ページ数: {metadata.pageCount}ページ</p>
              <p>⏱️ 処理時間: {Math.round(metadata.processingTime / 1000)}秒</p>
              <p>📅 変換日時: {new Date(metadata.extractedAt).toLocaleString('ja-JP')}</p>
              {metadata.qualityAnalysis && (
                <div className="flex items-center space-x-2">
                  <span>🎯 変換完成度:</span>
                  <span className={cn(
                    "font-semibold px-2 py-1 rounded",
                    metadata.qualityAnalysis.qualityLevel === 'excellent' && "bg-green-100 text-green-700",
                    metadata.qualityAnalysis.qualityLevel === 'good' && "bg-blue-100 text-blue-700",
                    metadata.qualityAnalysis.qualityLevel === 'fair' && "bg-yellow-100 text-yellow-700",
                    metadata.qualityAnalysis.qualityLevel === 'poor' && "bg-red-100 text-red-700"
                  )}>
                    {metadata.qualityAnalysis.completeness}%
                  </span>
                  <span className="text-xs">
                    ({metadata.qualityAnalysis.qualityLevel === 'excellent' && '優秀'}
                    {metadata.qualityAnalysis.qualityLevel === 'good' && '良好'}
                    {metadata.qualityAnalysis.qualityLevel === 'fair' && '普通'}
                    {metadata.qualityAnalysis.qualityLevel === 'poor' && '要改善'})
                  </span>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isPreviewMode ? (
            // プレビューモード
            <div className="prose prose-slate max-w-none math-preview">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  // テーブルのスタイリング
                  table: ({ children }) => (
                    <table className="w-full border-collapse border border-gray-300">
                      {children}
                    </table>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-300 px-4 py-2 bg-gray-50 font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-300 px-4 py-2">
                      {children}
                    </td>
                  ),
                  // 数式ブロックのスタイリング
                  div: ({ className, children }) => (
                    <div className={cn(className, 'math-display')}>
                      {children}
                    </div>
                  ),
                  // コードブロックのスタイリング
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\\w+)/.exec(className || '');
                    return match ? (
                      <code
                        className={cn(
                          'block p-4 bg-gray-100 rounded-lg overflow-x-auto',
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code
                        className="px-1 py-0.5 bg-gray-100 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // 見出しのスタイリング
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-4 pb-2 border-b">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mb-3 pb-1 border-b">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mb-2">
                      {children}
                    </h3>
                  ),
                  // 引用のスタイリング
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            // Raw Markdownモード
            <div className="relative">
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 border">
                <code>{markdown}</code>
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">変換統計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">文字数</p>
              <p className="font-semibold">{markdown.length.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">単語数</p>
              <p className="font-semibold">{markdown.split(/\\s+/).length.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">数式ブロック</p>
              <p className="font-semibold">{(markdown.match(/\\$\\$[\\s\\S]*?\\$\\$/g) || []).length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">見出し</p>
              <p className="font-semibold">{(markdown.match(/^#+\\s/gm) || []).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}