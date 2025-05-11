
import React from 'react';
import MessageMediaPreview from './MessageMediaPreview';
import { Loading } from '@/components/ui/loading';

interface MessageMediaProps {
  url: string;
  type: 'image' | 'video';
  uploadProgress?: number;
  isUploading?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const MessageMedia = ({ 
  url, 
  type, 
  uploadProgress, 
  isUploading,
  isLoading = false,
  error = null
}: MessageMediaProps) => {
  
  // Show error state if there's an error
  if (error) {
    return (
      <div className="w-full max-w-[300px]">
        <Loading 
          variant="error"
          error={{
            message: "Error loading media",
            guidance: error
          }}
          className="h-[200px]"
        />
      </div>
    );
  }
  
  // Show loading state while loading
  if (isLoading && !url) {
    return (
      <div className="w-full max-w-[300px]">
        <Loading 
          variant="spinner"
          text="Loading media..."
          className="h-[200px]"
        />
      </div>
    );
  }

  return (
    <MessageMediaPreview 
      url={url} 
      type={type}
      className="w-full max-w-[300px]" 
      uploadProgress={uploadProgress}
      isUploading={isUploading}
    />
  );
};

export default MessageMedia;
