
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Image } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileWithProgress } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';

interface ProfileAvatarProps {
  userId: string;
  avatarUrl: string | null;
  username: string | null;
  fullName: string | null;
  isOwnProfile: boolean;
  onAvatarUpdated: () => Promise<void>;
}

export const ProfileAvatar = ({ 
  userId,
  avatarUrl, 
  username, 
  fullName,
  isOwnProfile,
  onAvatarUpdated
}: ProfileAvatarProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const filePath = `${userId}/avatar-${Date.now()}`;
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
        .update({ avatar_url: imageUrl })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      // Refresh global profile state
      await onAvatarUpdated();
      
      toast.success('Profile picture updated', {
        description: 'Your new profile picture will appear across the app.'
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Upload failed', {
        description: 'Could not update your profile picture. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group -mt-20 mb-4 z-10">
      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={username || 'User avatar'} />
        ) : (
          <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
            {username?.[0]?.toUpperCase() || fullName?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        )}
      </Avatar>
      
      {/* Profile photo upload overlay */}
      {isOwnProfile && (
        <label 
          htmlFor="avatar-upload" 
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Update profile picture"
          role="button"
        >
          <Image className="h-6 w-6 text-white mb-1" />
          <span className="text-xs text-white font-medium">Update</span>
          <Input 
            type="file" 
            id="avatar-upload" 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarUpload}
            disabled={isUploading}
            aria-label="Upload profile picture"
          />
        </label>
      )}

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="mt-2 w-32 flex flex-col items-center">
          <Progress value={uploadProgress} className="h-1 mb-1" />
          <span className="text-xs text-muted-foreground">
            {Math.round(uploadProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};
