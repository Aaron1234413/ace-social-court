
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileVideo, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

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

  // Maximum file size for videos with upgraded storage
  const MAX_VIDEO_SIZE_GB = 5; // 5GB for videos

  const isValidVideo = (file: File): boolean => {
    if (!file.type.startsWith('video/')) {
      console.log('File is not a video:', file.type);
      return false;
    }
    
    const maxSizeBytes = 5000000000; // 5GB
    if (file.size > maxSizeBytes) {
      console.log('Video file too large:', file.size, 'Max size:', maxSizeBytes);
      return false;
    }
    
    console.log('Valid video file:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    return true;
  };

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

    // Validate file type
    if (!file.type.startsWith('video/')) {
      const errorMsg = 'Please upload a video file.';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    const fileSizeInGB = fileSizeInMB / 1024;
    
    if (fileSizeInGB > MAX_VIDEO_SIZE_GB) {
      const errorMsg = `Video file too large. Maximum size is ${MAX_VIDEO_SIZE_GB}GB.`;
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
      
      console.log(`Starting upload to analysis/${filePath}, size: ${fileSizeInGB.toFixed(2)}GB`);
      
      // Create upload xhr request for progress tracking
      const xhr = new XMLHttpRequest();
      const uploadPromise = new Promise<{path: string}>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(Math.round(progress));
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
          }
        });
        
        xhr.onreadystatechange = async function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve({path: filePath}); // We'll use the path we created
              } catch (e) {
                reject(new Error('Failed to parse response'));
              }
            } else {
              console.error(`Upload failed with status ${xhr.status}:`, xhr.responseText);
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };
        
        // Get token for authenticated upload
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            reject(new Error('Authentication required'));
            return;
          }
          
          const url = `https://sdrndqcaskaitzcwgnaw.supabase.co/storage/v1/object/analysis/${filePath}`;
          xhr.open('POST', url, true);
          xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
          xhr.setRequestHeader('x-upsert', 'true');
          xhr.send(file);
        }).catch(reject);
      });
      
      const { path } = await uploadPromise;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('analysis')
        .getPublicUrl(path);

      console.log('Video uploaded successfully:', publicUrl);
      
      // Pass URL and file ID to parent component
      onVideoUploaded(publicUrl, path);
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
              Maximum {maxDurationSeconds} seconds, up to {MAX_VIDEO_SIZE_GB}GB with upgraded storage
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
