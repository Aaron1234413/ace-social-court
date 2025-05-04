
import { useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCreatePost } from '@/hooks/use-posts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, Send, Video, X } from 'lucide-react';
import MentionInput from './MentionInput';
import MediaUploader from '../media/MediaUploader';
import { toast } from 'sonner';
import { ValidationMessage } from '@/components/profile/edit/wizard-components/ValidationMessage';
import { Progress } from '@/components/ui/progress';

interface CreatePostFormProps {
  onSuccess?: () => void;
  onPostCreated?: () => void;
}

const MAX_VIDEO_DURATION_SECONDS = 60; // 1 minute max for videos
const MAX_VIDEO_SIZE_MB = 100; // 100MB max for videos
const ALLOWED_VIDEO_FORMATS = ['mp4', 'mov', 'webm'];

const CreatePostForm = ({ onSuccess, onPostCreated }: CreatePostFormProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { createPost, isCreatingPost } = useCreatePost();

  if (!user) {
    return null;
  }

  const checkVideoFile = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      // Check file format
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !ALLOWED_VIDEO_FORMATS.includes(extension)) {
        setValidationError(`Unsupported video format. Allowed formats: ${ALLOWED_VIDEO_FORMATS.join(', ')}`);
        resolve(false);
        return;
      }

      // Check file size
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB > MAX_VIDEO_SIZE_MB) {
        setValidationError(`Video size too large. Maximum size: ${MAX_VIDEO_SIZE_MB}MB`);
        resolve(false);
        return;
      }

      // Check video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_VIDEO_DURATION_SECONDS) {
          setValidationError(`Video too long. Maximum duration: ${MAX_VIDEO_DURATION_SECONDS} seconds`);
          resolve(false);
        } else {
          setValidationError(null);
          resolve(true);
        }
      };
      
      video.onerror = () => {
        setValidationError("Error reading video file");
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleMediaUpload = async (url: string, type: 'image' | 'video') => {
    setMediaUrl(url);
    setMediaType(type);
    setShowMediaUploader(false);
    setValidationError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const handleMediaSelect = async (file: File) => {
    if (file.type.startsWith('video/')) {
      setIsUploading(true);
      const isValid = await checkVideoFile(file);
      if (!isValid) {
        setIsUploading(false);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!content.trim() && !mediaUrl) || isCreatingPost) {
      if (!content.trim() && !mediaUrl) {
        toast.error('Please add some content or media to your post');
      }
      return;
    }
    
    try {
      await createPost({
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType
      });
      
      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      setShowMediaUploader(false);
      setValidationError(null);
      
      onSuccess?.();
      onPostCreated?.();
      
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const cancelMediaUpload = () => {
    setMediaUrl(null);
    setMediaType(null);
    setShowMediaUploader(false);
    setValidationError(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  return (
    <div className="bg-card border rounded-lg p-4 mb-6">
      <div className="flex gap-3">
        <Avatar>
          <AvatarFallback>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <form className="flex-1" onSubmit={handleSubmit}>
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder="What's happening in your tennis world?"
            minRows={2}
            maxRows={5}
          />
          
          {validationError && (
            <div className="mt-3">
              <ValidationMessage message={validationError} />
            </div>
          )}
          
          {isUploading && uploadProgress > 0 && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Uploading media...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}
          
          {showMediaUploader && !mediaUrl && (
            <div className="mt-3">
              <MediaUploader
                onMediaUpload={handleMediaUpload}
                bucketName="posts"
                onProgress={handleUploadProgress}
                onValidateFile={handleMediaSelect}
              />
            </div>
          )}
          
          {mediaUrl && !showMediaUploader && (
            <div className="mt-3 relative rounded-md overflow-hidden border">
              {mediaType === 'image' ? (
                <img 
                  src={mediaUrl} 
                  alt="Uploaded media" 
                  className="max-h-64 w-full object-contain bg-black/5" 
                />
              ) : mediaType === 'video' ? (
                <video 
                  ref={videoRef}
                  src={mediaUrl} 
                  controls 
                  className="max-h-64 w-full" 
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      const duration = videoRef.current.duration;
                      if (duration > MAX_VIDEO_DURATION_SECONDS) {
                        setValidationError(`Video too long. Maximum duration: ${MAX_VIDEO_DURATION_SECONDS} seconds`);
                      } else {
                        setValidationError(null);
                      }
                    }
                  }}
                />
              ) : null}
              <Button
                type="button"
                size="icon"
                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-full"
                onClick={cancelMediaUpload}
              >
                <X className="h-4 w-4 text-white" />
              </Button>
            </div>
          )}
          
          <div className="flex justify-between items-center mt-3">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1"
                disabled={isCreatingPost || isUploading}
                onClick={() => setShowMediaUploader(!showMediaUploader)}
              >
                {mediaType === 'video' ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {mediaUrl ? 'Change Media' : 'Add Media'}
                </span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              size="sm"
              disabled={((!content.trim() && !mediaUrl) || isCreatingPost || isUploading || !!validationError)}
            >
              {isCreatingPost ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;
