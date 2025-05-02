
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileVideo, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { isValidVideo } from '@/integrations/supabase/storage';

interface VideoAnalysisUploaderProps {
  onVideoUploaded: (url: string, fileId: string) => void;
  maxDurationSeconds?: number;
}

const VideoAnalysisUploader = ({ 
  onVideoUploaded, 
  maxDurationSeconds = 120 // Default max 2 minutes
}: VideoAnalysisUploaderProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const checkVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        resolve(duration);
      };
      
      video.onerror = () => {
        reject(new Error("Cannot load video metadata"));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setUploadError(null);
    setUploadProgress(0);
    
    // Check if user is authenticated
    if (!user) {
      setUploadError('You must be logged in to upload videos for analysis');
      toast.error('You must be logged in to upload videos');
      return;
    }

    // Validate video file
    if (!isValidVideo(file)) {
      const errorMsg = 'Invalid video file. Maximum size is 5GB.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      // Check video duration
      const duration = await checkVideoDuration(file);
      setVideoDuration(duration);
      
      if (duration > maxDurationSeconds) {
        const errorMsg = `Video is too long (${Math.round(duration)} seconds). Maximum allowed duration is ${maxDurationSeconds} seconds.`;
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      setIsUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `analysis_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log(`Starting upload to analysis/${filePath}`);
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('analysis')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
          onUploadProgress: (event) => {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(progress));
          }
        });

      if (error) {
        console.error('Upload error:', error);
        setUploadError(`Upload failed: ${error.message}`);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('analysis')
        .getPublicUrl(filePath);

      console.log('Video uploaded successfully:', publicUrl);
      
      // Pass URL and file ID to parent component
      onVideoUploaded(publicUrl, data.path);
      toast.success('Video uploaded successfully!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
      // Clear preview on error
      setPreview(null);
      setVideoDuration(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setVideoDuration(null);
    setUploadError(null);
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <label className="cursor-pointer flex flex-col items-center justify-center gap-3">
            <FileVideo className="h-10 w-10 text-gray-400" />
            <span className="text-base font-medium text-gray-700">
              Upload a tennis video for analysis
            </span>
            <span className="text-sm text-gray-500">
              Maximum {maxDurationSeconds} seconds, up to 5GB with Supabase Pro
            </span>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="lg" 
              className="mt-2"
              onClick={(e) => {
                e.preventDefault();
                // Trigger the hidden file input
                const fileInput = e.currentTarget.previousElementSibling as HTMLInputElement;
                fileInput.click();
              }}
              disabled={isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Select Video'}
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
          <div className="flex items-center justify-center bg-black">
            <video 
              src={preview} 
              controls 
              className="max-h-80 max-w-full"
            />
          </div>
          
          {isUploading && (
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {videoDuration && !isUploading && (
            <div className="p-3 bg-gray-50">
              <p className="text-sm text-gray-600">
                Duration: {Math.round(videoDuration)} seconds
              </p>
            </div>
          )}
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 rounded-full w-7 h-7 bg-gray-800/70 hover:bg-gray-800"
            onClick={clearPreview}
            type="button"
            disabled={isUploading}
          >
            <X className="h-4 w-4 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoAnalysisUploader;
