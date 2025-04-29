
import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Check, UserPlus, Heart, MessageSquare, AtSign } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  content: string;
  created_at: string;
  read: boolean;
  sender_id: string | null;
  entity_id: string | null;
  entity_type: string | null;
  sender?: {
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
}

interface NotificationsListProps {
  onNotificationRead?: () => void;
}

const NotificationsList = ({ onNotificationRead }: NotificationsListProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
        
      if (error) throw error;
      
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
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  const handleMarkAsRead = async (id: string) => {
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
      
      if (onNotificationRead) {
        onNotificationRead();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };
  
  const getNotificationLink = (notification: Notification) => {
    const { type, entity_id, entity_type, sender_id } = notification;
    
    if (type === 'follow' && sender_id) {
      return `/profile/${sender_id}`;
    }
    
    if ((type === 'like' || type === 'comment' || type === 'mention') && entity_id) {
      if (entity_type === 'post') {
        return `/feed?post=${entity_id}`;
      }
    }
    
    return '#';
  };
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[450px]">
      <div className="divide-y">
        {notifications.map((notification) => {
          const isUnread = !notification.read;
          const notificationLink = getNotificationLink(notification);
          const notificationTime = new Date(notification.created_at);
          const timeAgo = formatDistanceToNow(notificationTime, { addSuffix: true });
          const fullDate = format(notificationTime, 'PPp');
          
          return (
            <div 
              key={notification.id}
              className={`flex items-start gap-3 p-3 ${isUnread ? 'bg-primary/5' : ''}`}
            >
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link 
                  to={notificationLink}
                  className="block"
                  onClick={() => isUnread && handleMarkAsRead(notification.id)}
                >
                  <p className="text-sm">{notification.content}</p>
                  <p className="text-xs text-muted-foreground mt-1" title={fullDate}>
                    {timeAgo}
                  </p>
                </Link>
              </div>
              
              {isUnread && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMarkAsRead(notification.id)}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Mark as read</span>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default NotificationsList;
