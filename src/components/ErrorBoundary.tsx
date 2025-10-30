'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-white p-8 shadow-sm">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900">문제가 발생했습니다.</h1>
              <p className="mt-2 text-sm text-gray-600">
                잠시 후 다시 시도하거나 아래 버튼을 눌러 페이지를 새로고침하세요.
              </p>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <pre className="max-h-64 w-full overflow-auto rounded-md bg-gray-900 p-4 text-left text-xs text-gray-100">
                {this.state.error.stack}
              </pre>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-2 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
            >
              <RefreshCw className="h-4 w-4" />
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
