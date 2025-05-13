
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostForm } from './post/CreatePostForm';
import { ErrorAlert } from '@/components/ui/error-alert';
import { initializeStorage } from '@/integrations/supabase/storage';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initialize storage buckets when the component mounts
  useEffect(() => {
    if (open) {
      const initStorage = async () => {
        try {
          await initializeStorage();
        } catch (error) {
          console.error('Failed to initialize storage buckets:', error);
        }
      };
      
      initStorage();
    }
  }, [open]);

  const resetState = () => {
    setCaption('');
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear any previous errors
    setUploadError(null);
    
    // Check file type
    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      setUploadError("Unsupported file type. Please upload an image or video file");
      toast({
        title: "Unsupported file type",
        description: "Please upload an image or video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size with updated limits for upgraded storage
    const maxSize = fileType === 'video' ? 5000000000 : 100000000; // 5GB for video, 100MB for images
    if (file.size > maxSize) {
      const sizeLimit = fileType === 'video' ? '5GB' : '100MB';
      setUploadError(`File too large. Maximum size for ${fileType} is ${sizeLimit}`);
      toast({
        title: "File too large",
        description: `File size should be less than ${fileType === 'video' ? '5GB' : '100MB'}`,
        variant: "destructive",
      });
      return;
    }

    // Set file and track progress during upload
    setMediaFile(file);
    setMediaType(fileType as 'image' | 'video');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Log details for debugging
    console.log('Selected file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });
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
      setUploadProgress(0);
      setUploadError(null);
      
      console.log(`Starting ${mediaType} upload: ${mediaFile.name}, size: ${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB`);
      
      // Upload media file to storage
      const fileExt = mediaFile.name.split('.').pop();
      const filePath = `${user.id}/${uuidv4()}.${fileExt}`;
      
      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(progress));
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
          }
        });
        
        xhr.onreadystatechange = async function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              // Get public URL after successful upload
              const { data: publicUrlData } = supabase
                .storage
                .from('posts')
                .getPublicUrl(filePath);
              
              resolve(publicUrlData.publicUrl);
            } else {
              let errorDetails = '';
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorDetails = `: ${errorResponse.error || errorResponse.message || ''}`;
              } catch (e) {
                // Ignore parse errors
              }
              
              const error = new Error(`Upload failed with status ${xhr.status}${errorDetails}`);
              console.error('Upload error:', error, xhr.responseText);
              reject(error);
            }
          }
        };
        
        // Get token for authenticated upload
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            reject(new Error('Authentication required'));
            return;
          }
          
          const url = `https://sdrndqcaskaitzcwgnaw.supabase.co/storage/v1/object/posts/${filePath}`;
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('x-upsert', 'true');
          
          // Log request details for debugging
          console.log('Upload request:', {
            url,
            method: 'POST',
            contentType: mediaFile.type,
            fileSize: `${(mediaFile.size / (1024 * 1024)).toFixed(2)} MB`
          });
          
          xhr.send(mediaFile);
        }).catch(reject);
      });
      
      const mediaUrl = await uploadPromise;
      console.log('Media uploaded successfully:', mediaUrl);

      // Create post in database
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption,
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (postError) {
        throw postError;
      }

      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      });
      
      onPostCreated();
      handleClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      let errorMessage = 'An error occurred while creating your post';
      
      if (error.message) {
        errorMessage = error.message;
        
        // More user-friendly error messages
        if (error.message.includes('413') || error.message.includes('too large') || 
            error.message.includes('exceeded the maximum allowed size')) {
          errorMessage = 'The file size exceeds the storage limit. Please try with a smaller file.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authorization error. Please try logging out and back in.';
        }
      } else if (error.code === '23505') {
        errorMessage = 'A duplicate post was detected';
      } else if (error.code === '23503') {
        errorMessage = 'Related content was not found';
      }
      
      setUploadError(errorMessage);
      toast({
        title: "Failed to create post",
        description: errorMessage,
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
    setUploadProgress(0);
    setUploadError(null);
  };

  const handleRetry = () => {
    setUploadError(null);
    
    if (mediaFile) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your tennis moments with images (up to 100MB) or videos (up to 5GB with upgraded storage)
          </DialogDescription>
        </DialogHeader>
        
        {uploadError && (
          <ErrorAlert
            title="Upload Error"
            message={uploadError}
            guidance="Please try again with a smaller file or a different format."
            onRetry={handleRetry}
            severity="error"
          />
        )}
        
        <CreatePostForm
          caption={caption}
          setCaption={setCaption}
          mediaFile={mediaFile}
          mediaPreview={mediaPreview}
          mediaType={mediaType}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onMediaSelect={handleFileChange}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          onClearMedia={handleClearMedia}
        />
      </DialogContent>
    </Dialog>
  );
};
