
import { supabase } from "./client";

/**
 * Initialize required storage buckets if they don't exist
 */
export const initializeStorage = async () => {
  try {
    console.log('Starting storage initialization...');
    
    // Get list of existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
      return false;
    }
    
    // Create or update media bucket
    if (!buckets?.some(bucket => bucket.name === 'media')) {
      try {
        const { error } = await supabase.storage.createBucket('media', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit for upgraded storage
        });
        
        if (error) throw error;
        console.log('Created media bucket successfully');
      } catch (err) {
        console.error('Exception creating media bucket:', err);
        // Continue execution even if one bucket fails
      }
    } else {
      try {
        const { error } = await supabase.storage.updateBucket('media', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit
        });
        
        if (error) {
          console.error('Error updating media bucket:', error);
          // Continue execution even if update fails
        } else {
          console.log('Updated media bucket size limit successfully');
        }
      } catch (err) {
        console.error('Exception updating media bucket:', err);
        // Continue execution even if update fails
      }
    }
    
    // Create or update posts bucket
    if (!buckets?.some(bucket => bucket.name === 'posts')) {
      try {
        const { error } = await supabase.storage.createBucket('posts', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit
        });
        
        if (error) throw error;
        console.log('Created posts bucket successfully');
      } catch (err) {
        console.error('Exception creating posts bucket:', err);
        // Continue execution
      }
    } else {
      try {
        const { error } = await supabase.storage.updateBucket('posts', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit
        });
        
        if (error) {
          console.error('Error updating posts bucket:', error);
          // Continue execution
        } else {
          console.log('Updated posts bucket size limit successfully');
        }
      } catch (err) {
        console.error('Exception updating posts bucket:', err);
        // Continue execution
      }
    }
    
    // Create or update analysis bucket
    if (!buckets?.some(bucket => bucket.name === 'analysis')) {
      try {
        const { error } = await supabase.storage.createBucket('analysis', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit
        });
        
        if (error) throw error;
        console.log('Created analysis bucket successfully');
      } catch (err) {
        console.error('Exception creating analysis bucket:', err);
        // Continue execution
      }
    } else {
      try {
        const { error } = await supabase.storage.updateBucket('analysis', {
          public: true,
          fileSizeLimit: 5000000000, // 5GB - increased limit
        });
        
        if (error) {
          console.error('Error updating analysis bucket:', error);
          // Continue execution
        } else {
          console.log('Updated analysis bucket size limit successfully');
        }
      } catch (err) {
        console.error('Exception updating analysis bucket:', err);
        // Continue execution
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
  
  // Check if file size is within limit (5GB max for videos with upgraded storage)
  const maxSizeBytes = 5000000000; // 5GB
  if (file.size > maxSizeBytes) {
    console.log('Video file too large:', file.size, 'Max size:', maxSizeBytes);
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
  
  // Check if file size is within limit (100MB for images with upgraded storage)
  const maxSizeBytes = 100000000; // 100MB
  if (file.size > maxSizeBytes) {
    console.log('Image file too large:', file.size, 'Max size:', maxSizeBytes);
    return false;
  }
  
  return true;
};

/**
 * Upload a file to Supabase Storage with progress tracking
 * @param file The file to upload
 * @param bucketName The storage bucket to upload to
 * @param userId The user ID for the file path prefix
 * @param onProgress Optional callback for upload progress
 * @returns The public URL of the uploaded file
 */
export const uploadFileWithProgress = async (
  file: File,
  bucketName: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Create unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  console.log(`Starting upload to ${bucketName}/${filePath}`, { fileSize: file.size });

  try {
    if (onProgress) {
      // Get token for authenticated upload
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Track progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
            onProgress(progress);
          }
        });
        
        // Handle completion
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`Upload completed successfully with status ${xhr.status}`);
            // Get public URL after successful upload
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            resolve(publicUrl);
          } else {
            console.error(`Upload failed with status ${xhr.status}:`, xhr.responseText);
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        // Handle errors
        xhr.addEventListener('error', () => {
          console.error('Upload failed due to network or CORS error');
          reject(new Error('Upload failed due to network error'));
        });
        
        xhr.addEventListener('abort', () => {
          console.warn('Upload aborted by user or script');
          reject(new Error('Upload aborted'));
        });
        
        // Construct the Storage API URL
        const storageUrl = `https://sdrndqcaskaitzcwgnaw.supabase.co/storage/v1/object/${bucketName}/${filePath}`;
        
        xhr.open('POST', storageUrl);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('x-upsert', 'true'); // Enable upsert
        
        // Upload the file
        xhr.send(file);
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: true,
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      console.log('Upload completed successfully via standard method');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      return publicUrl;
    }
  } catch (error) {
    console.error('Error in uploadFileWithProgress:', error);
    throw error;
  }
};
