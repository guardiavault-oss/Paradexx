import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useLocation } from "wouter";
import { logError } from "../utils/logger";

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
    logError(error, {
      context: "ErrorBoundary",
      componentStack: errorInfo.componentStack,
    });

    // Log to error tracking service (Sentry, etc.)
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }

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

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const [, setLocation] = useLocation();
  const [showDetails, setShowDetails] = React.useState(false);

  // Use window.location as fallback if router navigation fails
  const navigateTo = (path: string) => {
    try {
      setLocation(path);
    } catch (err) {
      // Fallback to window.location if router fails
      window.location.href = path;
    }
  };

  const handleTryAgain = () => {
    try {
      onReset();
    } catch (err) {
      // If reset fails, reload the page
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-2xl w-full glass-card p-8 sm:p-12 text-center space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 display-font">
            Something went wrong
          </h1>
          <p className="text-slate-400 text-lg mb-2">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <p className="text-slate-500 text-sm">
            {error?.message || "An unknown error occurred"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleTryAgain}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => navigateTo("/dashboard")}
            variant="outline"
            className="min-h-[44px]"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigateTo("/dashboard/support")}
            variant="outline"
            className="min-h-[44px]"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>

        {error && (
          <div className="mt-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              {showDetails ? "Hide" : "Show"} technical details
            </button>
            {showDetails && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg text-left">
                <pre className="text-xs text-slate-400 overflow-auto max-h-64">
                  {error.stack || error.toString()}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500">
            If this problem persists, please contact support with the error details above.
          </p>
        </div>
      </div>
    </div>
  );
}

