
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/components/AuthProvider';
import { useNotificationsData } from './useNotificationsData';
import NotificationItem from './NotificationItem';
import NotificationsLoading from './NotificationsLoading';
import NotificationsEmpty from './NotificationsEmpty';
import { NotificationsListProps } from './types';

const NotificationsList = ({ onNotificationRead, filterUnread = false }: NotificationsListProps) => {
  const { user } = useAuth();
  const { notifications, isLoading, markAsRead } = useNotificationsData(filterUnread);
  
  if (!user) return null;
  
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    
    if (onNotificationRead) {
      onNotificationRead();
    }
  };
  
  if (isLoading) {
    return <NotificationsLoading />;
  }
  
  if (notifications.length === 0) {
    return <NotificationsEmpty />;
  }
  
  return (
    <ScrollArea className="h-[450px]">
      <div className="divide-y">
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id}
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default NotificationsList;
