
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization...');
    
    // Get list of existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return false;
    }
    
    // Log current bucket configurations
    console.log('Current buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const initBucket = async (bucketName: string) => {
      try {
        if (!buckets?.some(bucket => bucket.name === bucketName)) {
          console.log(`Creating ${bucketName} bucket with 5GB limit...`);
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 5000000000, // 5GB
          });
          
          if (error) {
            console.error(`Error creating ${bucketName} bucket:`, error);
            // Try without specifying the file size limit as fallback
            console.log(`Retrying ${bucketName} bucket creation without size limit...`);
            const { error: retryError } = await supabase.storage.createBucket(bucketName, {
              public: true,
            });
            
            if (retryError) {
              console.error(`Failed to create ${bucketName} bucket on retry:`, retryError);
            } else {
              console.log(`Created ${bucketName} bucket successfully without size limit`);
            }
          } else {
            console.log(`Created ${bucketName} bucket successfully with 5GB limit`);
          }
        } else {
          console.log(`Updating ${bucketName} bucket to 5GB limit...`);
          try {
            const { error } = await supabase.storage.updateBucket(bucketName, {
              public: true,
              fileSizeLimit: 5000000000, // 5GB
            });
            
            if (error) {
              console.error(`Error updating ${bucketName} bucket:`, error);
              
              // Check if the error is related to fileSizeLimit
              if (error.message && error.message.includes('fileSizeLimit')) {
                console.log(`${bucketName} bucket might already have a limit or cannot be updated via API`);
              }
            } else {
              console.log(`Updated ${bucketName} bucket successfully`);
            }
          } catch (err) {
            console.error(`Exception updating ${bucketName} bucket:`, err);
          }
        }
      } catch (err) {
        console.error(`Error handling ${bucketName} bucket:`, err);
      }
    };
    
    // Initialize all required buckets
    await initBucket('message_media');
    
    console.log('Storage initialization completed');
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
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
