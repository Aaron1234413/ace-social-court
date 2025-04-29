
import { MessageSquare, UserPlus, Heart, AtSign } from 'lucide-react';
import { Notification } from './types';

export const getNotificationIcon = (type: string) => {
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

export const getNotificationLink = (notification: Notification) => {
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
