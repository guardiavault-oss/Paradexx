// Error Boundary Component
import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Here you would send to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
          <Card className="p-12 bg-[#1a1a1a] border-[#2a2a2a] max-w-lg">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-white mb-2">Something went wrong</h2>
              <p className="text-gray-400 mb-6">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="text-gray-500 text-sm cursor-pointer mb-2">
                    Error details
                  </summary>
                  <pre className="text-xs bg-[#0a0a0a] p-4 rounded border border-[#2a2a2a] overflow-auto text-red-400">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleReset} className="bg-emerald-600 hover:bg-emerald-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error states
export function ErrorState({ 
  title = 'Error', 
  message = 'Something went wrong',
  onRetry 
}: { 
  title?: string; 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <Card className="p-12 bg-[#1a1a1a] border-[#2a2a2a] text-center">
      <div className="max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
}

export function APIErrorState({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <ErrorState
      title="API Error"
      message={error || 'Failed to load data from the server. Please try again.'}
      onRetry={onRetry}
    />
  );
}

export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection."
      onRetry={onRetry}
    />
  );
}

export function PermissionDeniedState() {
  return (
    <ErrorState
      title="Permission Denied"
      message="You don't have permission to access this resource. Please contact your administrator."
    />
  );
}

export function TimeoutErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Request Timeout"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
    />
  );
}
