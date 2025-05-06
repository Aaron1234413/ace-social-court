
import React from 'react';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
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
  // Check if the error is related to OpenAI quota
  const isQuotaError = error.message?.toLowerCase().includes('quota') || 
    error.message?.toLowerCase().includes('exceeded') || 
    error.message?.toLowerCase().includes('billing') ||
    error.message?.toLowerCase().includes('openai api') ||
    error.message?.toLowerCase().includes('api key');

  // Check for connection errors
  const isConnectionError = error.message?.toLowerCase().includes('network') ||
    error.message?.toLowerCase().includes('connect') ||
    error.message?.toLowerCase().includes('timeout') ||
    error.message?.toLowerCase().includes('offline');

  console.log("Rendering APIErrorDisplay with error:", error);

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-5 w-5 mr-2" />
      <AlertTitle className="text-base font-medium mb-2">
        {isQuotaError ? 'API Quota Exceeded' : 
          isConnectionError ? 'Connection Error' : 'Error'}
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
