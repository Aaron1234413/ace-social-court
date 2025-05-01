
import React from 'react';
import { Button } from '@/components/ui/button';
import { Image, Video, Upload } from 'lucide-react';

interface MediaUploadPlaceholderProps {
  onClick: () => void;
}

export const MediaUploadPlaceholder = ({ onClick }: MediaUploadPlaceholderProps) => {
  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center">
      <div className="flex justify-center mb-4">
        <Image className="mr-2 h-6 w-6 text-muted-foreground" />
        <Video className="ml-2 h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop an image or video (max 5GB with Pro plan), or click to browse
      </p>
      <Button
        variant="outline"
        onClick={onClick}
        className="relative"
      >
        <Upload className="mr-2 h-4 w-4" />
        Select Media
      </Button>
    </div>
  );
};
