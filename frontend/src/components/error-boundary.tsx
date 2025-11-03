'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            {/* Error Message */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {this.state.error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 text-left">
                  <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-medium hover:from-primary-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gradient-to-br hover:from-primary-50 hover:to-purple-50 dark:hover:from-primary-900/20 dark:hover:to-purple-900/20 transition-all"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>

            {/* Support Info */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If this problem persists, try resetting your data in Settings
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
