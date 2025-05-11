
import React from 'react';
import MessageMediaPreview from './MessageMediaPreview';

interface MessageMediaProps {
  url: string;
  type: 'image' | 'video';
  uploadProgress?: number;
  isUploading?: boolean;
}

const MessageMedia = ({ url, type, uploadProgress, isUploading }: MessageMediaProps) => {
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
