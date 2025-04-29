
export interface Notification {
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

export interface NotificationsListProps {
  onNotificationRead?: () => void;
  filterUnread?: boolean;
}
