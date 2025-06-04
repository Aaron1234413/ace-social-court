
import { Post } from '@/types/post';

export interface PrivacyContext {
  currentUserId?: string;
  userFollowings?: string[];
  userType?: string | null;
  isCoach?: boolean;
}

/**
 * Sanitizes posts based on privacy levels and user relationships
 */
export function sanitizePostsForUser(posts: Post[], context: PrivacyContext): Post[] {
  if (!context.currentUserId) {
    // For unauthenticated users, only show public posts
    return posts.filter(post => post.privacy_level === 'public');
  }

  return posts.filter(post => canUserViewPost(post, context));
}

/**
 * Determines if a user can view a specific post based on privacy rules
 */
export function canUserViewPost(post: Post, context: PrivacyContext): boolean {
  const { currentUserId, userFollowings = [], isCoach = false } = context;

  // User can always see their own posts
  if (post.user_id === currentUserId) {
    return true;
  }

  switch (post.privacy_level) {
    case 'public':
      return true;

    case 'private':
      return false; // Only the author can see private posts

    case 'friends':
      // User must be following the post author
      return userFollowings.includes(post.user_id);

    case 'coaches':
      // Only coaches can see coach-only posts
      return isCoach;

    default:
      return false;
  }
}

/**
 * Sanitizes post content for display (removes sensitive information if needed)
 */
export function sanitizePostContent(post: Post, context: PrivacyContext): Post {
  // For now, we don't modify content, but this could be extended
  // to blur images, redact text, etc. based on privacy settings
  return post;
}

/**
 * Gets privacy level display information
 */
export function getPrivacyLevelInfo(level: string) {
  const privacyInfo = {
    private: {
      label: 'Private',
      description: 'Only you can see this',
      icon: '🔒',
      color: 'text-gray-600'
    },
    friends: {
      label: 'Friends',
      description: 'People you follow can see this',
      icon: '👥',
      color: 'text-blue-600'
    },
    public: {
      label: 'Public',
      description: 'Anyone can see this',
      icon: '🌍',
      color: 'text-green-600'
    },
    coaches: {
      label: 'Coaches Only',
      description: 'Only coaches can see this',
      icon: '🎾',
      color: 'text-purple-600'
    }
  };

  return privacyInfo[level as keyof typeof privacyInfo] || privacyInfo.private;
}
