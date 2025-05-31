
import { useState } from 'react';

export function useSocialMediaUpload() {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setUploadProgress(0);
  };

  return {
    mediaFile,
    mediaPreview,
    mediaType,
    uploadProgress,
    setUploadProgress,
    handleMediaSelect,
    clearMedia
  };
}
