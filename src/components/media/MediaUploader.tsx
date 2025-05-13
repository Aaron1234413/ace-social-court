
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, AlertTriangle, Video, Image } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isValidImage, isValidVideo, uploadFileWithProgress } from '@/integrations/supabase/storage';
import { ErrorAlert } from '@/components/ui/error-alert';

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
  const [fileDetails, setFileDetails] = useState<{name: string, size: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Maximum file sizes with upgraded storage
  const MAX_IMAGE_SIZE_MB = 100; // 100MB for images
  const MAX_VIDEO_SIZE_MB = 5000; // 5GB for videos

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
    
    // Calculate file size in MB for display and checks
    const fileSizeMB = (file.size / (1024 * 1024));
    const formattedSize = fileSizeMB.toFixed(2);
    
    // Record file details for debugging
    const details = {
      name: file.name,
      size: `${formattedSize} MB`,
      type: file.type
    };
    setFileDetails(details);
    console.log('Selected file:', details);
    
    // Check if user is authenticated
    if (!user) {
      const errorMsg = 'You must be logged in to upload files';
      setUploadError(errorMsg);
      toast.error(errorMsg);
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

    // Check file size
    const maxSizeMB = fileType === 'image' ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
    
    if (fileSizeMB > maxSizeMB) {
      const errorMsg = `File size exceeds the ${maxSizeMB}MB limit for ${fileType}s`;
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Run additional validation if provided
    if (onValidateFile) {
      try {
        const isValid = await onValidateFile(file);
        if (!isValid) {
          // Error should have been handled in validate function
          return;
        }
      } catch (error: any) {
        setUploadError(`Validation error: ${error.message || 'Unknown error'}`);
        toast.error('File validation failed');
        return;
      }
    } else {
      // Default validations
      if (fileType === 'video' && !isValidVideo(file)) {
        const errorMsg = `Invalid video file. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`;
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (fileType === 'image' && !isValidImage(file)) {
        const errorMsg = `Invalid image file. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`;
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

      console.log(`Uploading ${fileType} file to ${bucketName}: ${file.name}, size: ${formattedSize}MB`);

      // Use the uploadFileWithProgress function from storage.ts
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
      let errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
      
      // Enhanced error messages for common issues
      if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage = `File too large for server. Check Supabase storage limits (maximum file size allowed: image=${MAX_IMAGE_SIZE_MB}MB, video=${MAX_VIDEO_SIZE_MB}MB)`;
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = 'Authorization error. Please log out and log back in.';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'Cross-origin request blocked. This may be a server configuration issue.';
      }
      
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
    setFileDetails(null);
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

  const retryUpload = () => {
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      handleFileChange({ target: { files: fileInputRef.current.files } } as React.ChangeEvent<HTMLInputElement>);
    } else {
      setUploadError(null);
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
                ? `Videos: max ${MAX_VIDEO_SIZE_MB/1000}GB` 
                : `Images: max ${MAX_IMAGE_SIZE_MB}MB`}
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
              <ErrorAlert 
                title="Upload Error"
                message={uploadError}
                guidance="Please check your file size and try again. If the problem persists, try with a smaller file or contact support."
                onRetry={retryUpload}
                severity="error"
                className="mt-3"
              />
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
          
          {/* File details */}
          {fileDetails && (
            <div className="p-2 bg-gray-50 text-xs text-gray-600">
              <p>{fileDetails.name}</p>
              <p>Size: {fileDetails.size} | Type: {fileDetails.type}</p>
            </div>
          )}
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full w-6 h-6 bg-gray-800/60 hover:bg-gray-800"
            onClick={clearPreview}
            type="button"
            disabled={isUploading}
          >
            <X className="h-3 w-3 text-white" />
          </Button>
        </div>
      )}

      {isUploading && uploadProgress > 0 && (
        <div className="mt-3 text-xs">
          <div className="flex justify-between items-center">
            <span>Uploading {mediaType}...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {uploadError && isUploading && (
        <ErrorAlert 
          title="Upload Failed"
          message={uploadError}
          guidance="The upload has encountered an error. You can try again with a smaller file or a different format."
          onRetry={retryUpload}
          severity="error"
          className="mt-3"
        />
      )}
    </div>
  );
};

export default MediaUploader;
