'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize } from '@/lib/validations/file';
import { FileUploadState, ConversionResult } from '@/types';
import { PDFPreview } from './PDFPreview';

interface FileUploaderProps {
  onUploadComplete?: (result: ConversionResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

export function FileUploader({ onUploadComplete, onError, disabled = false, showPreview = true }: FileUploaderProps) {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });
  const [showPDFPreview, setShowPDFPreview] = useState(false);

  // ファイルドロップ処理
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      // ファイルバリデーション
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState(prev => ({
          ...prev,
          error: validation.error || 'ファイル形式が無効です',
          status: 'error',
        }));
        onError?.(validation.error || 'ファイル形式が無効です');
        return;
      }

      // アップロード開始
      setUploadState({
        file,
        status: 'uploading',
        progress: 0,
        result: null,
        error: null,
      });

      try {
        // 進捗アニメーション
        setUploadState(prev => ({ ...prev, progress: 25 }));

        // FormDataの作成
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mathFormat', 'block');
        formData.append('includeImages', 'true');
        formData.append('preserveFormatting', 'true');

        // 処理開始
        setUploadState(prev => ({ ...prev, status: 'processing', progress: 50 }));

        // API Routeを呼び出し
        const response = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        // 完了処理
        setUploadState(prev => ({ ...prev, progress: 100 }));

        if (response.ok && result.success) {
          setUploadState(prev => ({
            ...prev,
            status: 'completed',
            result,
            error: null,
          }));
          onUploadComplete?.(result);
        } else {
          setUploadState(prev => ({
            ...prev,
            status: 'error',
            error: result.error || '変換に失敗しました',
          }));
          onError?.(result.error || '変換に失敗しました');
        }
      } catch (error) {
        console.error('アップロードエラー:', error);
        const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    },
    [disabled, onUploadComplete, onError]
  );

  // react-dropzoneの設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || uploadState.status === 'processing',
  });

  // リセット処理
  const handleReset = () => {
    setUploadState({
      file: null,
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
    });
  };

  // ステータスアイコンの取得
  const getStatusIcon = () => {
    switch (uploadState.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'processing':
      case 'uploading':
        return <File className="h-6 w-6 text-blue-500 animate-pulse" />;
      default:
        return <Upload className="h-6 w-6 text-gray-400" />;
    }
  };

  // ステータステキストの取得
  const getStatusText = () => {
    switch (uploadState.status) {
      case 'uploading':
        return 'ファイルをアップロード中...';
      case 'processing':
        return 'PDFを変換中...';
      case 'completed':
        return '変換が完了しました！';
      case 'error':
        return uploadState.error || 'エラーが発生しました';
      default:
        return 'PDFファイルをドラッグ&ドロップまたはクリックして選択';
    }
  };

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardContent className="p-6">
          {/* ドロップゾーン */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              isDragActive && 'border-primary bg-primary/10',
              uploadState.status === 'processing' && 'cursor-not-allowed opacity-50',
              uploadState.status === 'error' && 'border-red-300 bg-red-50',
              uploadState.status === 'completed' && 'border-green-300 bg-green-50'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {getStatusIcon()}
              
              <div>
                <p className="text-lg font-medium">
                  {getStatusText()}
                </p>
                
                {uploadState.status === 'idle' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    対応形式: PDF（最大10MB）
                  </p>
                )}
              </div>

              {/* ファイル情報 */}
              {uploadState.file && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📄 {uploadState.file.name}</p>
                  <p>📊 {formatFileSize(uploadState.file.size)}</p>
                </div>
              )}

              {/* 進捗バー */}
              {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
                <div className="w-full max-w-xs">
                  <Progress value={uploadState.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {uploadState.progress}%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {(uploadState.status === 'error' || uploadState.status === 'completed') && (
            <div className="flex justify-center space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>リセット</span>
              </Button>
              
              {uploadState.file && showPreview && (
                <Button
                  variant="outline"
                  onClick={() => setShowPDFPreview(!showPDFPreview)}
                  className="flex items-center space-x-2"
                >
                  {showPDFPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showPDFPreview ? 'プレビュー非表示' : 'PDFプレビュー'}</span>
                </Button>
              )}
            </div>
          )}

          {/* エラーメッセージ */}
          {uploadState.status === 'error' && uploadState.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {uploadState.error}
            </div>
          )}

          {/* 成功メッセージ */}
          {uploadState.status === 'completed' && uploadState.result?.metadata && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
              <p>✅ 変換完了</p>
              <p>📄 推定ページ数: {uploadState.result.metadata.pageCount}</p>
              <p>⏱️ 処理時間: {Math.round(uploadState.result.metadata.processingTime / 1000)}秒</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDFプレビュー */}
      {uploadState.file && showPreview && showPDFPreview && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <PDFPreview file={uploadState.file} />
        </div>
      )}
    </div>
  );
}