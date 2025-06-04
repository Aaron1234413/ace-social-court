import { Post } from '@/types/post';

export interface PrivacyContext {
  currentUserId?: string;
  userFollowings?: string[];
  userType?: string | null;
  isCoach?: boolean;
}

/**
 * Optimized privacy sanitization with improved error handling and minimum content guarantees
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

  // Input validation
  if (!posts || posts.length === 0) {
    console.log('🛡️ No posts to sanitize');
    return [];
  }

  if (!context.currentUserId) {
    const publicPosts = posts.filter(post => post.privacy_level === 'public');
    console.log('🛡️ Unauthenticated user - showing public posts only:', publicPosts.length);
    return publicPosts;
  }

  const followingCount = context.userFollowings?.length || 0;
  const isNewUser = followingCount <= 2;

  try {
    // Categorize posts for better processing
    const postCategories = {
      own: posts.filter(post => post.user_id === context.currentUserId),
      public: posts.filter(post => post.privacy_level === 'public' && post.user_id !== context.currentUserId),
      friends: posts.filter(post => 
        post.privacy_level === 'friends' && 
        context.userFollowings?.includes(post.user_id) && 
        post.user_id !== context.currentUserId
      ),
      coaches: posts.filter(post => 
        post.privacy_level === 'coaches' && 
        context.isCoach && 
        post.user_id !== context.currentUserId
      )
    };
    
    console.log('🛡️ Post categories:', {
      own: postCategories.own.length,
      public: postCategories.public.length,
      friends: postCategories.friends.length,
      coaches: postCategories.coaches.length
    });
    
    // Apply graduated filtering based on user experience
    let filteredPosts: Post[];
    
    if (isNewUser) {
      console.log('🛡️ Applying NEW USER optimized filtering...');
      filteredPosts = applyNewUserFiltering(postCategories, context);
    } else {
      console.log('🛡️ Applying STANDARD privacy filtering...');
      filteredPosts = applyStandardFiltering(posts, context);
    }
    
    // Minimum content guarantee
    const minPosts = isNewUser ? 3 : 2;
    if (filteredPosts.length < minPosts) {
      console.log(`🆘 Insufficient content (${filteredPosts.length}/${minPosts}), applying content boost`);
      filteredPosts = ensureMinimumContent(filteredPosts, postCategories, minPosts);
    }
    
    console.log('🛡️ Privacy filtering completed:', { 
      originalCount: posts.length, 
      filteredCount: filteredPosts.length,
      reductionPercentage: Math.round(((posts.length - filteredPosts.length) / posts.length) * 100)
    });
    
    return filteredPosts;
  } catch (error) {
    console.error('❌ Privacy sanitization error, applying safe fallback:', error);
    // Safe fallback: own posts + public posts
    const safePosts = posts.filter(post => 
      post.privacy_level === 'public' || post.user_id === context.currentUserId
    );
    console.log('🛡️ Safe fallback applied:', safePosts.length, 'posts');
    return safePosts;
  }
}

/**
 * Optimized filtering for new users with content guarantees
 */
function applyNewUserFiltering(
  categories: { own: Post[], public: Post[], friends: Post[], coaches: Post[] },
  context: PrivacyContext
): Post[] {
  const { own, public: publicPosts, friends, coaches } = categories;
  const followingCount = context.userFollowings?.length || 0;
  
  console.log('🎓 New user filtering for', followingCount, 'followings');
  
  // Prioritize content for new users
  let result = [...own]; // Always include own posts
  
  // Add friends posts (limited to prevent overwhelming)
  const maxFriendsPosts = Math.max(2, followingCount * 2);
  result.push(...friends.slice(0, maxFriendsPosts));
  
  // Add coach posts if applicable
  if (context.isCoach) {
    result.push(...coaches.slice(0, 3));
  }
  
  // Fill remaining with engaging public content
  const existingIds = new Set(result.map(p => p.id));
  const availablePublic = publicPosts
    .filter(post => !existingIds.has(post.id))
    .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0));
  
  const targetTotal = Math.max(8, result.length + 3); // Ensure good content volume for new users
  const remainingSlots = Math.max(0, targetTotal - result.length);
  
  result.push(...availablePublic.slice(0, remainingSlots));
  
  console.log('🎓 New user filtering results:', {
    own: own.length,
    friends: Math.min(friends.length, maxFriendsPosts),
    coaches: context.isCoach ? Math.min(coaches.length, 3) : 0,
    public: Math.min(availablePublic.length, remainingSlots),
    total: result.length
  });
  
  return result;
}

/**
 * Standard filtering for experienced users
 */
function applyStandardFiltering(posts: Post[], context: PrivacyContext): Post[] {
  return posts.filter(post => canUserViewPost(post, context));
}

/**
 * Ensures minimum content availability
 */
function ensureMinimumContent(
  currentPosts: Post[],
  categories: { own: Post[], public: Post[], friends: Post[], coaches: Post[] },
  minRequired: number
): Post[] {
  if (currentPosts.length >= minRequired) return currentPosts;
  
  const existingIds = new Set(currentPosts.map(p => p.id));
  const additionalPosts: Post[] = [];
  
  // Add more public posts sorted by engagement
  const availablePublic = categories.public
    .filter(post => !existingIds.has(post.id))
    .sort((a, b) => {
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0);
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0);
      return scoreB - scoreA;
    });
  
  const needed = minRequired - currentPosts.length;
  additionalPosts.push(...availablePublic.slice(0, Math.max(needed, 2)));
  
  console.log('🆘 Content boost applied:', {
    original: currentPosts.length,
    added: additionalPosts.length,
    final: currentPosts.length + additionalPosts.length
  });
  
  return [...currentPosts, ...additionalPosts];
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
