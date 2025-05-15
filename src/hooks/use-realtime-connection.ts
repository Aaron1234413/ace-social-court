
import { useState, useCallback } from 'react';
import { checkRealtimeHealth, configureRealtime } from '@/utils/realtimeHelper';

export const useRealtimeConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  
  const checkAndConfigureRealtime = useCallback(async () => {
    try {
      const healthStatus = await checkRealtimeHealth();
      setConnectionStatus(healthStatus.channelConnected ? 'connected' : 'disconnected');
      
      if (!healthStatus.channelConnected) {
        console.log('Realtime connection issues detected, attempting to configure...');
        const configResult = await configureRealtime();
        console.log('Realtime configuration result:', configResult);
        
        // Re-check health after configuration
        const newStatus = await checkRealtimeHealth();
        setConnectionStatus(newStatus.channelConnected ? 'connected' : 'disconnected');
      }
    } catch (error) {
      console.error('Error during realtime configuration check:', error);
      setConnectionStatus('disconnected');
    }
  }, []);
  
  return {
    connectionStatus,
    setConnectionStatus,
    checkAndConfigureRealtime
  };
};
