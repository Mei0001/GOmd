'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileWithProgress {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: {
    markdown: string;
    metadata: any;
  };
  error?: string;
  logs: string[];
}

interface MultipleFileUploaderProps {
  onFilesProcessed?: (results: FileWithProgress[]) => void;
  maxFiles?: number;
  className?: string;
}

export function MultipleFileUploader({ 
  onFilesProcessed, 
  maxFiles = 10,
  className 
}: MultipleFileUploaderProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0,
      logs: [`ファイル追加: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`]
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true,
    maxFiles,
    disabled: isProcessing
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addLog = (id: string, message: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, logs: [...f.logs, `${new Date().toLocaleTimeString()}: ${message}`] }
        : f
    ));
  };

  const updateFileStatus = (id: string, status: FileWithProgress['status'], progress?: number) => {
    setFiles(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status, progress: progress ?? f.progress }
        : f
    ));
  };

  const processFile = async (fileData: FileWithProgress): Promise<void> => {
    const { file, id } = fileData;
    
    try {
      updateFileStatus(id, 'uploading', 10);
      addLog(id, 'アップロード開始');

      const formData = new FormData();
      formData.append('file', file);

      updateFileStatus(id, 'uploading', 30);
      addLog(id, 'サーバーに送信中...');

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      updateFileStatus(id, 'processing', 50);
      addLog(id, 'PDF解析中...');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '変換に失敗しました');
      }

      updateFileStatus(id, 'processing', 80);
      addLog(id, 'Markdownに変換中...');

      const result = await response.json();

      updateFileStatus(id, 'processing', 95);
      addLog(id, '変換完了処理中...');

      // 結果を保存
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100, 
              result: result 
            }
          : f
      ));

      addLog(id, `変換完了 (品質: ${result.metadata?.qualityAnalysis?.completeness || 'N/A'}%)`);

    } catch (error) {
      console.error(`ファイル ${file.name} の変換エラー:`, error);
      setFiles(prev => prev.map(f => 
        f.id === id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : '不明なエラー'
            }
          : f
      ));
      addLog(id, `エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const processAllFiles = async () => {
    setIsProcessing(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    addLog('system', `${pendingFiles.length}個のファイルの処理を開始`);

    // 並列処理（最大3ファイル同時）
    const concurrency = 3;
    for (let i = 0; i < pendingFiles.length; i += concurrency) {
      const batch = pendingFiles.slice(i, i + concurrency);
      await Promise.all(batch.map(processFile));
    }

    setIsProcessing(false);
    
    // 完了したファイルの結果を親コンポーネントに渡す
    const completedFiles = files.filter(f => f.status === 'completed');
    onFilesProcessed?.(completedFiles);
  };

  const downloadResult = (fileData: FileWithProgress) => {
    if (!fileData.result) return;

    const blob = new Blob([fileData.result.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileData.file.name.replace('.pdf', '.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllResults = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.result);
    
    completedFiles.forEach((fileData, index) => {
      setTimeout(() => downloadResult(fileData), index * 100); // 100ms間隔でダウンロード
    });
  };

  const getStatusIcon = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'uploading':
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'pending': return '待機中';
      case 'uploading': return 'アップロード中';
      case 'processing': return '処理中';
      case 'completed': return '完了';
      case 'error': return 'エラー';
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* ドロップゾーン */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragActive 
                ? "border-primary bg-primary/10" 
                : "border-muted-foreground/25 hover:border-primary/50",
              isProcessing && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-lg font-medium">ファイルをドロップしてください</p>
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  PDFファイルをドラッグ&ドロップまたはクリックして選択
                </p>
                <p className="text-sm text-muted-foreground">
                  最大{maxFiles}ファイルまで同時処理可能
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ファイル一覧 */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>アップロードファイル ({files.length})</CardTitle>
              <div className="flex items-center space-x-2">
                {completedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAllResults}
                    className="flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>全て保存</span>
                  </Button>
                )}
                <Button
                  onClick={processAllFiles}
                  disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                  className="flex items-center space-x-1"
                >
                  <Upload className="h-4 w-4" />
                  <span>
                    {isProcessing ? '処理中...' : '変換開始'}
                  </span>
                </Button>
              </div>
            </div>
            
            {/* 統計 */}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>完了: {completedCount}</span>
              <span>エラー: {errorCount}</span>
              <span>残り: {files.filter(f => f.status === 'pending').length}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {files.map((fileData) => (
              <div key={fileData.id} className="border rounded-lg p-4 space-y-3">
                {/* ファイル情報とステータス */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{fileData.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(fileData.status)}
                      <span className="text-sm">{getStatusText(fileData.status)}</span>
                    </div>
                    
                    {fileData.status === 'completed' && fileData.result && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResult(fileData)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {fileData.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(fileData.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 進捗バー */}
                {(fileData.status === 'uploading' || fileData.status === 'processing') && (
                  <div className="space-y-1">
                    <Progress value={fileData.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {fileData.progress}%
                    </p>
                  </div>
                )}

                {/* 結果表示 */}
                {fileData.status === 'completed' && fileData.result?.metadata?.qualityAnalysis && (
                  <div className="bg-green-50 p-2 rounded text-sm">
                    <p>✅ 変換完了 - 品質: {fileData.result.metadata.qualityAnalysis.completeness}%</p>
                  </div>
                )}

                {/* エラー表示 */}
                {fileData.status === 'error' && (
                  <div className="bg-red-50 p-2 rounded text-sm text-red-700">
                    <p>❌ {fileData.error}</p>
                  </div>
                )}

                {/* ログ表示（詳細） */}
                {fileData.logs.length > 1 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      詳細ログ ({fileData.logs.length})
                    </summary>
                    <div className="mt-1 space-y-1 pl-2 border-l-2 border-gray-200">
                      {fileData.logs.map((log, index) => (
                        <p key={index}>{log}</p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}