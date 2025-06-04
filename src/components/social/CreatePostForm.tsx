import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon, VideoIcon, X, Camera, Zap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PrivacySelector, PrivacyLevel } from './PrivacySelector';
import { PostTemplateSelector } from './PostTemplateSelector';
import { useSocialMediaUpload } from '@/hooks/use-social-media-upload';
import { useUserFollows } from '@/hooks/useUserFollows';

interface CreatePostFormProps {
  onSuccess?: () => void;
}

export function CreatePostForm({ onSuccess }: CreatePostFormProps) {
  const { user, profile } = useAuth();
  const { followingCount } = useUserFollows();
  const [content, setContent] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('private');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploadFile,
    uploadProgress,
    isUploading,
  } = useSocialMediaUpload();

  // Auto-adjust privacy based on follow count
  useEffect(() => {
    if (followingCount < 3) {
      setPrivacyLevel('private');
    }
  }, [followingCount]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setSelectedFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !content.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }

    setIsSubmitting(true);
    
    try {
      let mediaUrl = null;
      let mediaType = null;

      // Upload media if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(selectedFile, user.id);
        if (uploadResult.success && uploadResult.url) {
          mediaUrl = uploadResult.url;
          mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'video';
        } else {
          throw new Error('Failed to upload media');
        }
      }

      // Create the post
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          privacy_level: privacyLevel,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;

      // Reset form
      setContent('');
      setPrivacyLevel(followingCount >= 3 ? 'public' : 'private');
      removeMedia();
      setShowTemplates(false);
      
      toast.success('Post created successfully!');
      onSuccess?.();
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTemplateSelect = (template: { content_template: string; placeholders?: string[] }) => {
    setContent(template.content_template);
    setShowTemplates(false);
  };

  const isFormValid = content.trim().length > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="What's happening in your tennis world?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0 text-lg placeholder:text-muted-foreground"
                maxLength={500}
              />
              
              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative inline-block rounded-lg overflow-hidden border">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="max-w-full h-auto max-h-60 object-cover"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="max-w-full h-auto max-h-60"
                    />
                  )}
                  <Button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    size="icon"
                    variant="destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Upload Progress */}
              {isUploading && uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Privacy Selector */}
          <PrivacySelector 
            value={privacyLevel} 
            onValueChange={setPrivacyLevel}
            followingCount={followingCount}
          />

          {/* Character Counter */}
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{content.length}/500 characters</span>
          </div>

          {/* Post Templates */}
          {showTemplates && (
            <PostTemplateSelector onSelectTemplate={handleTemplateSelect} />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-muted-foreground hover:text-foreground"
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Photo
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Zap className="h-4 w-4 mr-1" />
                Templates
              </Button>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting || isUploading}
              className="px-6"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
