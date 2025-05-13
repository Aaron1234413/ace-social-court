import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import MediaUploader from '@/components/media/MediaUploader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated?: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setCaption('');
      setMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      setMediaUrl(null);
      setUploadProgress(0);
    }
  }, [open]);

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!caption.trim() && !mediaUrl) {
      toast.error('Please add a caption or media to your post');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const postId = uuidv4();
      
      // Create the post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          id: postId,
          user_id: user.id,
          content: caption,
          media_url: mediaUrl,
          media_type: mediaType,
        });
        
      if (postError) {
        throw postError;
      }
      
      // Try to create notifications but handle errors gracefully
      try {
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: user.id,
              type: 'new_post',
              content: 'New post created',
              entity_id: postId,
              entity_type: 'post'
            }
          ]);
        
        if (notifyError) {
          console.error('Error creating notifications:', notifyError);
        }
      } catch (notifyError) {
        console.error('Error in notification process:', notifyError);
      }
      
      toast.success('Post created successfully!');
      
      // Close modal and refresh the parent component
      onOpenChange(false);
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(`Failed to create post: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share a photo, video, or update with your followers
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <MediaUploader
              onMediaUpload={handleMediaUpload}
              onProgress={setUploadProgress}
              allowedTypes={['image', 'video']}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || ((!caption || !caption.trim()) && !mediaUrl)}
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
