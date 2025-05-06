
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  reactions?: MessageReaction[];
  is_deleted?: boolean;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'heart' | 'laugh' | 'sad' | 'thumbs_up';
  created_at: string;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
  last_message?: Message | null;
}
