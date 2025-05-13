
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  uploadProgress?: number;
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
  uploadProgress = 0,
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

      {isUploading && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading {mediaType}...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isUploading}>
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
