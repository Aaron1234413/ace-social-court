
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isValidImage, isValidVideo } from '@/integrations/supabase/storage';

interface MediaUploaderProps {
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  allowedTypes?: ('image' | 'video')[];
  bucketName?: string;
}

const MediaUploader = ({ 
  onMediaUpload, 
  allowedTypes = ['image', 'video'],
  bucketName = 'media'
}: MediaUploaderProps) => {
  const { user } = useAuth(); // Get the authenticated user
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadProgress(0);
    
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

    // Log more info about the file
    console.log(`Selected file: ${file.name}, size: ${file.size} bytes (${Math.round(file.size / 1024 / 1024 * 100) / 100} MB), type: ${file.type}`);

    // Check if file type is allowed
    if (!fileType || !allowedTypes.includes(fileType)) {
      const errorMsg = `File type not supported. Allowed types: ${allowedTypes.join(', ')}`;
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate file based on type
    if (fileType === 'video' && !isValidVideo(file)) {
      const errorMsg = 'Invalid video file. Maximum size is 1GB.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (fileType === 'image' && !isValidImage(file)) {
      const errorMsg = 'Invalid image file. Maximum size is 1GB.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      setIsUploading(true);
      toast.info("Starting file upload, please wait...");
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setMediaType(fileType);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Starting upload to ${bucketName}/${filePath}`);
      console.log(`File type: ${file.type}, size: ${file.size} bytes`);
      
      // Upload file to Supabase Storage with explicit owner
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        setUploadError(`Upload failed: ${error.message}`);
        throw error;
      }

      console.log('File uploaded successfully, getting public URL');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Got public URL:', publicUrl);
      
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
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {allowedTypes.length > 1 
                ? 'Upload image or video (up to 1GB)' 
                : `Upload ${allowedTypes[0]}`}
            </span>
            <span className="text-xs text-gray-400">Maximum size: 1GB</span>
            <input
              type="file"
              className="hidden"
              accept={allowedTypes.map(type => 
                type === 'image' ? 'image/*' : 'video/*'
              ).join(',')}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={(e) => {
                e.preventDefault();
                // Trigger the hidden file input
                const fileInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                fileInput.click();
              }}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Select File'}
            </Button>
            
            {uploadError && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
          </label>
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
