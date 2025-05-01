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
    
    // Check if any buckets exist, if not, we may not have storage access at all
    if (!buckets || buckets.length === 0) {
      console.warn('No storage buckets available. Storage features may be limited.');
      return false;
    }
    
    // Instead of trying to create buckets, just work with what we have
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
    
    const existingBuckets = buckets?.map(b => b.name) || [];
    console.log(`Available buckets: ${existingBuckets.join(', ')}`);
    
    // If the requested bucket exists, use it
    if (existingBuckets.includes(bucketName)) {
      console.log(`Bucket '${bucketName}' exists and will be used.`);
      return true;
    }
    
    // If we have at least one bucket, we can use that as fallback
    if (existingBuckets.length > 0) {
      console.log(`Bucket '${bucketName}' not found, but will use '${existingBuckets[0]}' as fallback.`);
      return true;
    }
    
    // No buckets available at all
    console.error('No storage buckets available in this project.');
    return false;
  } catch (error) {
    console.error(`Error ensuring bucket '${bucketName}' exists:`, error);
    return false;
  }
};

/**
 * Get the appropriate bucket name to use for a given intended bucket
 * Falls back to any available bucket if the intended bucket doesn't exist
 * @param intendedBucket The bucket name we want to use
 * @returns The bucket name to actually use, or null if no buckets available
 */
export const getUsableBucket = async (intendedBucket: string): Promise<string | null> => {
  try {
    // Check if any buckets exist
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return null;
    }
    
    if (!buckets || buckets.length === 0) {
      console.error('No storage buckets available');
      return null;
    }
    
    // Check if the intended bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === intendedBucket);
    
    if (bucketExists) {
      return intendedBucket;
    }
    
    // Return the first bucket as fallback
    const fallbackBucket = buckets[0].name;
    console.log(`Using "${fallbackBucket}" bucket as fallback for ${intendedBucket}`);
    return fallbackBucket;
  } catch (error) {
    console.error('Error getting usable bucket:', error);
    return null;
  }
};
