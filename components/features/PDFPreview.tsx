'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// react-pdfを動的インポート
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>
});

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), {
  ssr: false
});

// PDF.js workerの設定を動的に行う
const setupPDFWorker = async () => {
  if (typeof window !== 'undefined') {
    const { pdfjs } = await import('react-pdf');
    // CDNから確実に読み込めるURLを使用
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }
};

interface PDFPreviewProps {
  file: File;
  className?: string;
}

export function PDFPreview({ file, className }: PDFPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setupPDFWorker();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF読み込みエラー:', error);
    setError('PDFの読み込みに失敗しました');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
    setPageNumber(1);
  };

  return (
    <div className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>PDFプレビュー</span>
            </CardTitle>
            
            {/* コントロールボタン */}
            <div className="flex items-center space-x-2">
              {/* ズーム・回転コントロール */}
              <div className="flex items-center space-x-1 border rounded p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[4rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomIn}
                  disabled={scale >= 3.0}
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={rotate}
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>

              {/* ページナビゲーション */}
              <div className="flex items-center space-x-1 border rounded p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[6rem] text-center">
                  {loading ? '...' : `${pageNumber} / ${numPages}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* リセットボタン */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetView}
                className="text-xs"
              >
                リセット
              </Button>
            </div>
          </div>

          {/* ファイル情報 */}
          <div className="text-sm text-muted-foreground">
            <p>📄 ファイル名: {file.name}</p>
            <p>📏 ファイルサイズ: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex justify-center">
            {!isClient && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">PDFビューアーを初期化中...</p>
                </div>
              </div>
            )}

            {isClient && loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">PDFを読み込み中...</p>
                </div>
              </div>
            )}

            {isClient && error && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-2">
                  <FileText className="h-12 w-12 text-red-500 mx-auto" />
                  <p className="text-sm text-red-600">{error}</p>
                  <p className="text-xs text-muted-foreground">
                    PDFファイルが破損している可能性があります
                  </p>
                </div>
              </div>
            )}

            {isClient && !error && (
              <div className="border rounded-lg overflow-auto max-h-[600px] bg-gray-50">
                <Suspense fallback={<div>Loading PDF...</div>}>
                  <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={null} // カスタムローディングを使用
                    error={null} // カスタムエラーを使用
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      rotate={rotation}
                      renderTextLayer={false} // テキストレイヤーを無効化（パフォーマンス向上）
                      renderAnnotationLayer={false} // 注釈レイヤーを無効化
                      className="mx-auto"
                    />
                  </Document>
                </Suspense>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}