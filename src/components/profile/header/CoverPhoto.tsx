
import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { uploadFileWithProgress } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface CoverPhotoProps {
  userId: string;
  coverPhotoUrl: string | null;
  isOwnProfile: boolean;
  onCoverPhotoUpdated: () => Promise<void>;
}

export const CoverPhoto = ({ 
  userId, 
  coverPhotoUrl, 
  isOwnProfile, 
  onCoverPhotoUpdated 
}: CoverPhotoProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Enhanced file validation
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large', {
          description: 'Please upload an image under 5MB.'
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Invalid file format', {
          description: 'Only image files are allowed (.jpg, .png, .gif, etc).'
        });
        return;
      }
      
      // Upload the file with progress tracking
      const filePath = `${userId}/cover-${Date.now()}`;
      const imageUrl = await uploadFileWithProgress(
        file,
        'message_media',
        filePath,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Update the profile with the new image URL
      const { error } = await supabase
        .from('profiles')
        .update({ cover_photo_url: imageUrl })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Refresh global profile state
      await onCoverPhotoUpdated();
      
      toast.success('Cover photo updated', {
        description: 'Your new cover photo will appear across the app.'
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast.error('Upload failed', {
        description: 'Could not update your cover photo. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-full h-48 md:h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
      {coverPhotoUrl ? (
        <img 
          src={coverPhotoUrl} 
          alt="Profile cover" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          {isOwnProfile ? "Add a cover photo" : "No cover photo"}
        </div>
      )}
      
      {/* Cover photo upload button for own profile */}
      {isOwnProfile && (
        <label 
          htmlFor="cover-upload" 
          className="absolute bottom-4 right-4 bg-background/90 hover:bg-background text-foreground p-2 rounded-full cursor-pointer shadow-md transition-colors"
          title="Update cover photo"
        >
          <Camera className="h-5 w-5" />
          <Input 
            type="file" 
            id="cover-upload" 
            className="hidden" 
            accept="image/*" 
            onChange={handleCoverPhotoUpload}
            disabled={isUploading}
          />
        </label>
      )}
      
      {/* Upload progress indicator */}
      {isUploading && (
        <div className="absolute bottom-4 left-4 bg-background/80 p-2 rounded-md">
          <Progress value={uploadProgress} className="h-1 w-32 mb-1" />
          <span className="text-xs text-muted-foreground">
            {Math.round(uploadProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};
