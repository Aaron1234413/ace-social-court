
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { PostMediaPreview } from './PostMediaPreview';
import { MediaUploadPlaceholder } from './MediaUploadPlaceholder';

interface CreatePostFormProps {
  caption: string;
  setCaption: (caption: string) => void;
  mediaFile: File | null;
  mediaPreview: string | null;
  mediaType: 'image' | 'video' | null;
  isUploading: boolean;
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onClearMedia: () => void;
}

export const CreatePostForm = ({
  caption,
  setCaption,
  mediaFile,
  mediaPreview,
  mediaType,
  isUploading,
  onMediaSelect,
  onSubmit,
  onCancel,
  onClearMedia,
}: CreatePostFormProps) => {
  return (
    <div className="space-y-4">
      {!mediaPreview ? (
        <MediaUploadPlaceholder 
          onClick={() => document.getElementById('media-upload')?.click()} 
        />
      ) : (
        <PostMediaPreview 
          mediaPreview={mediaPreview}
          mediaType={mediaType}
          onChangeMedia={onClearMedia}
        />
      )}

      <input
        id="media-upload"
        type="file"
        accept="image/*,video/*"
        onChange={onMediaSelect}
        className="hidden"
      />

      <div>
        <Textarea 
          placeholder="Write a caption..." 
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="resize-none"
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!mediaFile || isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Share'
          )}
        </Button>
      </div>
    </div>
  );
};
