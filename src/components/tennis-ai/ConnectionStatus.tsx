
import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { checkRealtimeHealth } from '@/utils/realtimeHelper';
import { toast } from 'sonner';

interface ConnectionStatusProps {
  onReconnect?: () => void;
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onReconnect, className }) => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [checking, setChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = useCallback(async () => {
    // Debounce check to avoid spamming
    const now = Date.now();
    if (now - lastCheckTime < 1000) {
      return;
    }
    
    setLastCheckTime(now);
    
    try {
      setChecking(true);
      console.log("Checking realtime connection status...");
      const health = await checkRealtimeHealth();
      console.log("Realtime health check result:", health);
      
      if (health && health.channelConnected) {
        setStatus('connected');
        // Reset retry count on successful connection
        setRetryCount(0);
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setStatus('disconnected');
    } finally {
      setChecking(false);
    }
  }, [lastCheckTime]);

  // Auto-retry connection at increasing intervals
  useEffect(() => {
    if (status === 'disconnected' && !checking && retryCount < 5) {
      const retryDelay = Math.min(2000 * Math.pow(2, retryCount), 30000); // Exponential backoff with max 30s
      
      console.log(`Auto-reconnect attempt ${retryCount + 1} scheduled in ${retryDelay}ms`);
      
      const timer = setTimeout(() => {
        console.log(`Executing auto-reconnect attempt ${retryCount + 1}`);
        handleReconnect();
        setRetryCount(prev => prev + 1);
      }, retryDelay);
      
      return () => clearTimeout(timer);
    }
  }, [status, checking, retryCount]);

  useEffect(() => {
    // Initialize status check
    console.log("ConnectionStatus component mounted");
    checkConnection();
    
    // Check connection status periodically
    const interval = setInterval(checkConnection, 30000); // every 30 seconds
    
    // Check online/offline status
    const handleOnline = () => {
      console.log("Device is online, checking connection...");
      toast.info("Network connection restored");
      checkConnection();
    };
    
    const handleOffline = () => {
      console.log("Device is offline, setting disconnected status");
      toast.error("Network connection lost");
      setStatus('disconnected');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  const handleReconnect = async () => {
    try {
      console.log("Attempting to reconnect...");
      setStatus('connecting');
      if (onReconnect) {
        onReconnect();
      }
      await checkConnection();
    } catch (error) {
      console.error('Error reconnecting:', error);
      setStatus('disconnected');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2", className)}>
            <div
              className={cn(
                "flex items-center",
                status === 'disconnected' && "cursor-pointer"
              )}
              onClick={status === 'disconnected' ? handleReconnect : undefined}
            >
              {status === 'connected' && <Wifi className="h-4 w-4 text-green-500" />}
              {status === 'connecting' && (
                <Wifi className="h-4 w-4 text-amber-400 animate-pulse" />
              )}
              {status === 'disconnected' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-destructive" 
                  onClick={handleReconnect}
                  disabled={checking}
                >
                  <WifiOff className="h-4 w-4 mr-1" />
                  <span className="text-xs">Reconnect</span>
                </Button>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {status === 'connected' && 'Connected to realtime service'}
          {status === 'connecting' && 'Connecting to realtime service...'}
          {status === 'disconnected' && 'Disconnected. Click to reconnect'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionStatus;
