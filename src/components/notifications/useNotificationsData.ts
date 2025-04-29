
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Notification } from './types';

export const useNotificationsData = (filterUnread: boolean = false) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (filterUnread) {
        query = query.eq('read', false);
      }
        
      const { data, error } = await query;
        
      if (error) throw error;
      
      console.log('Fetched notifications:', data);
      
      // Fetch sender profile information for each notification
      if (data && data.length > 0) {
        const senderIds = data
          .filter(n => n.sender_id)
          .map(n => n.sender_id) as string[];
          
        if (senderIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', [...new Set(senderIds)]);
            
          if (profilesError) throw profilesError;
          
          if (profilesData) {
            const profileMap = new Map();
            profilesData.forEach(profile => {
              profileMap.set(profile.id, profile);
            });
            
            const notificationsWithSenders = data.map(notification => ({
              ...notification,
              sender: notification.sender_id ? profileMap.get(notification.sender_id) : null
            }));
            
            setNotifications(notificationsWithSenders);
            console.log('Notifications with senders:', notificationsWithSenders);
          }
        } else {
          setNotifications(data);
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markAsRead = async (id: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);
        
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('notifications-list-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Notification change detected in list:', payload);
            fetchNotifications();
          }
        )
        .subscribe((status) => {
          console.log('Notifications list subscription status:', status);
        });
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, filterUnread]);
  
  return { notifications, isLoading, markAsRead };
};
