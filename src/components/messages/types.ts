
export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction_type: 'like' | 'heart' | 'laugh' | 'sad' | 'thumbs_up';
  created_at: string;
}

export interface MessageMedia {
  id: string;
  message_id: string;
  url: string;
  type: 'image' | 'video';
  created_at: string;
}
