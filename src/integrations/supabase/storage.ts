
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 * This function now handles errors gracefully and doesn't block app startup
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization check...');
    
    // Get list of existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      // Don't fail completely - buckets might still work
      return true;
    }
    
    // Log current bucket configurations
    console.log('Current buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const requiredBuckets = ['media', 'message_media'];
    const existingBucketNames = buckets?.map(b => b.name) || [];
    
    // Check if all required buckets exist
    const missingBuckets = requiredBuckets.filter(name => !existingBucketNames.includes(name));
    
    if (missingBuckets.length === 0) {
      console.log('All required storage buckets already exist');
      return true;
    }
    
    // Try to create missing buckets (but don't fail if we can't)
    for (const bucketName of missingBuckets) {
      try {
        console.log(`Attempting to create missing bucket: ${bucketName}`);
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
        });
        
        if (error) {
          console.warn(`Could not create ${bucketName} bucket:`, error.message);
          // Continue anyway - bucket might already exist or be created manually
        } else {
          console.log(`Successfully created ${bucketName} bucket`);
        }
      } catch (err) {
        console.warn(`Exception creating ${bucketName} bucket:`, err);
        // Continue anyway
      }
    }
    
    console.log('Storage initialization completed successfully');
    return true;
  } catch (error) {
    console.warn('Storage initialization encountered an error but continuing:', error);
    // Return true anyway - don't block app startup
    return true;
  }
};

/**
 * Helper function to check if a file is a valid video
 * @param file File to check
 * @returns boolean indicating if file is a valid video
 */
export const isValidVideo = (file: File): boolean => {
  // Check if file is a video
  if (!file.type.startsWith('video/')) {
    console.log('File is not a video:', file.type);
    return false;
  }
  
  // Check if file size is within limit (5GB max for videos with upgraded storage)
  const maxSizeBytes = 5000000000; // 5GB
  if (file.size > maxSizeBytes) {
    console.log('Video file too large:', file.size, 'Max size:', maxSizeBytes);
    return false;
  }
  
  // Log file details for debugging
  console.log('Valid video file:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  });
  
  return true;
};

/**
 * Helper function to check if a file is a valid image
 * @param file File to check
 * @returns boolean indicating if file is a valid image
 */
export const isValidImage = (file: File): boolean => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    console.log('File is not an image:', file.type);
    return false;
  }
  
  // Check if file size is within limit (100MB for images with upgraded storage)
  const maxSizeBytes = 100000000; // 100MB
  if (file.size > maxSizeBytes) {
    console.log('Image file too large:', file.size, 'Max size:', maxSizeBytes);
    return false;
  }
  
  // Log file details for debugging
  console.log('Valid image file:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  });
  
  return true;
};

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
  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  console.log(`Starting upload to ${bucketName}/${filePath}`, { 
    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    fileType: file.type
  });

  try {
    // Standard upload without progress tracking since supabase client doesn't support progress
    console.log('Using standard upload method');
    
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
    
    console.log('Upload completed successfully via standard method');
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadFileWithProgress:', error);
    throw error;
  }
};
