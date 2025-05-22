
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { uploadFileWithProgress } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';

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
  const { refreshProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleCoverPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Enhanced file validation
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large', {
          description: 'Please upload an image under 10MB.'
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
      await refreshProfile();
      
      // Call the callback from parent component
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
  
  // Default cover photo style - gradient if no photo is provided
  const defaultCoverStyle = {
    background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
    height: '200px'
  };

  return (
    <div className="relative w-full overflow-hidden rounded-t-xl" style={{ height: '200px' }}>
      {/* Cover photo or default gradient */}
      {coverPhotoUrl ? (
        <img 
          src={coverPhotoUrl} 
          alt="Cover" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div style={defaultCoverStyle}></div>
      )}
      
      {/* Upload overlay for own profile */}
      {isOwnProfile && (
        <div className="absolute bottom-4 right-4">
          <label htmlFor="cover-upload">
            <Button 
              variant="secondary"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              size="sm"
              type="button"
              disabled={isUploading}
            >
              <Image className="h-4 w-4 mr-2" />
              {coverPhotoUrl ? 'Change Cover' : 'Add Cover'}
              <Input 
                type="file" 
                id="cover-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleCoverPhotoUpload}
                disabled={isUploading}
              />
            </Button>
          </label>
        </div>
      )}
      
      {/* Upload progress indicator */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
          <div className="flex justify-between text-white text-xs mb-1">
            <span>Uploading cover photo...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}
    </div>
  );
};
