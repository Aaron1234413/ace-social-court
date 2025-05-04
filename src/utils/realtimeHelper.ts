
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to check if realtime is properly configured for essential tables
 * This only needs to be run once per database setup
 */
export const configureRealtime = async () => {
  try {
    console.log('Checking realtime configuration for tables...');
    
    // First check if the tables are added to the realtime publication
    // Use type assertion to work around TypeScript errors
    const { data: publicationData, error: publicationError } = await (supabase.rpc as any)(
      'is_table_in_publication',
      { 
        _table_name: 'ai_conversations',
        _publication_name: 'supabase_realtime'
      }
    );
    
    if (publicationError) {
      console.error('Error checking publications:', publicationError);
      return { success: false, error: publicationError };
    }
    
    // If needed, execute REPLICA IDENTITY FULL and add tables to realtime
    if (!publicationData) {
      console.log('Configuring realtime for ai_conversations table...');
      
      // Execute the SQL to configure the tables
      // Use type assertion to work around TypeScript errors
      const { error: configError } = await (supabase.rpc as any)('configure_realtime_tables');
      
      if (configError) {
        console.error('Error configuring realtime:', configError);
        return { success: false, error: configError };
      }
      
      console.log('Successfully configured realtime for tables');
      return { success: true };
    } else {
      console.log('Realtime already configured for tables');
      return { success: true, alreadyConfigured: true };
    }
  } catch (error) {
    console.error('Error in realtime configuration:', error);
    return { success: false, error };
  }
};

/**
 * Check if we have the necessary database functions for realtime configuration
 * These would need to be created by an admin
 */
export const checkRealtimeFunctions = async () => {
  try {
    // Use type assertion to work around TypeScript errors
    const { data, error } = await (supabase.rpc as any)('check_realtime_functions');
    
    if (error) {
      console.warn('Realtime helper functions not available:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error checking realtime functions:', error);
    return false;
  }
};

/**
 * Enhanced helper function to check realtime service health and connection status
 * This can be used to diagnose realtime connection issues
 */
export const checkRealtimeHealth = async () => {
  try {
    let status = {
      functionsAvailable: false,
      channelConnected: false,
      error: null as string | null
    };
    
    // Check if the necessary functions are available
    status.functionsAvailable = await checkRealtimeFunctions();
    
    // Try to establish a test channel connection
    const channel = supabase.channel('realtime-health-check');
    
    // Create a promise that resolves when the channel connects or fails
    const connectionPromise = new Promise<boolean>((resolve) => {
      let resolved = false;
      
      // Set a timeout for connection attempt
      const timeout = setTimeout(() => {
        if (!resolved) {
          console.warn('Realtime connection timeout after 5 seconds');
          resolved = true;
          resolve(false);
        }
      }, 5000);
      
      channel
        .on('system', { event: '*' }, (payload) => {
          console.log('Realtime system event:', payload);
          
          if (payload.event === 'presence_join') {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              resolve(true);
            }
          }
        })
        .subscribe((status) => {
          console.log('Test channel status:', status);
          
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              resolve(true);
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              resolve(false);
            }
          }
        });
    });
    
    status.channelConnected = await connectionPromise;
    
    // Clean up the test channel
    supabase.removeChannel(channel);
    
    return status;
  } catch (error) {
    console.error('Error in realtime health check:', error);
    return {
      functionsAvailable: false,
      channelConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
