'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { UploadStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ConversionProgressProps {
  status: UploadStatus;
  progress: number;
  fileName?: string;
  estimatedTime?: number;
  currentStep?: string;
  error?: string;
}

export function ConversionProgress({
  status,
  progress,
  fileName,
  estimatedTime,
  currentStep,
  error
}: ConversionProgressProps) {
  // ステータスに応じたアイコンを取得
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // ステータスに応じたタイトルを取得
  const getStatusTitle = () => {
    switch (status) {
      case 'uploading':
        return 'ファイルをアップロード中';
      case 'processing':
        return 'PDFを変換中';
      case 'completed':
        return '変換完了';
      case 'error':
        return '変換エラー';
      default:
        return '待機中';
    }
  };

  // ステータスに応じた説明を取得
  const getStatusDescription = () => {
    if (error) return error;
    
    switch (status) {
      case 'uploading':
        return 'ファイルをサーバーにアップロードしています...';
      case 'processing':
        return currentStep || 'Gemini APIでPDFからMarkdownに変換しています...';
      case 'completed':
        return 'PDFからMarkdownへの変換が正常に完了しました';
      case 'error':
        return '変換中にエラーが発生しました';
      default:
        return 'ファイルの選択をお待ちしています';
    }
  };

  // 進捗ステップの定義
  const steps = [
    { key: 'upload', label: 'アップロード', minProgress: 0 },
    { key: 'validation', label: 'ファイル検証', minProgress: 20 },
    { key: 'processing', label: 'AI変換', minProgress: 40 },
    { key: 'formatting', label: '整形処理', minProgress: 80 },
    { key: 'complete', label: '完了', minProgress: 100 },
  ];

  // 現在のステップを取得
  const getCurrentStepIndex = () => {
    if (status === 'completed') return steps.length - 1;
    if (status === 'error') return -1;
    
    for (let i = steps.length - 1; i >= 0; i--) {
      if (progress >= steps[i].minProgress) {
        return i;
      }
    }
    return 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>{getStatusTitle()}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ファイル名 */}
        {fileName && (
          <div className="text-sm text-muted-foreground">
            📄 {fileName}
          </div>
        )}

        {/* 進捗バー */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress}%</span>
              {estimatedTime && (
                <span className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>約{estimatedTime}秒</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ステップ表示 */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className={cn(
                  'flex items-center space-x-3 text-sm',
                  index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    index < currentStepIndex && 'bg-green-500',
                    index === currentStepIndex && 'bg-blue-500 animate-pulse',
                    index > currentStepIndex && 'bg-gray-300'
                  )}
                />
                <span>{step.label}</span>
                {index <= currentStepIndex && (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ステータス説明 */}
        <p className={cn(
          'text-sm',
          status === 'error' ? 'text-red-600' : 'text-muted-foreground'
        )}>
          {getStatusDescription()}
        </p>

        {/* 完了時の統計情報 */}
        {status === 'completed' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">変換統計</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
              <div>✅ 変換成功</div>
              <div>📝 Markdown形式</div>
              <div>🔢 数式対応</div>
              <div>📊 表形式対応</div>
            </div>
          </div>
        )}

        {/* エラー詳細 */}
        {status === 'error' && error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">エラー詳細</h4>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}