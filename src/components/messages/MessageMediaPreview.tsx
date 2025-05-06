
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface MessageMediaPreviewProps {
  url: string;
  type: 'image' | 'video';
  alt?: string;
  className?: string;
}

const MessageMediaPreview = ({ url, type, alt, className }: MessageMediaPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <div className={`relative overflow-hidden rounded-md ${className}`}>
          {isLoading && (
            <Skeleton className="absolute inset-0 flex items-center justify-center">
              Loading...
            </Skeleton>
          )}
          
          {error ? (
            <div className="bg-accent/30 p-3 rounded-md text-sm text-muted-foreground">
              Failed to load media
            </div>
          ) : type === 'image' ? (
            <img
              src={url}
              alt={alt || 'Image'}
              className={`max-h-48 object-cover rounded-md ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : (
            <video
              src={url}
              className={`max-h-48 object-cover rounded-md ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoadedData={handleLoad}
              onError={handleError}
              controls={false}
            />
          )}
        </div>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl p-1 bg-background">
        {type === 'image' ? (
          <img
            src={url}
            alt={alt || 'Image'}
            className="max-w-full max-h-[80vh] object-contain mx-auto"
          />
        ) : (
          <video
            src={url}
            className="max-w-full max-h-[80vh] object-contain mx-auto"
            controls
            autoPlay
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MessageMediaPreview;
