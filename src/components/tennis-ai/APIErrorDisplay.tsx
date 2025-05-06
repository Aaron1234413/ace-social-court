
import React from 'react';
import { AlertCircle, RefreshCw, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface APIErrorDisplayProps {
  error: {
    message: string;
    type?: string;
    retry?: () => void;
  };
  className?: string;
}

const APIErrorDisplay: React.FC<APIErrorDisplayProps> = ({ error, className }) => {
  // Enhanced error type detection
  const isQuotaError = error.message?.toLowerCase().includes('quota') || 
    error.message?.toLowerCase().includes('exceeded') || 
    error.message?.toLowerCase().includes('billing') ||
    error.message?.toLowerCase().includes('openai api') ||
    error.message?.toLowerCase().includes('api key') ||
    error.message?.toLowerCase().includes('rate limit');

  // Check for connection errors with more comprehensive patterns
  const isConnectionError = error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('connect') ||
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('offline') ||
    error.message?.toLowerCase().includes('socket') ||
    error.message?.toLowerCase().includes('websocket') ||
    error.message?.toLowerCase().includes('failed to fetch') ||
    error.message?.toLowerCase().includes('econnrefused');

  // Check for database errors
  const isDatabaseError = error.message?.toLowerCase().includes('database') ||
    error.message?.toLowerCase().includes('duplicate key') ||
    error.message?.toLowerCase().includes('constraint') ||
    error.message?.toLowerCase().includes('violation') ||
    error.message?.toLowerCase().includes('supabase');

  console.log("Rendering APIErrorDisplay with error:", error, 
    "isQuotaError:", isQuotaError, 
    "isConnectionError:", isConnectionError,
    "isDatabaseError:", isDatabaseError);

  return (
    <Alert variant="destructive" className={className}>
      {isConnectionError ? <WifiOff className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
      <AlertTitle className="text-base font-medium mb-2">
        {isQuotaError ? 'API Quota Exceeded' : 
          isConnectionError ? 'Connection Error' : 
          isDatabaseError ? 'Database Error' : 
          'Error'}
      </AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{error.message || "An unknown error occurred"}</p>
        
        {isQuotaError ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm">The OpenAI API quota has been exceeded or there's an issue with the API key. Please check your billing details or contact the administrator.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <a 
                href="https://platform.openai.com/account/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 bg-background text-foreground rounded border hover:bg-accent transition-colors text-sm"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Check OpenAI Billing</span>
              </a>
            </div>
          </div>
        ) : isConnectionError ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm">There seems to be a connection issue. Please check your internet connection and try again.</p>
            {error.retry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={error.retry}
                className="flex items-center gap-1 mt-2"
              >
                <Wifi className="h-3 w-3" />
                <span>Reconnect</span>
              </Button>
            )}
          </div>
        ) : isDatabaseError ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm">There was an issue with the database operation. This might be due to a duplicate record or constraint violation.</p>
            {error.retry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={error.retry}
                className="flex items-center gap-1 mt-2"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Try Again</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex justify-start mt-2">
            {error.retry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={error.retry}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Try Again</span>
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default APIErrorDisplay;
