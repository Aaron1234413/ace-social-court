
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileVideo, Image, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface SocialMediaUploaderProps {
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  onProgress?: (progress: number) => void;
  allowedTypes?: ('image' | 'video')[];
  bucketName?: string;
}

const SocialMediaUploader = ({ 
  onMediaUpload, 
  onProgress,
  allowedTypes = ['image', 'video'],
  bucketName = 'posts'
}: SocialMediaUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressState, setUploadProgressState] = useState(0);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadProgressState(0);
    
    if (!user) {
      setUploadError('You must be logged in to upload media');
      toast.error('You must be logged in to upload media');
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setUploadError('Please upload an image or video file.');
      toast.error('Please upload an image or video file.');
      return;
    }

    if (isImage && !allowedTypes.includes('image')) {
      setUploadError('Images are not allowed.');
      toast.error('Images are not allowed.');
      return;
    }

    if (isVideo && !allowedTypes.includes('video')) {
      setUploadError('Videos are not allowed.');
      toast.error('Videos are not allowed.');
      return;
    }

    // File size validation
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for image
    if (file.size > maxSize) {
      const maxSizeText = isVideo ? '100MB' : '10MB';
      setUploadError(`File too large. Maximum size is ${maxSizeText}.`);
      toast.error(`File too large. Maximum size is ${maxSizeText}.`);
      return;
    }

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Starting upload to ${bucketName}/${filePath}`);
      
      setUploadProgressState(10);
      if (onProgress) onProgress(10);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true,
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      setUploadProgressState(100);
      if (onProgress) onProgress(100);
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log('Upload completed successfully:', publicUrl);
      
      onMediaUpload(publicUrl, isVideo ? 'video' : 'image');
      toast.success('Media uploaded successfully!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <label className="cursor-pointer flex flex-col items-center justify-center gap-3">
          {allowedTypes.includes('image') && allowedTypes.includes('video') ? (
            <>
              <div className="flex gap-2">
                <Image className="h-8 w-8 text-gray-400" />
                <FileVideo className="h-8 w-8 text-gray-400" />
              </div>
              <span className="text-base font-medium text-gray-700">
                Upload an image or video
              </span>
            </>
          ) : allowedTypes.includes('image') ? (
            <>
              <Image className="h-8 w-8 text-gray-400" />
              <span className="text-base font-medium text-gray-700">
                Upload an image
              </span>
            </>
          ) : (
            <>
              <FileVideo className="h-8 w-8 text-gray-400" />
              <span className="text-base font-medium text-gray-700">
                Upload a video
              </span>
            </>
          )}
          
          <input
            type="file"
            className="hidden"
            accept={allowedTypes.includes('image') && allowedTypes.includes('video') 
              ? "image/*,video/*" 
              : allowedTypes.includes('image') 
                ? "image/*" 
                : "video/*"
            }
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <Button 
            type="button" 
            variant="outline" 
            size="lg" 
            className="mt-2"
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Select File'}
          </Button>
          
          {uploadError && (
            <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {uploadError}
            </div>
          )}
        </label>
        
        {isUploading && uploadProgressState > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgressState}%</span>
            </div>
            <Progress value={uploadProgressState} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaUploader;
