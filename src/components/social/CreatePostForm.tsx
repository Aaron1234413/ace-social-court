
import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCreatePost } from '@/hooks/use-posts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, Send } from 'lucide-react';
import MentionInput from './MentionInput';
import MediaUploader from '../media/MediaUploader';
import { toast } from 'sonner';

interface CreatePostFormProps {
  onSuccess?: () => void;
  onPostCreated?: () => void; // Added to support existing code
}

const CreatePostForm = ({ onSuccess, onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const { createPost, isCreatingPost } = useCreatePost();

  if (!user) {
    return null;
  }

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    console.log("Media uploaded successfully:", { url, type });
    setMediaUrl(url);
    setMediaType(type);
    setShowMediaUploader(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!content.trim() && !mediaUrl) || isCreatingPost) {
      if (!content.trim() && !mediaUrl) {
        toast.error('Please add some content or media to your post');
      }
      return;
    }
    
    console.log("Creating post with:", {
      content: content.trim(),
      mediaUrl,
      mediaType
    });
    
    try {
      await createPost({
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType
      });
      
      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      setShowMediaUploader(false);
      
      onSuccess?.();
      onPostCreated?.(); // Call both callbacks for backward compatibility
      
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <form className="flex-1" onSubmit={handleSubmit}>
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder="What's happening in your tennis world?"
            minRows={2}
            maxRows={5}
          />
          
          {showMediaUploader && (
            <div className="mt-3">
              <MediaUploader
                onMediaUpload={handleMediaUpload}
                bucketName="media"
              />
            </div>
          )}
          
          {mediaUrl && !showMediaUploader && (
            <div className="mt-3 relative rounded-md overflow-hidden border">
              {mediaType === 'image' ? (
                <img 
                  src={mediaUrl} 
                  alt="Uploaded media" 
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
                onClick={() => {
                  setMediaUrl(null);
                  setMediaType(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              disabled={isCreatingPost}
              onClick={() => setShowMediaUploader(!showMediaUploader)}
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {mediaUrl ? 'Change Media' : 'Add Media'}
              </span>
            </Button>
            
            <Button 
              type="submit" 
              size="sm"
              disabled={((!content.trim() && !mediaUrl) || isCreatingPost)}
            >
              {isCreatingPost ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;
