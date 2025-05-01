
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostForm } from './post/CreatePostForm';
import { toast } from 'sonner';
import { getUsableBucket } from '@/integrations/supabase/storage';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export const CreatePostModal = ({ open, onOpenChange, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const { toast: uiToast } = useToast();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  useEffect(() => {
    // Always use 'media' bucket
    async function checkBucket() {
      const bucketToUse = await getUsableBucket();
      setActiveBucket(bucketToUse);
      console.log(`CreatePostModal will use '${bucketToUse}' bucket`);
    }
    
    if (open) {
      checkBucket();
    }
  }, [open]);

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
      toast.error("Unsupported file type. Please upload an image or video file");
      return;
    }

    // Check file size (100MB max)
    const maxSize = 100000000; // 100MB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 100MB`);
      return;
    }

    console.log(`Selected file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
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
      toast.error("Please sign in to create a post");
      return;
    }

    if (!mediaFile) {
      toast.error("Please upload an image or video");
      return;
    }

    if (!activeBucket) {
      toast.error("Media storage is not available. Please try refreshing the page.");
      return;
    }

    console.log("Starting post creation with media:", {
      fileName: mediaFile.name,
      fileSize: mediaFile.size,
      fileType: mediaFile.type,
      mediaType,
      bucketToUse: activeBucket
    });

    try {
      setIsUploading(true);
      toast.info("Starting file upload, please wait...");
      
      // Upload media file to storage using the media bucket
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      console.log(`Starting upload to ${activeBucket}/${filePath}`);
      console.log(`File type: ${mediaFile.type}, size: ${mediaFile.size} bytes`);
      
      // Upload file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase
        .storage
        .from(activeBucket)
        .upload(filePath, mediaFile, {
          cacheControl: '3600',
          contentType: mediaFile.type,
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log("Media uploaded successfully:", uploadData);

      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from(activeBucket)
        .getPublicUrl(filePath);

      const mediaUrl = publicUrlData.publicUrl;
      console.log("Media public URL:", mediaUrl);

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
        console.error("Post creation error:", postError);
        throw new Error(`Post creation failed: ${postError.message}`);
      }

      toast.success("Your post has been published successfully");
      
      onPostCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || "An error occurred while creating your post");
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
            Share your tennis moments with images or videos (up to 100MB)
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
