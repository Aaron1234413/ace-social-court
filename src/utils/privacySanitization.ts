
import { Post } from '@/types/post';

export interface PrivacyContext {
  currentUserId?: string;
  userFollowings?: string[];
  userType?: string | null;
  isCoach?: boolean;
}

/**
 * Sanitizes posts based on privacy levels and user relationships with smart fallbacks
 */
export function sanitizePostsForUser(posts: Post[], context: PrivacyContext): Post[] {
  console.log('Privacy sanitization started', { 
    postsCount: posts.length, 
    context: {
      userId: context.currentUserId,
      followingCount: context.userFollowings?.length || 0,
      userType: context.userType
    }
  });

  if (!context.currentUserId) {
    // For unauthenticated users, only show public posts
    const publicPosts = posts.filter(post => post.privacy_level === 'public');
    console.log('Unauthenticated user - showing public posts only:', publicPosts.length);
    return publicPosts;
  }

  try {
    const filteredPosts = posts.filter(post => canUserViewPost(post, context));
    console.log('Privacy filtering completed', { 
      originalCount: posts.length, 
      filteredCount: filteredPosts.length 
    });
    return filteredPosts;
  } catch (error) {
    console.error('Error in privacy sanitization, falling back to public posts:', error);
    // Fallback to public posts if privacy filtering fails
    return posts.filter(post => post.privacy_level === 'public' || post.user_id === context.currentUserId);
  }
}

/**
 * Smart content mixing based on user's social graph size
 */
export function getContentMixingRatio(followingCount: number): { followedRatio: number; publicRatio: number } {
  if (followingCount <= 2) {
    return { followedRatio: 0.2, publicRatio: 0.8 }; // 20% followed, 80% public
  } else if (followingCount <= 10) {
    return { followedRatio: 0.6, publicRatio: 0.4 }; // 60% followed, 40% public
  } else {
    return { followedRatio: 0.8, publicRatio: 0.2 }; // 80% followed, 20% public
  }
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
      console.warn('Unknown privacy level:', post.privacy_level);
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
