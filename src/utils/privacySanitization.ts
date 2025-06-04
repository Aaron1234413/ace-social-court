
import { Post } from '@/types/post';

export interface PrivacyContext {
  currentUserId?: string;
  userFollowings?: string[];
  userType?: string | null;
  isCoach?: boolean;
}

/**
 * Sanitizes posts based on privacy levels with graduated filtering for new users
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

  const followingCount = context.userFollowings?.length || 0;
  const isNewUser = followingCount <= 2;

  try {
    // Analyze privacy distribution
    const privacyBreakdown = posts.reduce((acc, post) => {
      acc[post.privacy_level || 'unknown'] = (acc[post.privacy_level || 'unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('🛡️ Privacy distribution:', privacyBreakdown);
    console.log('🛡️ User status:', { isNewUser, followingCount });
    
    // Apply graduated filtering based on user status
    let filteredPosts: Post[];
    
    if (isNewUser) {
      console.log('🛡️ Applying NEW USER graduated filtering...');
      filteredPosts = applyGraduatedFiltering(posts, context);
    } else {
      console.log('🛡️ Applying STANDARD privacy filtering...');
      filteredPosts = posts.filter(post => canUserViewPost(post, context));
    }
    
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
    
    // Warning if too many posts were filtered out (only for experienced users)
    if (!isNewUser && filteredPosts.length < posts.length * 0.3 && posts.length > 5) {
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
 * Graduated filtering for new users - more permissive to ensure content availability
 */
function applyGraduatedFiltering(posts: Post[], context: PrivacyContext): Post[] {
  const { currentUserId, userFollowings = [], isCoach = false } = context;
  const followingCount = userFollowings.length;
  
  console.log('🎓 Graduated filtering for new user with', followingCount, 'followings');
  
  // Stage 1: Posts user can definitely see
  const ownPosts = posts.filter(post => post.user_id === currentUserId);
  const publicPosts = posts.filter(post => 
    post.privacy_level === 'public' && post.user_id !== currentUserId
  );
  
  // Stage 2: Posts from followed users (if any)
  const friendsPosts = posts.filter(post => 
    post.privacy_level === 'friends' && 
    userFollowings.includes(post.user_id) && 
    post.user_id !== currentUserId
  );
  
  // Stage 3: Coach posts (if user is a coach)
  const coachPosts = posts.filter(post => 
    post.privacy_level === 'coaches' && 
    isCoach && 
    post.user_id !== currentUserId
  );
  
  // Combine all accessible posts
  const accessiblePosts = [...ownPosts, ...friendsPosts, ...coachPosts, ...publicPosts];
  
  // Remove duplicates
  const uniquePosts = accessiblePosts.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  );
  
  console.log('🎓 Graduated filtering results:', {
    own: ownPosts.length,
    friends: friendsPosts.length,
    coaches: coachPosts.length,
    public: publicPosts.length,
    total: uniquePosts.length
  });
  
  // For very new users (0-1 followings), ensure they see enough content
  if (followingCount <= 1 && uniquePosts.length < 5) {
    console.log('🎓 VERY NEW USER: Adding more public content to reach minimum');
    // Add more public posts if needed, sorted by engagement
    const additionalPublic = posts
      .filter(post => 
        post.privacy_level === 'public' && 
        !uniquePosts.some(up => up.id === post.id)
      )
      .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
      .slice(0, 5 - uniquePosts.length);
    
    uniquePosts.push(...additionalPublic);
    console.log('🎓 Added', additionalPublic.length, 'additional public posts');
  }
  
  return uniquePosts;
}

/**
 * Smart content mixing based on user's social graph size with improved ratios
 */
export function getContentMixingRatio(followingCount: number): { followedRatio: number; publicRatio: number } {
  console.log('📊 Calculating content mix for following count:', followingCount);
  
  let ratio;
  if (followingCount === 0) {
    ratio = { followedRatio: 0.0, publicRatio: 1.0 }; // 100% public for brand new users
  } else if (followingCount === 1) {
    ratio = { followedRatio: 0.3, publicRatio: 0.7 }; // 30% followed, 70% public
  } else if (followingCount === 2) {
    ratio = { followedRatio: 0.4, publicRatio: 0.6 }; // 40% followed, 60% public
  } else if (followingCount <= 5) {
    ratio = { followedRatio: 0.6, publicRatio: 0.4 }; // 60% followed, 40% public
  } else if (followingCount <= 10) {
    ratio = { followedRatio: 0.7, publicRatio: 0.3 }; // 70% followed, 30% public
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
