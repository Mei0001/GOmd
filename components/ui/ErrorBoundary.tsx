'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '@/lib/error-handler';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, 'ErrorBoundary');
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl text-red-800">
                予期しないエラーが発生しました
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                <p>アプリケーションでエラーが発生しました。</p>
                <p>お手数ですが、以下の操作をお試しください。</p>
              </div>

              {/* エラーの詳細（開発環境のみ） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs bg-gray-50 p-3 rounded">
                  <summary className="cursor-pointer font-medium text-red-700">
                    エラーの詳細 (開発環境)
                  </summary>
                  <pre className="mt-2 text-red-600 overflow-auto">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={this.handleReset}
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>再試行</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={this.handleReload}
                  className="flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>ページを再読み込み</span>
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>ホームに戻る</span>
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                問題が解決しない場合は、
                <a 
                  href="https://github.com/Mei0001/GOmd/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-1"
                >
                  こちらからお知らせください
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 関数型コンポーネント用のHOC
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}