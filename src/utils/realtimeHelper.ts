
import { supabase } from '@/integrations/supabase/client';

/**
 * Helper to check if realtime is properly configured for essential tables
 * This only needs to be run once per database setup
 */
export const configureRealtime = async () => {
  try {
    console.log('Checking realtime configuration for tables...');
    
    // First check if the tables are added to the realtime publication
    const { data: publicationData, error: publicationError } = await supabase.rpc(
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
      const { error: configError } = await supabase.rpc('configure_realtime_tables');
      
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
    const { data, error } = await supabase.rpc('check_realtime_functions');
    
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
