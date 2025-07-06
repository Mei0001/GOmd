'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle, Download, Loader2, Zap, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize } from '@/lib/validations/file';
import { ConversionResult } from '@/types';
import { AnimatedContainer } from '@/components/ui/animations';
import { useToast } from '@/hooks/use-toast';

interface FileWithStatus {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: ConversionResult;
  error?: string;
  startTime?: number;
  endTime?: number;
  speed?: number; // ページ/秒
}

interface EnhancedMultipleFileUploaderProps {
  onFilesProcessed?: (results: Array<{ file: File; result?: ConversionResult; error?: string }>) => void;
  maxFiles?: number;
  maxConcurrent?: number;
  useOptimizedMode?: boolean;
}

export function EnhancedMultipleFileUploader({ 
  onFilesProcessed, 
  maxFiles = 50, // 大幅に増加
  maxConcurrent = 10, // 並列処理数も増加
  useOptimizedMode = true
}: EnhancedMultipleFileUploaderProps) {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStats, setProcessingStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    totalSize: 0,
    processedSize: 0,
    averageSpeed: 0,
    estimatedTimeRemaining: 0,
  });
  const { toast } = useToast();

  // 統計情報の計算
  const stats = useMemo(() => {
    const completed = files.filter(f => f.status === 'completed').length;
    const errors = files.filter(f => f.status === 'error').length;
    const pending = files.filter(f => f.status === 'pending').length;
    const processing = files.filter(f => f.status === 'processing').length;
    const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
    const processedSize = files
      .filter(f => f.status === 'completed' || f.status === 'error')
      .reduce((sum, f) => sum + f.file.size, 0);

    return { completed, errors, pending, processing, totalSize, processedSize };
  }, [files]);

  // ファイルドロップ処理
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles: FileWithStatus[] = [];
      const errors: string[] = [];

      for (const file of acceptedFiles) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push({
            file,
            id: crypto.randomUUID(),
            status: 'pending',
            progress: 0,
          });
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (errors.length > 0) {
        toast({
          title: "一部のファイルが無効です",
          description: errors.join('\n'),
          variant: "destructive",
        });
      }

      if (validFiles.length > 0) {
        const remainingSlots = maxFiles - files.length;
        const filesToAdd = validFiles.slice(0, remainingSlots);
        
        if (filesToAdd.length < validFiles.length) {
          toast({
            title: "ファイル数制限",
            description: `最大${maxFiles}ファイルまでです。${filesToAdd.length}ファイルを追加しました。`,
            variant: "default",
          });
        }

        setFiles(prev => [...prev, ...filesToAdd]);
      }
    },
    [files.length, maxFiles, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    disabled: isProcessing || files.length >= maxFiles,
    multiple: true,
  });

  // ファイル削除
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // 最適化された変換処理
  const processFilesOptimized = async () => {
    setIsProcessing(true);
    const startTime = performance.now();
    
    // 処理キューの設定
    const queue = files.filter(f => f.status === 'pending');
    const processing = new Map<string, Promise<void>>();

    // 統計情報の初期化
    setProcessingStats({
      totalFiles: queue.length,
      completedFiles: 0,
      totalSize: stats.totalSize,
      processedSize: 0,
      averageSpeed: 0,
      estimatedTimeRemaining: 0,
    });

    while (queue.length > 0 || processing.size > 0) {
      // 新しいタスクを開始
      while (processing.size < maxConcurrent && queue.length > 0) {
        const fileStatus = queue.shift()!;
        const task = processFileOptimized(fileStatus);
        processing.set(fileStatus.id, task);
      }

      // 完了したタスクを待つ
      if (processing.size > 0) {
        await Promise.race(processing.values());
        
        // 完了したタスクを削除
        for (const [id, promise] of processing.entries()) {
          try {
            await Promise.race([promise, Promise.resolve()]);
            processing.delete(id);
          } catch {
            // エラーは個別に処理済み
          }
        }

        // 統計情報の更新
        updateProcessingStats();
      }
    }

    const endTime = performance.now();
    const totalTime = Math.round(endTime - startTime);

    toast({
      title: "変換完了",
      description: `${stats.completed}ファイルを${(totalTime / 1000).toFixed(1)}秒で処理しました。`,
      variant: "default",
    });

    setIsProcessing(false);

    // 結果を通知
    if (onFilesProcessed) {
      const results = files.map(f => ({
        file: f.file,
        result: f.result,
        error: f.error,
      }));
      onFilesProcessed(results);
    }
  };

  // 個別ファイルの最適化処理
  const processFileOptimized = async (fileStatus: FileWithStatus) => {
    try {
      // 状態を更新
      setFiles(prev => prev.map(f => 
        f.id === fileStatus.id 
          ? { ...f, status: 'processing' as const, progress: 10, startTime: Date.now() }
          : f
      ));

      // FormDataの準備
      const formData = new FormData();
      formData.append('file', fileStatus.file);
      formData.append('optimized', 'true');

      // 変換API呼び出し
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`変換エラー: ${response.statusText}`);
      }

      const result: ConversionResult = await response.json();

      // 処理速度の計算
      const endTime = Date.now();
      const processingTime = endTime - (fileStatus.startTime || endTime);
      const pagesPerSecond = result.metadata?.totalPages 
        ? (result.metadata.totalPages / (processingTime / 1000))
        : 0;

      // 完了状態に更新
      setFiles(prev => prev.map(f => 
        f.id === fileStatus.id 
          ? { 
              ...f, 
              status: 'completed' as const, 
              progress: 100, 
              result,
              endTime,
              speed: pagesPerSecond
            }
          : f
      ));

    } catch (error) {
      console.error(`ファイル処理エラー: ${fileStatus.file.name}`, error);
      
      // エラー状態に更新
      setFiles(prev => prev.map(f => 
        f.id === fileStatus.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              progress: 0, 
              error: error instanceof Error ? error.message : '不明なエラー' 
            }
          : f
      ));
    }
  };

  // 統計情報の更新
  const updateProcessingStats = () => {
    const completed = files.filter(f => f.status === 'completed');
    const processing = files.filter(f => f.status === 'processing');
    const processedSize = completed.reduce((sum, f) => sum + f.file.size, 0);
    
    // 平均処理速度の計算
    const speeds = completed
      .filter(f => f.speed)
      .map(f => f.speed!);
    const averageSpeed = speeds.length > 0 
      ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length 
      : 0;

    // 残り時間の推定
    const remainingFiles = files.filter(f => f.status === 'pending').length + processing.length;
    const estimatedTimeRemaining = averageSpeed > 0 
      ? (remainingFiles * 30) / averageSpeed // 平均30ページと仮定
      : 0;

    setProcessingStats({
      totalFiles: files.length,
      completedFiles: completed.length,
      totalSize: stats.totalSize,
      processedSize,
      averageSpeed,
      estimatedTimeRemaining,
    });
  };

  // 一括ダウンロード
  const downloadAll = () => {
    files.forEach(f => {
      if (f.status === 'completed' && f.result?.markdown) {
        const blob = new Blob([f.result.markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.file.name.replace('.pdf', '.md');
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* ドロップゾーン */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>高速複数ファイルアップロード</span>
              <Badge variant="secondary">最大{maxFiles}ファイル</Badge>
            </CardTitle>
            {files.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                disabled={isProcessing}
              >
                すべてクリア
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              isDragActive && 'border-primary bg-primary/10',
              isProcessing && 'cursor-not-allowed opacity-50',
              files.length >= maxFiles && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <Upload className="h-12 w-12 text-gray-400" />
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? 'ここにドロップ' 
                    : 'PDFファイルをドラッグ&ドロップ'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  または クリックして選択（複数選択可）
                </p>
                {files.length >= maxFiles && (
                  <p className="text-sm text-red-600 mt-2">
                    ファイル数が上限に達しています
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 統計情報 */}
          {files.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{files.length}</p>
                <p className="text-sm text-muted-foreground">総ファイル数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">完了</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">処理中</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">
                  {formatFileSize(stats.totalSize)}
                </p>
                <p className="text-sm text-muted-foreground">合計サイズ</p>
              </div>
            </div>
          )}

          {/* 処理中の詳細統計 */}
          {isProcessing && processingStats.averageSpeed > 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Gauge className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">処理速度</span>
                </div>
                <span className="text-sm text-blue-600">
                  {processingStats.averageSpeed.toFixed(1)} ページ/秒
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">推定残り時間</span>
                <span className="text-sm">
                  {Math.ceil(processingStats.estimatedTimeRemaining)}秒
                </span>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          {files.length > 0 && (
            <div className="mt-6 flex justify-between">
              <Button
                onClick={processFilesOptimized}
                disabled={isProcessing || files.every(f => f.status !== 'pending')}
                className="flex items-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>処理中 ({stats.processing}/{files.length})</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>高速変換開始</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={downloadAll}
                disabled={stats.completed === 0}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>すべてダウンロード ({stats.completed})</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ファイルリスト */}
      {files.length > 0 && (
        <AnimatedContainer>
          <Card>
            <CardHeader>
              <CardTitle>ファイル一覧</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.map((fileStatus) => (
                  <FileItem
                    key={fileStatus.id}
                    fileStatus={fileStatus}
                    onRemove={() => removeFile(fileStatus.id)}
                    disabled={isProcessing}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedContainer>
      )}
    </div>
  );
}

// ファイルアイテムコンポーネント
function FileItem({ 
  fileStatus, 
  onRemove, 
  disabled 
}: { 
  fileStatus: FileWithStatus; 
  onRemove: () => void; 
  disabled: boolean;
}) {
  const getStatusIcon = () => {
    switch (fileStatus.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <File className="h-5 w-5 text-gray-400" />;
    }
  };

  const downloadFile = () => {
    if (fileStatus.result?.markdown) {
      const blob = new Blob([fileStatus.result.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileStatus.file.name.replace('.pdf', '.md');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center space-x-3 flex-1">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileStatus.file.name}</p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{formatFileSize(fileStatus.file.size)}</span>
            {fileStatus.status === 'processing' && (
              <>
                <span>•</span>
                <span>{fileStatus.progress}%</span>
              </>
            )}
            {fileStatus.status === 'completed' && fileStatus.speed && (
              <>
                <span>•</span>
                <span>{fileStatus.speed.toFixed(1)} ページ/秒</span>
              </>
            )}
            {fileStatus.error && (
              <>
                <span>•</span>
                <span className="text-red-600">{fileStatus.error}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {fileStatus.status === 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadFile}
            className="h-8 w-8 p-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={disabled || fileStatus.status === 'processing'}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {fileStatus.status === 'processing' && (
        <Progress value={fileStatus.progress} className="h-1 mt-2" />
      )}
    </div>
  );
}