
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    // Check if buckets exist
    const { data: buckets } = await supabase.storage.listBuckets();
    
    // Create media bucket if it doesn't exist
    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');
    if (!mediaBucketExists) {
      await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 52428800, // Increased to 50MB (from 10MB)
      });
      console.log('Created media bucket');
    } else {
      // Update existing media bucket size limit
      await supabase.storage.updateBucket('media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });
      console.log('Updated media bucket size limit');
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 52428800, // Increased to 50MB (from 10MB)
      });
      console.log('Created posts bucket');
    } else {
      // Update existing posts bucket size limit
      await supabase.storage.updateBucket('posts', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      });
      console.log('Updated posts bucket size limit');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
