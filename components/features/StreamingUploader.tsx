'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, CheckCircle, AlertCircle, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile, formatFileSize } from '@/lib/validations/file';

interface StreamingEvent {
  event: string;
  data: any;
}

interface StreamingUploaderProps {
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error';

interface StreamingState {
  file: File | null;
  status: StreamingStatus;
  stage: string;
  message: string;
  progress: number;
  result: any;
  error: string | null;
  logs: string[];
}

export function StreamingUploader({ onComplete, onError, disabled = false }: StreamingUploaderProps) {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    file: null,
    status: 'idle',
    stage: '',
    message: '',
    progress: 0,
    result: null,
    error: null,
    logs: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setStreamingState(prev => ({
      ...prev,
      logs: [...prev.logs, `${timestamp}: ${message}`]
    }));
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      // ファイルバリデーション
      const validation = validateFile(file);
      if (!validation.valid) {
        const errorMessage = validation.error || 'ファイル形式が無効です';
        setStreamingState(prev => ({
          ...prev,
          error: errorMessage,
          status: 'error',
        }));
        onError?.(errorMessage);
        return;
      }

      // ストリーミング開始
      setStreamingState({
        file,
        status: 'streaming',
        stage: 'init',
        message: 'ストリーミング準備中...',
        progress: 0,
        result: null,
        error: null,
        logs: [],
      });

      addLog(`ファイル選択: ${file.name} (${formatFileSize(file.size)})`);

      try {
        // FormDataの作成
        const formData = new FormData();
        formData.append('file', file);

        addLog('ストリーミングAPI接続中...');

        // EventSourceでストリーミング接続
        const eventSource = new EventSource('/dev/null'); // ダミー、実際は別の方法でストリーミング
        
        // 代わりにfetchでストリーミング処理
        const response = await fetch('/api/convert/stream', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('ストリーミングレスポンスを取得できませんでした');
        }

        // ストリーミングデータの読み取り
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                handleStreamingEvent({ event: 'unknown', data });
              } catch (e) {
                console.warn('JSON解析エラー:', e);
              }
            } else if (line.startsWith('event: ')) {
              const eventType = line.slice(7);
              // イベントタイプを記録（次のdataで使用）
            }
          }
        }

      } catch (error) {
        console.error('ストリーミングエラー:', error);
        const errorMessage = error instanceof Error ? error.message : 'ストリーミング中にエラーが発生しました';
        
        setStreamingState(prev => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));
        
        addLog(`エラー: ${errorMessage}`);
        onError?.(errorMessage);
      }
    },
    [disabled, onError, addLog]
  );

  const handleStreamingEvent = useCallback((event: StreamingEvent) => {
    const { data } = event;

    switch (event.event) {
      case 'progress':
        setStreamingState(prev => ({
          ...prev,
          stage: data.stage,
          message: data.message,
          progress: data.progress,
        }));
        addLog(data.message);
        break;

      case 'result':
        setStreamingState(prev => ({
          ...prev,
          result: data,
          progress: 100,
        }));
        addLog('変換結果を受信');
        break;

      case 'complete':
        setStreamingState(prev => ({
          ...prev,
          status: 'completed',
          message: '変換完了',
        }));
        addLog('ストリーミング完了');
        if (streamingState.result) {
          onComplete?.(streamingState.result);
        }
        break;

      case 'error':
        setStreamingState(prev => ({
          ...prev,
          status: 'error',
          error: data.error,
        }));
        addLog(`エラー: ${data.error}`);
        onError?.(data.error);
        break;

      default:
        // 汎用データ処理
        if (data.stage && data.message && data.progress !== undefined) {
          setStreamingState(prev => ({
            ...prev,
            stage: data.stage,
            message: data.message,
            progress: data.progress,
          }));
          addLog(data.message);
        }
    }
  }, [addLog, onComplete, onError, streamingState.result]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || streamingState.status === 'streaming',
  });

  const handleReset = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setStreamingState({
      file: null,
      status: 'idle',
      stage: '',
      message: '',
      progress: 0,
      result: null,
      error: null,
      logs: [],
    });
  };

  const getStatusIcon = () => {
    switch (streamingState.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      case 'streaming':
        return <Activity className="h-6 w-6 text-blue-500 animate-pulse" />;
      default:
        return <Zap className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (streamingState.status) {
      case 'streaming':
        return `${streamingState.stage}: ${streamingState.message}`;
      case 'completed':
        return '✅ ストリーミング変換が完了しました！';
      case 'error':
        return streamingState.error || 'エラーが発生しました';
      default:
        return 'PDFファイルをドラッグ&ドロップしてリアルタイム変換を開始';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>ストリーミング変換</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* ドロップゾーン */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              isDragActive && 'border-primary bg-primary/10',
              streamingState.status === 'streaming' && 'cursor-not-allowed opacity-50',
              streamingState.status === 'error' && 'border-red-300 bg-red-50',
              streamingState.status === 'completed' && 'border-green-300 bg-green-50'
            )}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              {getStatusIcon()}
              
              <div>
                <p className="text-lg font-medium">
                  {getStatusText()}
                </p>
                
                {streamingState.status === 'idle' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    リアルタイム進捗表示で変換状況を確認
                  </p>
                )}
              </div>

              {/* ファイル情報 */}
              {streamingState.file && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📄 {streamingState.file.name}</p>
                  <p>📊 {formatFileSize(streamingState.file.size)}</p>
                </div>
              )}

              {/* 進捗バー */}
              {streamingState.status === 'streaming' && (
                <div className="w-full max-w-xs space-y-2">
                  <Progress value={streamingState.progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{streamingState.stage}</span>
                    <span>{streamingState.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          {(streamingState.status === 'error' || streamingState.status === 'completed') && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>リセット</span>
              </Button>
            </div>
          )}

          {/* ログ表示 */}
          {streamingState.logs.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">リアルタイムログ:</h3>
              <div className="bg-gray-50 p-3 rounded text-xs max-h-32 overflow-y-auto space-y-1">
                {streamingState.logs.map((log, index) => (
                  <p key={index} className="text-gray-700 font-mono">
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}