
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
  // Update media_type to accept any string, not just the restricted union type
  media_type?: string | null;
  conversation_id?: string;
  sender?: {
    avatar_url: string | null;
    username: string | null;
    full_name: string | null;
  } | null;
  reactions?: MessageReaction[];
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
