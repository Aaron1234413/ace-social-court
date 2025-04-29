import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCreatePost } from '@/hooks/use-posts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, Send } from 'lucide-react';
import MentionInput from './MentionInput';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

const CreatePostForm = ({ onSuccess }: CreatePostFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const { createPost, isCreatingPost } = useCreatePost();

  if (!user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isCreatingPost) {
      return;
    }
    
    await createPost({
      content: content.trim(),
      media_url: null,
      media_type: null
    });
    
    setContent('');
    onSuccess?.();
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
          
          <div className="flex justify-between items-center mt-3">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              disabled={isCreatingPost}
              // Image upload functionality would go here
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Media</span>
            </Button>
            
            <Button 
              type="submit" 
              size="sm"
              disabled={!content.trim() || isCreatingPost}
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
