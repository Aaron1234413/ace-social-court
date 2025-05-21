
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to check if realtime is properly configured for essential tables
 * This only needs to be run once per database setup
 */
export const configureRealtime = async () => {
  try {
    console.log('Checking realtime configuration for tables...');
    
    // Try to create a basic test channel to verify realtime connectivity
    const testChannel = supabase.channel('realtime-test');
    
    let isConnected = false;
    
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.log('Realtime connection test timed out');
        resolve();
      }, 5000);
      
      testChannel
        .subscribe(async (status) => {
          clearTimeout(timeout);
          
          if (status === 'SUBSCRIBED') {
            console.log('Realtime connection established successfully');
            isConnected = true;
          } else {
            console.warn('Realtime connection failed with status:', status);
          }
          
          resolve();
        });
    });
    
    // Cleanup the test channel
    supabase.removeChannel(testChannel);
    
    if (!isConnected) {
      return { 
        success: false, 
        error: 'Could not establish realtime connection' 
      };
    }
    
    // Set up direct_messages channel
    const messagesChannel = supabase.channel('messages-changes');
    
    // Set up conversations channel
    const conversationsChannel = supabase.channel('conversations-changes');
    
    // Subscribe to both channels to ensure they're properly registered
    await Promise.all([
      new Promise<void>((resolve) => {
        messagesChannel.subscribe((status) => {
          console.log('Messages channel status:', status);
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        conversationsChannel.subscribe((status) => {
          console.log('Conversations channel status:', status);
          resolve();
        });
      })
    ]);
    
    console.log('Successfully configured realtime channels');
    return { success: true };
    
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
    // Since we don't have access to the necessary admin functions,
    // we'll just check if we can establish a basic realtime connection
    const channel = supabase.channel('realtime-function-check');
    
    let connected = false;
    
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 3000);
      
      channel
        .subscribe((status) => {
          clearTimeout(timeout);
          connected = status === 'SUBSCRIBED';
          resolve();
        });
    });
    
    // Clean up
    supabase.removeChannel(channel);
    
    return connected;
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
