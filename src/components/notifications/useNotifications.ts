
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userIds: string[];
  type: string;
  content: string;
  senderId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread notification count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);
          
        if (error) {
          console.error('Error fetching unread count:', error);
          return;
        }
        
        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Error in fetchUnreadCount:', err);
      }
    };
    
    fetchUnreadCount();
    
    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('unread-count-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          // When notifications change, update the count
          fetchUnreadCount();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const createNotification = async ({
    userIds,
    type,
    content,
    senderId = user?.id,
    entityId = null,
    entityType = null
  }: CreateNotificationParams) => {
    if (!userIds.length) return;
    
    try {
      // Filter out the current user from recipients (don't notify yourself)
      const filteredUserIds = userIds.filter(id => id !== user?.id);
      if (!filteredUserIds.length) return;
      
      console.log('Creating notifications for users:', filteredUserIds);
      
      // Prepare notifications for each recipient
      const notifications = filteredUserIds.map(userId => ({
        user_id: userId,
        type,
        content,
        sender_id: senderId,
        entity_id: entityId,
        entity_type: entityType
      }));
      
      const { error, data } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();
        
      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }
      
      console.log('Notifications created:', data);
      
    } catch (error) {
      console.error('Error in createNotification:', error);
    }
  };
  
  return { createNotification, unreadCount };
};
