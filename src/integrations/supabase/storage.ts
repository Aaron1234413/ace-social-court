
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
    
    // Check specifically for media bucket
    const mediaBucketExists = buckets.some(bucket => bucket.name === 'media');
    
    if (!mediaBucketExists) {
      console.warn('Media bucket not found. Media uploads may not work properly.');
    } else {
      console.log('Media bucket found and will be used for all media uploads.');
    }
    
    return mediaBucketExists;
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
  // Always use 'media' bucket for all media uploads
  const mediaBucketName = 'media';
  
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error(`Error listing buckets when checking for ${mediaBucketName}:`, bucketsError);
      return false;
    }
    
    const existingBuckets = buckets?.map(b => b.name) || [];
    console.log(`Available buckets: ${existingBuckets.join(', ')}`);
    
    // If the media bucket exists, use it
    if (existingBuckets.includes(mediaBucketName)) {
      console.log(`Media bucket exists and will be used.`);
      return true;
    }
    
    console.error('Media bucket not found. Media uploads will not work.');
    return false;
  } catch (error) {
    console.error(`Error ensuring media bucket exists:`, error);
    return false;
  }
};

/**
 * Get the appropriate bucket name to use for a given intended bucket
 * Always returns 'media' bucket regardless of intended bucket
 * @returns The bucket name to actually use, or null if no buckets available
 */
export const getUsableBucket = async (): Promise<string | null> => {
  // Always use 'media' bucket for all media uploads
  const mediaBucketName = 'media';
  
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
    
    // Check if the media bucket exists
    const mediaBucketExists = buckets.some(bucket => bucket.name === mediaBucketName);
    
    if (mediaBucketExists) {
      console.log(`Using "${mediaBucketName}" bucket for all media uploads`);
      return mediaBucketName;
    }
    
    console.error(`Media bucket not found. Media uploads will not work.`);
    return null;
  } catch (error) {
    console.error('Error getting usable bucket:', error);
    return null;
  }
};
