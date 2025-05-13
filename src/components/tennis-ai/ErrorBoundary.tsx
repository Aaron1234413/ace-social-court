
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: React.ReactNode | ((props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode);
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    console.log("Error caught in ErrorBoundary getDerivedStateFromError:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console with additional details
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
    
    // Notify user with toast for better visibility
    toast.error("An error occurred in the application", {
      description: error.message
    });
  }

  resetErrorBoundary = (): void => {
    console.log("Resetting error boundary");
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        // Handle both ReactNode and function fallbacks
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error as Error,
            resetErrorBoundary: this.resetErrorBoundary
          });
        }
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-background/95 rounded-lg border shadow-sm h-full">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-6 max-w-md text-center">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="text-xs text-muted-foreground mb-6 max-w-md text-center overflow-auto max-h-[200px]">
            <pre className="whitespace-pre-wrap">
              {this.state.error?.stack}
            </pre>
          </div>
          <Button 
            onClick={this.resetErrorBoundary} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
