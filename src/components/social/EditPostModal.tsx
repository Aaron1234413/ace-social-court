
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEditPost } from '@/hooks/use-posts';
import { Post } from '@/types/post';
import { Loader2 } from 'lucide-react';
import MentionInput from './MentionInput';
import SocialMediaUploader from '@/components/media/SocialMediaUploader';

interface EditPostModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostEdited: () => void;
}

export const EditPostModal = ({ post, open, onOpenChange, onPostEdited }: EditPostModalProps) => {
  const [content, setContent] = useState('');
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const { editPost, isEditing } = useEditPost();

  useEffect(() => {
    if (open) {
      setContent(post.content || '');
      setMediaUrl(post.media_url || null);
      setMediaType(post.media_type as 'image' | 'video' | null || null);
    }
  }, [open, post]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setShowMediaUploader(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaUrl) {
      return;
    }

    const success = await editPost(post.id, {
      content: content.trim(),
      media_url: mediaUrl,
      media_type: mediaType
    });

    if (success) {
      onPostEdited();
    }
  };

  const handleClearMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <MentionInput
              value={content}
              onChange={setContent}
              placeholder="What's happening in your tennis world?"
              minRows={3}
              maxRows={6}
            />
          </div>
          
          {showMediaUploader ? (
            <div>
              <SocialMediaUploader
                onMediaUpload={handleMediaUpload}
                bucketName="posts"
                allowedTypes={['image', 'video']}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMediaUploader(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {mediaUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  {mediaType === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt="Media preview"
                      className="max-h-48 w-auto mx-auto"
                    />
                  ) : mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="max-h-48 w-auto mx-auto"
                    />
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleClearMedia}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaUploader(true)}
                >
                  Add Media
                </Button>
              )}
            </>
          )}
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isEditing || (!content.trim() && !mediaUrl)}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
