
import { format, formatDistanceToNow } from 'date-fns';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Notification } from './types';
import { getNotificationIcon, getNotificationLink } from './notificationUtils';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  const isUnread = !notification.read;
  const notificationLink = getNotificationLink(notification);
  const notificationTime = new Date(notification.created_at);
  const timeAgo = formatDistanceToNow(notificationTime, { addSuffix: true });
  const fullDate = format(notificationTime, 'PPp');
  
  return (
    <div 
      className={`flex items-start gap-3 p-3 ${isUnread ? 'bg-primary/5' : ''}`}
    >
      <div className="mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <Link 
          to={notificationLink}
          className="block"
          onClick={() => isUnread && onMarkAsRead(notification.id)}
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
          onClick={() => onMarkAsRead(notification.id)}
          title="Mark as read"
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">Mark as read</span>
        </Button>
      )}
    </div>
  );
};

export default NotificationItem;
