'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { safeLog } = require('@/lib/errorHandler');
    safeLog.error('ErrorBoundary capturou um erro:', { error, errorInfo });
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-rose-200 bg-white p-6 text-center shadow-xl dark:border-rose-900 dark:bg-slate-900">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100 mb-2">
              Algo deu errado
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:scale-105"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-700 hover:scale-105"
              >
                Recarregar página
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  Detalhes do erro (dev)
                </summary>
                <pre className="mt-2 text-xs text-slate-800 dark:text-slate-200 overflow-auto max-h-40 p-2 bg-slate-100 dark:bg-slate-800 rounded">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

