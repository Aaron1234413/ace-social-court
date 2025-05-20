
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'heart' | 'laugh' | 'sad' | 'thumbs_up';
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  read: boolean;
  is_deleted?: boolean;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  sender?: {
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
  reactions?: MessageReaction[];
}
