
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
        fileSizeLimit: 10485760, // 10MB
      });
      console.log('Created media bucket');
    }
    
    // Create posts bucket if it doesn't exist
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    if (!postsBucketExists) {
      await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      console.log('Created posts bucket');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
