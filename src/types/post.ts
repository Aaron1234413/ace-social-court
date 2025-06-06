
export interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_url?: string | null;
  media_type?: string | null;
  privacy_level?: 'private' | 'public' | 'public_highlights';
  template_id?: string | null;
  is_auto_generated?: boolean;
  engagement_score?: number;
  is_ambassador_content?: boolean;
  is_fallback_content?: boolean;
  ambassador_priority?: boolean;
  author?: {
    full_name: string | null;
    user_type: string | null;
    avatar_url?: string | null;
  } | null;
  likes_count?: number;
  comments_count?: number;
}

export interface PostTemplate {
  id: string;
  category: 'workout' | 'match' | 'progress' | 'motivation' | 'technique';
  title: string;
  content_template: string;
  placeholders: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_ai_user?: boolean;
    ai_personality_type?: string | null;
  };
  following?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_ai_user?: boolean;
    ai_personality_type?: string | null;
  };
}

export interface AmbassadorProfile {
  id: string;
  profile_id: string;
  skill_level: string;
  specialization: string[];
  posting_schedule: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
