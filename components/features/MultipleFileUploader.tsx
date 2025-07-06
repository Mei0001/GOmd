'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Image, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize } from '@/lib/validations/file';
import { FileUploadItem, BatchConversionResult } from '@/types';

interface MultipleFileUploaderProps {
  onUploadComplete?: (result: BatchConversionResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export function MultipleFileUploader({ 
  onUploadComplete, 
  onError, 
  disabled = false,
  maxFiles = 10
}: MultipleFileUploaderProps) {
  const [fileItems, setFileItems] = useState<FileUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // ファイルドロップ処理
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled || isProcessing) return;

      const newFiles = acceptedFiles.slice(0, maxFiles - fileItems.length);
      const newFileItems: FileUploadItem[] = newFiles.map(file => ({
        file,
        status: 'idle',
        progress: 0,
        result: null,
        error: null,
      }));

      setFileItems((prev: FileUploadItem[]) => [...prev, ...newFileItems]);
    },
    [disabled, isProcessing, maxFiles, fileItems.length]
  );

  // react-dropzoneの設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
    },
    maxFiles: maxFiles - fileItems.length,
    disabled: disabled || isProcessing,
  });

  // 個別ファイルの削除
  const removeFile = (index: number) => {
    setFileItems((prev: FileUploadItem[]) => prev.filter((_, i) => i !== index));
  };

  // 全ファイルクリア
  const clearAllFiles = () => {
    setFileItems([]);
  };

  // バッチ処理開始
  const startBatchProcessing = async () => {
    if (fileItems.length === 0) return;

    setIsProcessing(true);
    setOverallProgress(0);

    // すべてのファイルを処理中に設定
    setFileItems((prev: FileUploadItem[]) => prev.map((item: FileUploadItem) => ({
      ...item,
      status: 'processing' as const,
      progress: 0
    })));

    try {
      // FormDataの作成
      const formData = new FormData();
      
      // 各ファイルをFormDataに追加
      fileItems.forEach(item => {
        formData.append('files', item.file);
      });

      // 進捗更新
      setOverallProgress(25);

      // バッチAPI呼び出し
      const response = await fetch('/api/convert/batch', {
        method: 'POST',
        body: formData,
      });

      const batchResult = await response.json();

      // 進捗更新
      setOverallProgress(75);

      if (response.ok && batchResult.success) {
        // 成功した場合、各ファイルの結果を更新
        const results = batchResult.results || [];
        
        setFileItems((prev: FileUploadItem[]) => prev.map((item: FileUploadItem, index: number) => {
          const result = results[index];
          if (result && result.success) {
            return {
              ...item,
              status: 'completed',
              progress: 100,
              result,
              error: null
            };
          } else {
            return {
              ...item,
              status: 'error',
              progress: 0,
              error: result?.error?.message || '変換に失敗しました'
            };
          }
        }));

        setOverallProgress(100);
        onUploadComplete?.(batchResult);
      } else {
        // エラーの場合
        const errorMessage = batchResult.error || 'バッチ処理に失敗しました';
        setFileItems((prev: FileUploadItem[]) => prev.map((item: FileUploadItem) => ({
          ...item,
          status: 'error',
          progress: 0,
          error: errorMessage
        })));
        onError?.(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
      setFileItems((prev: FileUploadItem[]) => prev.map((item: FileUploadItem) => ({
        ...item,
        status: 'error',
        progress: 0,
        error: errorMessage
      })));
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // ファイルアイコンの取得
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // ステータスアイコンの取得
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <File className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            複数ファイルアップロード
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ドロップゾーン */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              isDragActive && 'border-primary bg-primary/10',
              (isProcessing || disabled) && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? 'ファイルをドロップしてください' 
                    : 'ファイルをドラッグ&ドロップまたはクリックして選択'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  対応形式: PDF, JPG, PNG, GIF, BMP, WEBP（最大{maxFiles}ファイル）
                </p>
              </div>
            </div>
          </div>

          {/* ファイルリスト */}
          {fileItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  選択されたファイル ({fileItems.length}/{maxFiles})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  全てクリア
                </Button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fileItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-3 p-3 border rounded-lg',
                      item.status === 'completed' && 'bg-green-50 border-green-200',
                      item.status === 'error' && 'bg-red-50 border-red-200',
                      item.status === 'processing' && 'bg-blue-50 border-blue-200'
                    )}
                  >
                    {getFileIcon(item.file)}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>

                    {item.status === 'processing' && (
                      <div className="w-20">
                        <Progress value={item.progress} className="h-2" />
                        <p className="text-xs text-center mt-1">{item.progress}%</p>
                      </div>
                    )}

                    {getStatusIcon(item.status)}

                    {!isProcessing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 処理開始ボタン */}
          {fileItems.length > 0 && (
            <div className="space-y-4">
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">全体の進捗</span>
                    <span className="text-sm text-muted-foreground">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              )}

              <Button
                onClick={startBatchProcessing}
                disabled={isProcessing || fileItems.length === 0}
                className="w-full"
              >
                {isProcessing ? '処理中...' : '変換開始'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}