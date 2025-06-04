
import { Post } from "@/types/post";
import { getContentMixingRatio } from "./privacySanitization";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

interface MixingStage {
  name: string;
  count: number;
  error?: string;
}

/**
 * Optimized smart feed mixing with error handling and content guarantees
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('🎯 Smart Feed Mix: Starting with', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowings: userFollowings.length
  });

  // Input validation
  if (!allPosts || allPosts.length === 0) {
    console.log('🎯 No posts to mix, returning empty array');
    return [];
  }

  try {
    const stages: MixingStage[] = [];
    
    // Get optimized mixing ratios
    const { followedRatio, publicRatio } = getContentMixingRatio(followingCount);
    
    // Categorize posts efficiently
    const postCategories = categorizePostsOptimized(allPosts, userFollowings, currentUserId);
    stages.push({ name: 'Categorization', count: allPosts.length });
    
    console.log('🎯 Post categories:', {
      userPosts: postCategories.userPosts.length,
      followedPosts: postCategories.followedPosts.length,
      publicPosts: postCategories.publicPosts.length
    });

    // Calculate target distribution with minimum guarantees
    const targets = calculateOptimalTargets(postCategories, followingCount, followedRatio, publicRatio);
    stages.push({ name: 'Target Calculation', count: targets.total });
    
    console.log('🎯 Target distribution:', targets);
    
    // Build mixed feed with error handling
    const mixedFeed = buildMixedFeedOptimized(postCategories, targets, followingCount);
    stages.push({ name: 'Feed Mixing', count: mixedFeed.length });
    
    // Apply final sorting and limits
    const finalFeed = applyFinalSortingAndLimits(mixedFeed, followingCount);
    stages.push({ name: 'Final Sorting', count: finalFeed.length });
    
    console.log('🎯 Smart feed mix completed:', {
      finalCount: finalFeed.length,
      stages: stages.length,
      success: finalFeed.length > 0
    });
    
    return finalFeed;
    
  } catch (error) {
    console.error('❌ Smart feed mixing failed:', error);
    
    // Fallback: return posts in simple chronological order
    console.log('🆘 Applying simple chronological fallback');
    const fallbackPosts = allPosts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15);
    
    console.log('🆘 Fallback applied:', fallbackPosts.length, 'posts');
    return fallbackPosts;
  }
}

/**
 * Optimized post categorization
 */
function categorizePostsOptimized(
  posts: Post[],
  userFollowings: string[],
  currentUserId?: string
) {
  const userPosts: Post[] = [];
  const followedPosts: Post[] = [];
  const publicPosts: Post[] = [];
  
  // Single pass categorization for efficiency
  posts.forEach(post => {
    if (post.user_id === currentUserId) {
      userPosts.push(post);
    } else if (userFollowings.includes(post.user_id)) {
      followedPosts.push(post);
    } else if (post.privacy_level === 'public') {
      publicPosts.push(post);
    }
  });
  
  return { userPosts, followedPosts, publicPosts };
}

/**
 * Calculate optimal target distribution with minimum content guarantees
 */
function calculateOptimalTargets(
  categories: { userPosts: Post[], followedPosts: Post[], publicPosts: Post[] },
  followingCount: number,
  followedRatio: number,
  publicRatio: number
) {
  const { userPosts, followedPosts, publicPosts } = categories;
  
  // Dynamic minimum based on user status
  const minPosts = followingCount <= 2 ? 8 : 5;
  const maxPosts = 20;
  const availableTotal = userPosts.length + followedPosts.length + publicPosts.length;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, availableTotal));
  
  // Calculate base targets
  let targetFollowed = Math.floor(targetTotal * followedRatio);
  let targetPublic = Math.floor(targetTotal * publicRatio);
  
  // Adjust for content availability
  targetFollowed = Math.min(targetFollowed, followedPosts.length);
  targetPublic = Math.min(targetPublic, publicPosts.length);
  
  // Ensure new users get enough content
  if (followingCount <= 2) {
    const remaining = targetTotal - userPosts.length - targetFollowed;
    targetPublic = Math.max(targetPublic, remaining);
  }
  
  // Rebalance if we have excess capacity
  const allocatedContent = userPosts.length + targetFollowed + targetPublic;
  if (allocatedContent < targetTotal) {
    const remaining = targetTotal - allocatedContent;
    if (publicPosts.length > targetPublic) {
      targetPublic += Math.min(remaining, publicPosts.length - targetPublic);
    }
  }
  
  return {
    total: targetTotal,
    user: userPosts.length,
    followed: targetFollowed,
    public: targetPublic,
    isNewUser: followingCount <= 2
  };
}

/**
 * Build mixed feed with optimal selection
 */
function buildMixedFeedOptimized(
  categories: { userPosts: Post[], followedPosts: Post[], publicPosts: Post[] },
  targets: any,
  followingCount: number
): Post[] {
  const { userPosts, followedPosts, publicPosts } = categories;
  const mixedFeed: Post[] = [];
  
  // Always include user's own posts first
  mixedFeed.push(...userPosts);
  console.log('🎯 Added user posts:', userPosts.length);
  
  // Add followed users' posts (chronologically sorted)
  if (targets.followed > 0 && followedPosts.length > 0) {
    const selectedFollowed = followedPosts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, targets.followed);
    mixedFeed.push(...selectedFollowed);
    console.log('🎯 Added followed posts:', selectedFollowed.length);
  }
  
  // Add public discovery posts with smart sorting
  if (targets.public > 0 && publicPosts.length > 0) {
    const selectedPublic = publicPosts
      .sort((a, b) => {
        // Enhanced sorting for new users
        if (followingCount <= 2) {
          const engagementWeight = 0.4;
          const timeWeight = 0.6;
          
          const scoreA = (a.engagement_score || 0) * engagementWeight + 
                        new Date(a.created_at).getTime() * timeWeight;
          const scoreB = (b.engagement_score || 0) * engagementWeight + 
                        new Date(b.created_at).getTime() * timeWeight;
          
          return scoreB - scoreA;
        } else {
          // Standard sorting: engagement first, then recency
          const engagementDiff = (b.engagement_score || 0) - (a.engagement_score || 0);
          if (engagementDiff !== 0) return engagementDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      })
      .slice(0, targets.public);
    
    mixedFeed.push(...selectedPublic);
    console.log('🎯 Added public posts:', selectedPublic.length);
  }
  
  return mixedFeed;
}

/**
 * Apply final sorting and limits
 */
function applyFinalSortingAndLimits(posts: Post[], followingCount: number): Post[] {
  if (posts.length === 0) return posts;
  
  // Smart final sorting
  const sortedPosts = posts.sort((a, b) => {
    if (followingCount <= 2) {
      // For new users: mix of recency and engagement
      const timeWeight = 0.6;
      const engagementWeight = 0.4;
      
      const timeScoreA = new Date(a.created_at).getTime();
      const timeScoreB = new Date(b.created_at).getTime();
      const engagementScoreA = (a.engagement_score || 0) + (a.likes_count || 0);
      const engagementScoreB = (b.engagement_score || 0) + (b.likes_count || 0);
      
      const finalScoreA = timeScoreA * timeWeight + engagementScoreA * engagementWeight;
      const finalScoreB = timeScoreB * timeWeight + engagementScoreB * engagementWeight;
      
      return finalScoreB - finalScoreA;
    } else {
      // Standard chronological sort for experienced users
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
  
  // Apply final limit
  const finalPosts = sortedPosts.slice(0, 20);
  
  console.log('🎯 Final sorting applied:', {
    input: posts.length,
    output: finalPosts.length,
    newUserOptimized: followingCount <= 2
  });
  
  return finalPosts;
}

/**
 * Optimized minimum content guarantee with better error handling
 */
export function ensureMinimumContent(
  posts: Post[],
  allAvailablePosts: Post[],
  currentUserId?: string
): Post[] {
  const minPosts = 3;
  
  console.log('🆘 Minimum Content Check:', {
    currentPosts: posts.length,
    availablePosts: allAvailablePosts.length,
    minRequired: minPosts
  });
  
  if (posts.length >= minPosts) {
    console.log('✅ Sufficient content available');
    return posts;
  }
  
  try {
    console.log('🆘 APPLYING OPTIMIZED FALLBACK');
    
    const existingIds = new Set(posts.map(p => p.id));
    const fallbackPosts = allAvailablePosts
      .filter(post => 
        !existingIds.has(post.id) && 
        (post.privacy_level === 'public' || post.user_id === currentUserId)
      )
      .sort((a, b) => {
        // Multi-factor sorting: engagement + recency + likes
        const scoreA = (a.engagement_score || 0) * 2 + (a.likes_count || 0) + 
                      (new Date(a.created_at).getTime() / 1000000); // Normalize time
        const scoreB = (b.engagement_score || 0) * 2 + (b.likes_count || 0) + 
                      (new Date(b.created_at).getTime() / 1000000);
        return scoreB - scoreA;
      })
      .slice(0, Math.max(minPosts - posts.length, 5));
    
    const result = [...posts, ...fallbackPosts];
    
    console.log('🆘 Optimized fallback applied:', {
      original: posts.length,
      added: fallbackPosts.length,
      final: result.length,
      success: result.length >= minPosts
    });
    
    return result;
  } catch (error) {
    console.error('❌ Fallback mechanism failed:', error);
    return posts; // Return original posts if fallback fails
  }
}
