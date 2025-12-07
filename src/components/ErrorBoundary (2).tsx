import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  type?: 'degen' | 'regen';
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const { type = 'degen' } = this.props;
      const isDegen = type === 'degen';
      const accentColor = isDegen ? '#DC143C' : '#0080FF';

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full"
          >
            {/* Error Icon */}
            <motion.div
              className="flex justify-center mb-6"
              animate={{
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            >
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: `${accentColor}20`,
                  border: `2px solid ${accentColor}`,
                }}
              >
                <AlertTriangle className="w-12 h-12" style={{ color: accentColor }} />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-black uppercase text-center text-white mb-4"
            >
              Oops! Something Broke
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center text-white/60 mb-8"
            >
              Don't worry, {isDegen ? 'degen' : 'regen'}. We've caught the error before it could do more damage.
            </motion.p>

            {/* Error Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-white/5 border border-white/10 mb-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <Bug className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white mb-1">Error Details</h3>
                  <p className="text-xs text-red-400 break-all">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </p>
                </div>
              </div>

              {/* Stack Trace (collapsed by default) */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-white/40 mt-4">
                  <summary className="cursor-pointer hover:text-white/60 mb-2">
                    View Stack Trace
                  </summary>
                  <pre className="overflow-x-auto p-3 bg-black rounded-lg">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{
                  background: accentColor,
                }}
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleReload}
                className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleGoHome}
                className="px-6 py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
              >
                <Home className="w-5 h-5" />
                Go Home
              </motion.button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-xs text-white/40">
                If this problem persists, please contact support with the error details above.
              </p>
            </motion.div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage
export function ErrorBoundaryWrapper({
  children,
  type = 'degen',
  onReset,
}: {
  children: ReactNode;
  type?: 'degen' | 'regen';
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary type={type} onReset={onReset}>
      {children}
    </ErrorBoundary>
  );
}
