
export interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  media_url?: string | null;
  media_type?: string | null;
  author?: {
    full_name: string | null;
    user_type: string | null;
  } | null;
  likes_count?: number;
  comments_count?: number;
}
