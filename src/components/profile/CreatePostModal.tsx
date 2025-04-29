
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Image, Video, Loader2, Upload } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useQuery } from '@tanstack/react-query';

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

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should be less than 50MB",
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
      
      const { error: uploadError, data: uploadData } = await supabase
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your tennis moments with images or videos (up to 2 minutes)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!mediaPreview ? (
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Image className="mr-2 h-6 w-6 text-muted-foreground" />
                <Video className="ml-2 h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop an image or video (max 50MB), or click to browse
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('media-upload')?.click()}
                className="relative"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Media
              </Button>
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-square max-h-[350px] rounded-md overflow-hidden flex items-center justify-center bg-black">
                {mediaType === 'image' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="max-h-full max-w-full object-contain" 
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    className="max-h-full max-w-full"
                    controls
                  />
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 right-2"
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMediaType(null);
                }}
              >
                Change
              </Button>
            </div>
          )}

          <div>
            <Textarea 
              placeholder="Write a caption..." 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!mediaFile || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Share'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
