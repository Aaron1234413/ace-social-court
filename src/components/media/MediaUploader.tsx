
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Upload, X } from 'lucide-react';

interface MediaUploaderProps {
  onMediaUpload: (url: string, type: 'image' | 'video') => void;
  allowedTypes?: ('image' | 'video')[];
}

const MediaUploader = ({ 
  onMediaUpload, 
  allowedTypes = ['image', 'video'] 
}: MediaUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
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
      toast.error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }

    try {
      setIsUploading(true);
      
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      setMediaType(fileType);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, file, {
          cacheControl: '3600',
          contentType: file.type
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Pass URL to parent component
      onMediaUpload(publicUrl, fileType);
      console.log('File uploaded successfully:', publicUrl);
      toast.success('File uploaded successfully!');
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
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
  };

  return (
    <div className="w-full">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {allowedTypes.length > 1 
                ? 'Upload image or video' 
                : `Upload ${allowedTypes[0]}`}
            </span>
            <span className="text-xs text-gray-400">Maximum size: 10MB</span>
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
          >
            <X className="h-3 w-3 text-white" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
