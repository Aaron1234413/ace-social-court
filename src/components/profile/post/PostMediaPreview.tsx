
import React from 'react';
import { Button } from '@/components/ui/button';

interface PostMediaPreviewProps {
  mediaPreview: string;
  mediaType: 'image' | 'video' | null;
  onChangeMedia: () => void;
}

export const PostMediaPreview = ({ mediaPreview, mediaType, onChangeMedia }: PostMediaPreviewProps) => {
  if (!mediaPreview) return null;
  
  return (
    <div className="relative">
      <div className="aspect-square max-h-[350px] rounded-md overflow-hidden flex items-center justify-center bg-black">
        {mediaType === 'image' ? (
          <img 
            src={mediaPreview} 
            alt="Preview" 
            className="max-h-full max-w-full object-contain" 
          />
        ) : (
          <video 
            src={mediaPreview} 
            className="max-h-full max-w-full"
            controls
          />
        )}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-2 right-2"
        onClick={onChangeMedia}
      >
        Change
      </Button>
    </div>
  );
};
