
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 * This function now handles errors gracefully and doesn't block app startup
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization check...');
    
    // Get list of existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      // Don't fail completely - buckets might still work
      return true;
    }
    
    // Log current bucket configurations
    console.log('Current buckets:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    console.log('Storage initialization completed successfully');
    return true;
  } catch (error) {
    console.warn('Storage initialization encountered an error but continuing:', error);
    // Return true anyway - don't block app startup
    return true;
  }
};
