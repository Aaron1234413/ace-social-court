
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import NotificationsList from './NotificationsList';
import { useToast } from '@/hooks/use-toast';

const NotificationsPopover = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) throw error;
      
      setUnreadCount(count || 0);
      console.log('Unread notifications count:', count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };
  
  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchUnreadCount();
      
      // Subscribe to notifications in real-time
      const channel = supabase
        .channel('notifications-badge')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Notification change detected:', payload);
            fetchUnreadCount();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
        
      if (error) throw error;
      
      setUnreadCount(0);
      toast({
        title: "Notifications marked as read",
        description: "All notifications have been marked as read"
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to mark notifications as read"
      });
    }
  };
  
  if (!user) return null;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <NotificationsList onNotificationRead={fetchUnreadCount} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPopover;
