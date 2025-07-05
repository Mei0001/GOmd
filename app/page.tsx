'use client';

import React, { useState } from 'react';
import { FileUploader, MarkdownPreview, MultipleFileUploader } from '@/components/features';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConversionResult } from '@/types';
import { Calculator, FileText, Zap, Download, Upload, Files } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnimatedContainer, 
  StaggeredContainer, 
  FadeInWhenVisible, 
  HoverCard,
  PageTransition 
} from '@/components/ui/animations';

type UploadMode = 'single' | 'multiple';

export default function HomePage() {
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  // アップロード完了時の処理
  const handleUploadComplete = (result: ConversionResult) => {
    setConversionResult(result);
    setError(null);
  };

  // エラー時の処理
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setConversionResult(null);
  };

  // 複数ファイル処理完了時の処理
  const handleMultipleFilesProcessed = (results: any[]) => {
    console.log('複数ファイル処理完了:', results);
    // 最初の完了したファイルの結果を表示（デモ用）
    if (results.length > 0 && results[0].result) {
      setConversionResult(results[0].result);
      setError(null);
    }
  };

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        {/* ヒーローセクション */}
        <AnimatedContainer className="text-center space-y-4 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
            PDF to Markdown
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            数学コンテンツに特化したPDF変換ツール。数式・表・画像を含むPDFを
            高品質なMarkdownファイルに変換します。
          </p>
        </AnimatedContainer>

        {/* 機能紹介 */}
        <StaggeredContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <AnimatedContainer>
            <HoverCard>
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
            </HoverCard>
          </AnimatedContainer>

          <AnimatedContainer delay={0.1}>
            <HoverCard>
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
            </HoverCard>
          </AnimatedContainer>

          <AnimatedContainer delay={0.2}>
            <HoverCard>
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
            </HoverCard>
          </AnimatedContainer>

          <AnimatedContainer delay={0.3}>
            <HoverCard>
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
            </HoverCard>
          </AnimatedContainer>
        </StaggeredContainer>

        {/* ファイルアップロードセクション */}
        <FadeInWhenVisible className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">PDFファイルをアップロード</h2>
            <p className="text-muted-foreground">
              論文、教科書、学校資料など、数式を含むあらゆるPDFに対応
            </p>
          </div>

        {/* アップロードモード切り替え */}
        <div className="flex justify-center px-4">
          <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg w-full max-w-md sm:w-auto">
            <Button
              variant={uploadMode === 'single' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('single')}
              className={cn(
                "flex items-center space-x-2 flex-1 sm:flex-none",
                uploadMode === 'single' && "bg-background shadow-sm"
              )}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden xs:inline">単一ファイル</span>
              <span className="xs:hidden">単一</span>
            </Button>
            <Button
              variant={uploadMode === 'multiple' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUploadMode('multiple')}
              className={cn(
                "flex items-center space-x-2 flex-1 sm:flex-none",
                uploadMode === 'multiple' && "bg-background shadow-sm"
              )}
            >
              <Files className="h-4 w-4" />
              <span className="hidden xs:inline">複数ファイル</span>
              <span className="xs:hidden">複数</span>
            </Button>
          </div>
        </div>

          {/* アップロードコンポーネント */}
          {uploadMode === 'single' ? (
            <FileUploader
              onUploadComplete={handleUploadComplete}
              onError={handleError}
            />
          ) : (
            <MultipleFileUploader
              onFilesProcessed={handleMultipleFilesProcessed}
              maxFiles={10}
            />
          )}
        </FadeInWhenVisible>

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
    </PageTransition>
  );
}