'use client';

import React, { useState } from 'react';
import { FileUploader, MultipleFileUploader, MarkdownPreview } from '@/components/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionResult, BatchConversionResult } from '@/types';
import { Calculator, FileText, Zap, Download, Upload, Files } from 'lucide-react';

export default function HomePage() {
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [batchConversionResult, setBatchConversionResult] = useState<BatchConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'single' | 'multiple'>('single');

  // 単一ファイルアップロード完了時の処理
  const handleUploadComplete = (result: ConversionResult) => {
    setConversionResult(result);
    setBatchConversionResult(null);
    setError(null);
  };

  // 複数ファイルアップロード完了時の処理
  const handleBatchUploadComplete = (result: BatchConversionResult) => {
    setBatchConversionResult(result);
    setConversionResult(null);
    setError(null);
  };

  // エラー時の処理
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setConversionResult(null);
    setBatchConversionResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ヒーローセクション */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          PDF to Markdown
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          数学コンテンツに特化したPDF変換ツール。数式・表・画像を含むPDFを
          高品質なMarkdownファイルに変換します。
        </p>
      </div>

      {/* 機能紹介 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Calculator className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle className="text-lg">数式対応</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              LaTeX形式の数式を正確に抽出・変換。複雑な数学記号も完全対応。
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <FileText className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle className="text-lg">表・画像</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              表はMarkdownテーブル形式で、画像も適切な形式で抽出。
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 text-yellow-500 mb-2" />
            <CardTitle className="text-lg">AI変換</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gemini AIによる高精度変換。文書構造を理解した変換を実現。
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Download className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle className="text-lg">簡単ダウンロード</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              変換完了後、Markdownファイルを即座にダウンロード可能。
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* ファイルアップロードセクション */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">ファイルをアップロード</h2>
          <p className="text-muted-foreground">
            PDF、画像ファイルなど、様々な形式のファイルに対応
          </p>
        </div>

        {/* アップロードモード切り替え */}
        <div className="flex justify-center space-x-4">
          <Button
            variant={uploadMode === 'single' ? 'default' : 'outline'}
            onClick={() => setUploadMode('single')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            単一ファイル
          </Button>
          <Button
            variant={uploadMode === 'multiple' ? 'default' : 'outline'}
            onClick={() => setUploadMode('multiple')}
            className="flex items-center gap-2"
          >
            <Files className="h-4 w-4" />
            複数ファイル
          </Button>
        </div>

        {/* アップロードコンポーネント */}
        {uploadMode === 'single' ? (
          <FileUploader
            onUploadComplete={handleUploadComplete}
            onError={handleError}
          />
        ) : (
          <MultipleFileUploader
            onUploadComplete={handleBatchUploadComplete}
            onError={handleError}
            maxFiles={5}
          />
        )}
      </div>

      {/* 変換結果表示 */}
      {conversionResult?.success && conversionResult.markdown && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">変換結果</h2>
            <p className="text-muted-foreground">
              変換されたMarkdownファイルをプレビューできます
            </p>
          </div>

          <MarkdownPreview
            markdown={conversionResult.markdown}
            fileName={conversionResult.metadata?.fileName || 'document.pdf'}
            metadata={conversionResult.metadata}
          />
        </div>
      )}

      {/* バッチ変換結果表示 */}
      {batchConversionResult?.success && batchConversionResult.results && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">バッチ変換結果</h2>
            <p className="text-muted-foreground">
              {batchConversionResult.metadata?.successfulFiles || 0} / {batchConversionResult.metadata?.totalFiles || 0} ファイルが正常に変換されました
            </p>
          </div>

          <div className="grid gap-4">
            {batchConversionResult.results.map((result, index) => (
              result.success && result.markdown && (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {result.metadata?.fileName || `ファイル ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarkdownPreview
                      markdown={result.markdown}
                      fileName={result.metadata?.fileName || `file-${index + 1}.pdf`}
                      metadata={result.metadata}
                    />
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">エラーが発生しました</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 使い方セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">使い方</CardTitle>
          <CardDescription>
            簡単3ステップでPDFをMarkdownに変換
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-semibold">PDFアップロード</h3>
              <p className="text-sm text-muted-foreground">
                ドラッグ&ドロップまたはクリックしてPDFファイルを選択
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-semibold">AI変換</h3>
              <p className="text-sm text-muted-foreground">
                Gemini AIが自動的にPDFをMarkdown形式に変換
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-semibold">ダウンロード</h3>
              <p className="text-sm text-muted-foreground">
                変換完了後、Markdownファイルをダウンロード
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 注意事項 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">注意事項</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• 対応ファイル形式: PDF（最大10MB）</li>
            <li>• 数式はLaTeX形式（$$...$$）で出力されます</li>
            <li>• 画像は参照形式（![alt](image)）で出力されます</li>
            <li>• 処理時間はファイルサイズと複雑さによって変動します</li>
            <li>• アップロードされたファイルは変換後自動的に削除されます</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}