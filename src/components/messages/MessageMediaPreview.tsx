
import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface MessageMediaPreviewProps {
  url: string;
  type: 'image' | 'video';
  className?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  onRemove?: () => void;
}

const MessageMediaPreview = ({ 
  url, 
  type, 
  className,
  uploadProgress = 100,
  isUploading = false,
  onRemove
}: MessageMediaPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load media');
  };

  return (
    <div className={cn("relative rounded-md overflow-hidden", className)}>
      {/* Loading overlay while the media is loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
          <div className="text-center p-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setIsLoading(true)}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <Progress 
            value={uploadProgress} 
            className="w-3/4 h-1.5 mt-2" 
            aria-label="Upload progress" 
          />
          <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <Button
          type="button"
          size="icon"
          variant="destructive"
          className="absolute top-1 right-1 h-6 w-6 rounded-full z-30"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </Button>
      )}

      {type === 'image' ? (
        <img 
          src={url} 
          alt="Message attachment" 
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <video 
          src={url} 
          controls 
          className="w-full h-full"
          onLoadedData={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
};

export default MessageMediaPreview;
