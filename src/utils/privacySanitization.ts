
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
  console.log('🛡️ Privacy Sanitization: Starting with', { 
    postsCount: posts.length, 
    context: {
      userId: context.currentUserId?.substring(0, 8) + '...',
      followingCount: context.userFollowings?.length || 0,
      userType: context.userType,
      isCoach: context.isCoach
    }
  });

  if (!context.currentUserId) {
    // For unauthenticated users, only show public posts
    const publicPosts = posts.filter(post => post.privacy_level === 'public');
    console.log('🛡️ Unauthenticated user - showing public posts only:', publicPosts.length);
    return publicPosts;
  }

  try {
    // Analyze privacy distribution
    const privacyBreakdown = posts.reduce((acc, post) => {
      acc[post.privacy_level || 'unknown'] = (acc[post.privacy_level || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🛡️ Privacy distribution:', privacyBreakdown);
    
    const filteredPosts = posts.filter(post => canUserViewPost(post, context));
    
    // Log filtering results by privacy level
    const filteredBreakdown = filteredPosts.reduce((acc, post) => {
      acc[post.privacy_level || 'unknown'] = (acc[post.privacy_level || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🛡️ After filtering:', filteredBreakdown);
    console.log('🛡️ Privacy filtering completed:', { 
      originalCount: posts.length, 
      filteredCount: filteredPosts.length,
      reductionPercentage: Math.round(((posts.length - filteredPosts.length) / posts.length) * 100)
    });
    
    // Warning if too many posts were filtered out
    if (filteredPosts.length < posts.length * 0.3 && posts.length > 5) {
      console.warn('⚠️ Privacy filtering removed >70% of posts - this might be too aggressive');
    }
    
    return filteredPosts;
  } catch (error) {
    console.error('❌ Error in privacy sanitization, falling back to safe posts:', error);
    // Fallback to posts user can definitely see
    const safePosts = posts.filter(post => 
      post.privacy_level === 'public' || post.user_id === context.currentUserId
    );
    console.log('🛡️ Emergency fallback applied:', safePosts.length, 'safe posts');
    return safePosts;
  }
}

/**
 * Smart content mixing based on user's social graph size
 */
export function getContentMixingRatio(followingCount: number): { followedRatio: number; publicRatio: number } {
  console.log('📊 Calculating content mix for following count:', followingCount);
  
  let ratio;
  if (followingCount <= 2) {
    ratio = { followedRatio: 0.2, publicRatio: 0.8 }; // 20% followed, 80% public
  } else if (followingCount <= 10) {
    ratio = { followedRatio: 0.6, publicRatio: 0.4 }; // 60% followed, 40% public
  } else {
    ratio = { followedRatio: 0.8, publicRatio: 0.2 }; // 80% followed, 20% public
  }
  
  console.log('📊 Content mix ratio:', ratio);
  return ratio;
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
      const canViewFriends = userFollowings.includes(post.user_id);
      if (!canViewFriends) {
        console.log(`🛡️ Blocking friends post from ${post.user_id.substring(0, 8)}... (not following)`);
      }
      return canViewFriends;

    case 'coaches':
      // Only coaches can see coach-only posts
      if (!isCoach) {
        console.log(`🛡️ Blocking coaches-only post from ${post.user_id.substring(0, 8)}... (not a coach)`);
      }
      return isCoach;

    default:
      console.warn('⚠️ Unknown privacy level:', post.privacy_level, 'for post', post.id);
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
