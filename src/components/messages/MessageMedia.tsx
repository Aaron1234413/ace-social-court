
import React from 'react';
import MessageMediaPreview from './MessageMediaPreview';

interface MessageMediaProps {
  url: string;
  type: 'image' | 'video';
}

const MessageMedia = ({ url, type }: MessageMediaProps) => {
  return (
    <MessageMediaPreview 
      url={url} 
      type={type}
      className="w-full max-w-[300px]" 
    />
  );
};

export default MessageMedia;
