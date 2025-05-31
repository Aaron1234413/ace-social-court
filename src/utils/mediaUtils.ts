
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a file to Supabase Storage with progress tracking
 * @param file The file to upload
 * @param bucketName The storage bucket to upload to
 * @param userId The user ID for the file path prefix
 * @param onProgress Optional callback for upload progress
 * @returns The public URL of the uploaded file
 */
export const uploadFileWithProgress = async (
  file: File,
  bucketName: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  console.log(`Starting upload to ${bucketName}/${filePath}`, { 
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    fileType: file.type
  });

  try {
    if (onProgress) {
      onProgress(10);
    }
    
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
    
    if (onProgress) {
      onProgress(100);
    }
    
    console.log('Upload completed successfully');
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadFileWithProgress:', error);
    throw error;
  }
};
