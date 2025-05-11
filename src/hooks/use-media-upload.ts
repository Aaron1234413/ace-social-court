
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export const useMediaUpload = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to handle media file selection
  const handleMediaSelect = useCallback((file: File, type: 'image' | 'video') => {
    // Reset states
    setMediaFile(file);
    setMediaType(type);
    setError(null);
    setUploadProgress(0);
    
    // Validate file size
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 20 * 1024 * 1024; // 5MB for images, 20MB for videos
    if (file.size > maxSize) {
      const sizeInMB = (maxSize / (1024 * 1024)).toFixed(0);
      setError(`File size exceeds the ${sizeInMB}MB limit for ${type}s`);
      toast.error(`File too large`, {
        description: `${type === 'image' ? 'Images' : 'Videos'} must be less than ${sizeInMB}MB`
      });
      
      // Clear the invalid file
      setMediaFile(null);
      setMediaType(null);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Function to clear selected media
  const clearMedia = useCallback(() => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    mediaFile,
    mediaPreview,
    mediaType,
    uploadProgress,
    isUploading,
    setIsUploading,
    setUploadProgress,
    error,
    setError,
    handleMediaSelect,
    clearMedia
  };
};
