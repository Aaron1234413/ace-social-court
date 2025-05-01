
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostForm } from './post/CreatePostForm';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const resetState = () => {
    setCaption('');
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      toast({
        title: "Unsupported file type",
        description: "Please upload an image or video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5GB max for video with Pro tier, 100MB max for image)
    const maxSize = fileType === 'video' ? 5000000000 : 100000000;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `File size should be less than ${fileType === 'video' ? '5GB (Supabase Pro tier)' : '100MB'}`,
        variant: "destructive",
      });
      return;
    }

    setMediaFile(file);
    setMediaType(fileType as 'image' | 'video');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a post",
        variant: "destructive",
      });
      return;
    }

    if (!mediaFile) {
      toast({
        title: "Media required",
        description: "Please upload an image or video",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload media file to storage
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      const { error: uploadError } = await supabase
        .storage
        .from('posts')
        .upload(filePath, mediaFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('posts')
        .getPublicUrl(filePath);

      const mediaUrl = publicUrlData.publicUrl;

      // Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();

      if (postError) {
        throw postError;
      }

      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
      
      onPostCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Failed to create post",
        description: "An error occurred while creating your post",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your tennis moments with images (up to 100MB) or videos (up to 5GB with Supabase Pro)
          </DialogDescription>
        </DialogHeader>
        
        <CreatePostForm
          caption={caption}
          setCaption={setCaption}
          mediaFile={mediaFile}
          mediaPreview={mediaPreview}
          mediaType={mediaType}
          isUploading={isUploading}
          onMediaSelect={handleFileChange}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          onClearMedia={handleClearMedia}
        />
      </DialogContent>
    </Dialog>
  );
};
