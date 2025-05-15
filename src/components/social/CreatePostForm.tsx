
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import MediaUploader from '@/components/media/MediaUploader';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Loader2, Send, Image, X } from 'lucide-react';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploaderVisible, setIsUploaderVisible] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to create a post.');
      return;
    }

    if (!content.trim() && !mediaUrl) {
      toast.error('Please enter some text or upload media to create a post.');
      return;
    }

    setIsSubmitting(true);

    try {
      const postId = uuidv4();

      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            id: postId,
            user_id: user.id,
            content: content,
            media_url: mediaUrl,
            media_type: mediaType,
          },
        ]);

      if (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post. Please try again.');
      } else {
        toast.success('Post created successfully!');
        setContent('');
        setMediaUrl(null);
        setMediaType(null);
        setIsUploaderVisible(false);
        if (onPostCreated) {
          onPostCreated();
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaUpload = (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setIsUploaderVisible(false);
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
  };

  return (
    <Card className="w-full overflow-hidden border-muted/70">
      <div className="bg-gradient-to-r from-muted/30 to-background p-4 border-b">
        <h3 className="font-medium text-sm md:text-base">Create Post</h3>
      </div>
      <div className="flex items-start space-x-4 p-4">
        <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-muted">
          <img
            src={profile?.avatar_url || `/avatars/avatar-${Math.floor(Math.random() * 7) + 1}.svg`}
            alt={profile?.full_name || "Avatar"}
            className="rounded-full"
          />
        </Avatar>
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none focus:ring-primary text-base"
          />
          
          {mediaUrl && (
            <div className="relative rounded-md overflow-hidden border border-muted/50">
              {mediaType === 'image' ? (
                <img src={mediaUrl} alt="Upload preview" className="max-h-48 w-full object-contain bg-muted/30" />
              ) : (
                <video src={mediaUrl} className="max-h-48 w-full" controls />
              )}
              <Button 
                size="sm" 
                variant="destructive" 
                className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full opacity-80 hover:opacity-100"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {isUploaderVisible && (
            <div className="bg-muted/30 rounded-md p-4 border border-dashed border-muted">
              <MediaUploader
                onMediaUpload={handleMediaUpload}
                allowedTypes={['image', 'video']}
              />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/30"
              onClick={() => setIsUploaderVisible(!isUploaderVisible)}
            >
              <Image className="mr-2 h-4 w-4" />
              {mediaUrl ? 'Change Media' : 'Add Media'}
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-tennis-blue to-primary hover:from-primary hover:to-tennis-blue transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreatePostForm;
