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
import { Loader2, Send } from 'lucide-react';

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, profile } = useAuth();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

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
  };

  return (
    <Card className="w-full">
      <div className="flex items-start space-x-4 p-4">
        <Avatar className="h-10 w-10">
          <img
            src={profile?.avatar_url || `/avatars/avatar-${Math.floor(Math.random() * 7) + 1}.svg`}
            alt={profile?.full_name || "Avatar"}
            className="rounded-full"
          />
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <MediaUploader
            onMediaUpload={handleMediaUpload}
            allowedTypes={['image', 'video']}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
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
