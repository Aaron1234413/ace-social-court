import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccessToast, showErrorToast } from '@/components/ui/use-toast';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { Loader2, Image, X } from 'lucide-react';
import { Post } from '@/types/post';

interface PostComposerProps {
  onSuccess?: (post: Post) => void;
  className?: string;
  matchData?: any;
  sessionData?: any;
}

export const PostComposer = ({ onSuccess, className = "", matchData, sessionData }: PostComposerProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const uploadMedia = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(fileName, file);

      if (error) {
        console.error('Storage upload error:', error);
        showErrorToast("Media upload failed", error.message);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      };
    } catch (error) {
      console.error('Media upload error:', error);
      showErrorToast("Media upload failed", "Please try again");
      return null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showErrorToast("File too large", "Please select a file smaller than 10MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showErrorToast("Invalid file type", "Please select an image or video file");
      return;
    }

    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      showErrorToast("Authentication required", "Please sign in to create a post");
      return;
    }

    if (!content.trim() && !mediaFile) {
      showErrorToast("Content required", "Please enter some content or upload an image");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        const uploadResult = await uploadMedia(mediaFile);
        if (uploadResult) {
          mediaUrl = uploadResult.url;
          mediaType = uploadResult.type;
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: content.trim(),
          user_id: user.id,
          privacy_level: privacyLevel,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select(`
          *,
          profiles(
            id,
            full_name,
            user_type,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating post:', error);
        showErrorToast("Failed to create post", error.message);
        return;
      }

      // Format the post with author information
      const newPost: Post = {
        ...data,
        author: data.profiles || null
      };

      console.log('✅ Post created successfully:', newPost.id);
      showSuccessToast("Post created successfully!");
      
      // Reset form
      setContent('');
      setPrivacyLevel('public');
      setMediaFile(null);
      setMediaPreview(null);
      
      // Notify parent component
      if (onSuccess) {
        onSuccess(newPost);
      }

    } catch (error: any) {
      console.error('Unexpected error creating post:', error);
      showErrorToast("Unexpected error", "Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? Share your tennis journey, tips, or thoughts..."
            className="min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          
          {mediaPreview && (
            <div className="relative">
              {mediaFile?.type.startsWith('image/') ? (
                <img 
                  src={mediaPreview} 
                  alt="Preview" 
                  className="max-h-48 rounded-lg object-cover"
                />
              ) : (
                <video 
                  src={mediaPreview} 
                  className="max-h-48 rounded-lg"
                  controls
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeMedia}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="media-upload">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                  asChild
                >
                  <span>
                    <Image className="h-4 w-4 mr-1" />
                    Add Photo/Video
                  </span>
                </Button>
              </label>
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSubmitting}
              />
              
              <PrivacySelector
                value={privacyLevel}
                onValueChange={setPrivacyLevel}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || (!content.trim() && !mediaFile)}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
