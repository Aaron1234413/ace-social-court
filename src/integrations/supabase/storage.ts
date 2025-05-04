
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
      try {
        const { error: createError } = await supabase.storage.createBucket('media', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - default limit for media
        });
        
        if (createError) {
          console.error('Error creating media bucket:', createError);
          return false;
        }
        console.log('Created media bucket successfully');
      } catch (err) {
        console.error('Exception creating media bucket:', err);
        return false;
      }
    } else {
      // Update existing media bucket size limit
      try {
        const { error: updateError } = await supabase.storage.updateBucket('media', {
          public: true,
          fileSizeLimit: 100000000, // 100MB
        });
        
        if (updateError) {
          console.error('Error updating media bucket:', updateError);
          return false;
        }
        console.log('Updated media bucket size limit successfully');
      } catch (err) {
        console.error('Exception updating media bucket:', err);
        return false;
      }
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      try {
        const { error: createError } = await supabase.storage.createBucket('posts', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - for video posts
        });
        
        if (createError) {
          console.error('Error creating posts bucket:', createError);
          return false;
        }
        console.log('Created posts bucket successfully');
      } catch (err) {
        console.error('Exception creating posts bucket:', err);
        return false;
      }
    } else {
      // Update existing posts bucket size limit
      try {
        const { error: updateError } = await supabase.storage.updateBucket('posts', {
          public: true,
          fileSizeLimit: 100000000, // 100MB
        });
        
        if (updateError) {
          console.error('Error updating posts bucket:', updateError);
          return false;
        }
        console.log('Updated posts bucket size limit successfully');
      } catch (err) {
        console.error('Exception updating posts bucket:', err);
        return false;
      }
    }
    
    // Create analysis bucket if it doesn't exist
    const analysisBucketExists = buckets?.some(bucket => bucket.name === 'analysis');
    if (!analysisBucketExists) {
      try {
        const { error: createError } = await supabase.storage.createBucket('analysis', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - more realistic for client uploads
        });
        
        if (createError) {
          console.error('Error creating analysis bucket:', createError);
          return false;
        }
        console.log('Created analysis bucket successfully');
      } catch (err) {
        console.error('Exception creating analysis bucket:', err);
        return false;
      }
    } else {
      // Update existing analysis bucket size limit
      try {
        const { error: updateError } = await supabase.storage.updateBucket('analysis', {
          public: true,
          fileSizeLimit: 100000000, // 100MB
        });
        
        if (updateError) {
          console.error('Error updating analysis bucket:', updateError);
          return false;
        }
        console.log('Updated analysis bucket size limit successfully');
      } catch (err) {
        console.error('Exception updating analysis bucket:', err);
        return false;
      }
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
  
  // Check if file size is within limit (100MB max for videos)
  if (file.size > 100000000) {
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
  if (file.size > 20000000) {
    console.log('Image file too large:', file.size);
    return false;
  }
  
  return true;
};
