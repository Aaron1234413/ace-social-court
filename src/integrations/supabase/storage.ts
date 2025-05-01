
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization...');
    
    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return false;
    }
    
    // Create media bucket if it doesn't exist
    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');
    if (!mediaBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 209715200, // 200MB for 2-minute videos
      });
      
      if (createError) {
        console.error('Error creating media bucket:', createError);
        return false;
      }
      console.log('Created media bucket successfully');
    } else {
      // Update existing media bucket size limit
      const { error: updateError } = await supabase.storage.updateBucket('media', {
        public: true,
        fileSizeLimit: 209715200, // 200MB
      });
      
      if (updateError) {
        console.error('Error updating media bucket:', updateError);
        return false;
      }
      console.log('Updated media bucket size limit successfully');
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 209715200, // 200MB for 2-minute videos
      });
      
      if (createError) {
        console.error('Error creating posts bucket:', createError);
        return false;
      }
      console.log('Created posts bucket successfully');
    } else {
      // Update existing posts bucket size limit
      const { error: updateError } = await supabase.storage.updateBucket('posts', {
        public: true,
        fileSizeLimit: 209715200, // 200MB
      });
      
      if (updateError) {
        console.error('Error updating posts bucket:', updateError);
        return false;
      }
      console.log('Updated posts bucket size limit successfully');
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
  
  // Check if file size is within limit (200MB)
  if (file.size > 209715200) {
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
  
  // Check if file size is within limit (20MB for images)
  if (file.size > 20971520) {
    console.log('Image file too large:', file.size);
    return false;
  }
  
  return true;
};
