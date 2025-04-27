
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    // Check if posts bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const postsBucketExists = buckets?.some(bucket => bucket.name === 'posts');
    
    // Create posts bucket if it doesn't exist
    if (!postsBucketExists) {
      await supabase.storage.createBucket('posts', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};
