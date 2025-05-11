
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const AppErrorFallback: React.FC<AppErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary 
}) => {
  console.error('App error boundary caught error:', error);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card p-6 rounded-lg shadow-lg border">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          
          <div className="bg-muted/50 p-4 rounded-md w-full overflow-auto max-h-[200px]">
            <pre className="text-xs text-left whitespace-pre-wrap break-all">
              {error.message}
              {error.stack && (
                <>
                  <br />
                  <br />
                  {error.stack}
                </>
              )}
            </pre>
          </div>
          
          <p className="text-muted-foreground">
            We've encountered an unexpected error. Please try refreshing the page.
          </p>
          
          <div className="flex gap-4">
            <Button onClick={resetErrorBoundary}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppErrorFallback;
