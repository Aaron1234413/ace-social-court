
import { useState, useCallback } from 'react';

export const useMediaUpload = () => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Function to handle media file selection
  const handleMediaSelect = useCallback((file: File, type: 'image' | 'video') => {
    setMediaFile(file);
    setMediaType(type);
    
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
  }, []);

  return {
    mediaFile,
    mediaPreview,
    mediaType,
    uploadProgress,
    setUploadProgress,
    handleMediaSelect,
    clearMedia
  };
};
