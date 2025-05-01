
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
      try {
        const { data, error: createError } = await supabase.storage.createBucket('media', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - more reasonable limit
        });
        
        if (createError) {
          console.error('Error creating media bucket:', createError);
        } else {
          console.log('Created media bucket successfully:', data);
        }
      } catch (err) {
        console.error('Exception creating media bucket:', err);
      }
    } else {
      // Update existing media bucket to ensure settings are correct
      try {
        const { data, error: updateError } = await supabase.storage.updateBucket('media', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - more reasonable limit
        });
        
        if (updateError) {
          console.error('Error updating media bucket:', updateError);
        } else {
          console.log('Updated media bucket successfully:', data);
        }
      } catch (err) {
        console.error('Exception updating media bucket:', err);
      }
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      console.log('Creating "posts" bucket...');
      try {
        const { data, error: createError } = await supabase.storage.createBucket('posts', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - more reasonable limit
        });
        
        if (createError) {
          console.error('Error creating posts bucket:', createError);
          // If posts bucket creation fails, we'll use media bucket as fallback
          console.log('Will use "media" bucket as fallback for posts');
        } else {
          console.log('Created posts bucket successfully:', data);
        }
      } catch (err) {
        console.error('Exception creating posts bucket:', err);
      }
    } else {
      // Update existing posts bucket with correct settings
      try {
        const { data, error: updateError } = await supabase.storage.updateBucket('posts', {
          public: true,
          fileSizeLimit: 100000000, // 100MB - more reasonable limit
        });
        
        if (updateError) {
          console.error('Error updating posts bucket:', updateError);
        } else {
          console.log('Updated posts bucket successfully:', data);
        }
      } catch (err) {
        console.error('Exception updating posts bucket:', err);
      }
    }
    
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
    try {
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 100000000, // 100MB - more reasonable limit
      });
      
      if (createError) {
        console.error(`Error creating '${bucketName}' bucket:`, createError);
        
        // Check if "media" bucket exists as fallback
        if (bucketName !== 'media') {
          const mediaExists = buckets?.some(bucket => bucket.name === 'media');
          if (mediaExists) {
            console.log(`Will use "media" bucket as fallback for ${bucketName}`);
            return true; // Return true since we have a fallback
          }
        }
        return false;
      }
      
      console.log(`Bucket '${bucketName}' created successfully`);
      return true;
    } catch (err) {
      console.error(`Exception creating '${bucketName}' bucket:`, err);
      
      // Check if "media" bucket exists as fallback
      if (bucketName !== 'media') {
        const mediaExists = buckets?.some(bucket => bucket.name === 'media');
        if (mediaExists) {
          console.log(`Will use "media" bucket as fallback for ${bucketName}`);
          return true; // Return true since we have a fallback
        }
      }
      return false;
    }
  } catch (error) {
    console.error(`Error ensuring bucket '${bucketName}' exists:`, error);
    return false;
  }
};

/**
 * Get the appropriate bucket name to use for a given intended bucket
 * Falls back to 'media' if the intended bucket doesn't exist
 * @param intendedBucket The bucket name we want to use
 * @returns The bucket name to actually use
 */
export const getUsableBucket = async (intendedBucket: string): Promise<string> => {
  try {
    // Check if the intended bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return 'media'; // Default fallback
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === intendedBucket);
    
    if (bucketExists) {
      return intendedBucket;
    }
    
    // Check if media bucket exists as fallback
    const mediaExists = buckets?.some(bucket => bucket.name === 'media');
    
    if (mediaExists) {
      console.log(`Using "media" bucket as fallback for ${intendedBucket}`);
      return 'media';
    }
    
    // If neither exists, return the intended bucket name and let the caller handle errors
    return intendedBucket;
  } catch (error) {
    console.error('Error getting usable bucket:', error);
    return 'media'; // Default fallback
  }
};
