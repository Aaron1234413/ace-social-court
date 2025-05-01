
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization...');
    
    // First check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return false;
    }
    
    console.log('Current buckets:', buckets?.map(b => b.name) || 'none');
    
    // Create media bucket if it doesn't exist
    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');
    if (!mediaBucketExists) {
      console.log('Creating "media" bucket...');
      const { data, error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 1000000000, // 1GB - Pro tier support
      });
      
      if (createError) {
        console.error('Error creating media bucket:', createError);
        return false;
      }
      console.log('Created media bucket successfully:', data);
    } else {
      // Update existing media bucket with Pro tier size limit
      console.log('Updating "media" bucket...');
      const { data, error: updateError } = await supabase.storage.updateBucket('media', {
        public: true,
        fileSizeLimit: 1000000000, // 1GB - Pro tier support
      });
      
      if (updateError) {
        console.error('Error updating media bucket:', updateError);
        return false;
      }
      console.log('Updated media bucket successfully:', data);
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      console.log('Creating "posts" bucket...');
      const { data, error: createError } = await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 1000000000, // 1GB - Pro tier support
      });
      
      if (createError) {
        console.error('Error creating posts bucket:', createError);
        return false;
      }
      console.log('Created posts bucket successfully:', data);
    } else {
      // Update existing posts bucket with Pro tier size limit
      console.log('Updating "posts" bucket...');
      const { data, error: updateError } = await supabase.storage.updateBucket('posts', {
        public: true,
        fileSizeLimit: 1000000000, // 1GB - Pro tier support
      });
      
      if (updateError) {
        console.error('Error updating posts bucket:', updateError);
        return false;
      }
      console.log('Updated posts bucket successfully:', data);
    }
    
    console.log('Storage initialization completed successfully!');
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
  
  // Check if file size is within limit (1GB for Pro tier)
  if (file.size > 1000000000) {
    console.log('Video file too large:', file.size);
    return false;
  }
  
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
  
  // Check if file size is within limit (1GB for Pro tier)
  if (file.size > 1000000000) {
    console.log('Image file too large:', file.size);
    return false;
  }
  
  return true;
};

/**
 * Ensure a specific storage bucket exists
 * @param bucketName Name of the bucket to check/create
 * @returns boolean indicating if the bucket exists or was created successfully
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error(`Error listing buckets when checking for ${bucketName}:`, bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
      return true;
    }
    
    // Create bucket if it doesn't exist
    console.log(`Creating '${bucketName}' bucket...`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 1000000000, // 1GB - Pro tier support
    });
    
    if (createError) {
      console.error(`Error creating '${bucketName}' bucket:`, createError);
      return false;
    }
    
    console.log(`Bucket '${bucketName}' created successfully`);
    return true;
  } catch (error) {
    console.error(`Error ensuring bucket '${bucketName}' exists:`, error);
    return false;
  }
};
