
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, AlertTriangle, Video, Image } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isValidImage, isValidVideo, uploadFileWithProgress } from '@/integrations/supabase/storage';

interface MediaUploaderProps {
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  onProgress?: (progress: number) => void;
  onValidateFile?: (file: File) => Promise<boolean> | boolean;
  allowedTypes?: ('image' | 'video')[];
  bucketName?: string;
}

const MediaUploader = ({ 
  onMediaUpload, 
  onProgress,
  onValidateFile,
  allowedTypes = ['image', 'video'],
  bucketName = 'media'
}: MediaUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const updateProgress = (progress: number) => {
    setUploadProgress(progress);
    onProgress?.(progress);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    updateProgress(0);
    
    // Check if user is authenticated
    if (!user) {
      setUploadError('You must be logged in to upload files');
      toast.error('You must be logged in to upload files');
      return;
    }

    // Determine file type
    const fileType = file.type.startsWith('image/') 
      ? 'image' 
      : file.type.startsWith('video/') 
        ? 'video' 
        : null;

    // Check if file type is allowed
    if (!fileType || !allowedTypes.includes(fileType)) {
      const errorMsg = `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Run additional validation if provided
    if (onValidateFile) {
      const isValid = await onValidateFile(file);
      if (!isValid) {
        // Error already handled in validate function
        return;
      }
    } else {
      // Default validations
      if (fileType === 'video' && !isValidVideo(file)) {
        const errorMsg = 'Invalid video file. Maximum size is 100MB.';
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (fileType === 'image' && !isValidImage(file)) {
        const errorMsg = 'Invalid image file. Maximum size is 20MB.';
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    try {
      setIsUploading(true);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setMediaType(fileType);

      // Use the new uploadFileWithProgress function from storage.ts
      const publicUrl = await uploadFileWithProgress(
        file,
        bucketName,
        user.id,
        updateProgress
      );
      
      console.log('File uploaded successfully:', publicUrl);
      updateProgress(100);
      
      // Pass URL to parent component
      onMediaUpload(publicUrl, fileType);
      toast.success('File uploaded successfully!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
      // Clear preview on error
      setPreview(null);
      setMediaType(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setMediaType(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = (type?: 'image' | 'video') => {
    if (fileInputRef.current) {
      if (type === 'image') {
        fileInputRef.current.accept = 'image/*';
      } else if (type === 'video') {
        fileInputRef.current.accept = 'video/*';
      } else {
        fileInputRef.current.accept = allowedTypes.map(type => 
          type === 'image' ? 'image/*' : 'video/*'
        ).join(',');
      }
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <div className="cursor-pointer flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {allowedTypes.length > 1 
                ? 'Upload image or video' 
                : `Upload ${allowedTypes[0]}`}
            </span>
            <span className="text-xs text-gray-400">
              {allowedTypes.includes('video') 
                ? 'Videos: max 100MB, 60 seconds' 
                : 'Images: max 20MB'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={allowedTypes.map(type => 
                type === 'image' ? 'image/*' : 'video/*'
              ).join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            
            <div className="flex gap-2 mt-2">
              {allowedTypes.includes('image') && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => triggerFileSelect('image')}
                  disabled={isUploading}
                >
                  <Image className="h-4 w-4 mr-1" />
                  Image
                </Button>
              )}
              
              {allowedTypes.includes('video') && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => triggerFileSelect('video')}
                  disabled={isUploading}
                >
                  <Video className="h-4 w-4 mr-1" />
                  Video
                </Button>
              )}
            </div>
            
            {uploadError && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          {mediaType === 'image' ? (
            <div className="flex items-center justify-center">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-48 object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-100">
              <video 
                ref={videoRef}
                src={preview} 
                controls 
                className="max-h-48 max-w-full"
              />
            </div>
          )}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full w-6 h-6 bg-gray-800/60 hover:bg-gray-800"
            onClick={clearPreview}
            type="button"
          >
            <X className="h-3 w-3 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
