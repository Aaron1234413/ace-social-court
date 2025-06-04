
import { Post } from "@/types/post";
import { getContentMixingRatio } from "./privacySanitization";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content based on user's social graph with improved logic for new users
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

  // Get mixing ratios based on follow count (now with improved ratios)
  const { followedRatio, publicRatio } = getContentMixingRatio(followingCount);
  
  // Separate posts into categories
  const userPosts = allPosts.filter(post => post.user_id === currentUserId);
  const followedPosts = allPosts.filter(post => 
    userFollowings.includes(post.user_id) && post.user_id !== currentUserId
  );
  const publicPosts = allPosts.filter(post => 
    post.privacy_level === 'public' && 
    post.user_id !== currentUserId && 
    !userFollowings.includes(post.user_id)
  );

  console.log('🎯 Post categories:', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    publicPosts: publicPosts.length
  });

  // Calculate target counts with special handling for new users
  const minPosts = followingCount <= 2 ? 8 : 5; // More content for new users
  const totalAvailable = userPosts.length + followedPosts.length + publicPosts.length;
  const targetTotal = Math.max(minPosts, Math.min(20, totalAvailable));
  
  let targetFollowed = Math.floor(targetTotal * followedRatio);
  let targetPublic = Math.floor(targetTotal * publicRatio);
  
  // Ensure new users get enough content even if ratios would limit them
  if (followingCount <= 2) {
    targetFollowed = Math.min(followedPosts.length, targetFollowed);
    targetPublic = Math.max(targetPublic, targetTotal - userPosts.length - targetFollowed);
    console.log('🎯 NEW USER: Adjusted targets for better content availability');
  }
  
  console.log('🎯 Target distribution:', {
    targetTotal,
    targetFollowed,
    targetPublic,
    ratios: { followedRatio, publicRatio },
    isNewUser: followingCount <= 2
  });
  
  // Build the mixed feed
  const mixedFeed: Post[] = [];
  
  // Always include user's own posts first
  mixedFeed.push(...userPosts);
  console.log('🎯 Added user posts:', userPosts.length);
  
  // Add followed users' posts
  const selectedFollowed = followedPosts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, targetFollowed);
  mixedFeed.push(...selectedFollowed);
  console.log('🎯 Added followed posts:', selectedFollowed.length);
  
  // Add public discovery posts with enhanced sorting for new users
  const selectedPublic = publicPosts
    .sort((a, b) => {
      // For new users, prioritize engagement more heavily
      const engagementMultiplier = followingCount <= 2 ? 3 : 2;
      const scoreA = (a.engagement_score || 0) * engagementMultiplier + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) * engagementMultiplier + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, targetPublic);
  mixedFeed.push(...selectedPublic);
  console.log('🎯 Added public posts:', selectedPublic.length, '(enhanced sorting for new users:', followingCount <= 2, ')');
  
  // Final sort by creation time with some engagement weighting for new users
  const finalFeed = mixedFeed
    .sort((a, b) => {
      if (followingCount <= 2) {
        // For new users, slightly favor recent engaging content
        const timeWeight = 0.7;
        const engagementWeight = 0.3;
        
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
    })
    .slice(0, 20); // Limit to 20 posts max
  
  console.log('🎯 Smart feed mix completed:', {
    finalCount: finalFeed.length,
    breakdown: {
      user: userPosts.length,
      followed: selectedFollowed.length,
      public: selectedPublic.length
    },
    newUserOptimized: followingCount <= 2
  });
  
  return finalFeed;
}

/**
 * Ensures minimum content in feed with enhanced fallback strategies for new users
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
  
  console.log('🆘 APPLYING ENHANCED FALLBACK: Insufficient content, adding public posts');
  
  // Enhanced fallback: Add public posts to reach minimum, prioritizing engaging content
  const existingIds = new Set(posts.map(p => p.id));
  const fallbackPosts = allAvailablePosts
    .filter(post => 
      !existingIds.has(post.id) && 
      post.privacy_level === 'public'
    )
    .sort((a, b) => {
      // Sort by engagement score first, then recency
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, Math.max(minPosts - posts.length, 5)); // Ensure at least 5 additional posts for new users
  
  const result = [...posts, ...fallbackPosts];
  
  console.log('🆘 Enhanced fallback applied:', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length,
    success: result.length >= minPosts
  });
  
  // If still not enough content, warn but continue
  if (result.length < minPosts) {
    console.warn('⚠️ Still insufficient content after enhanced fallback - may need to adjust privacy settings or add more public content');
  }
  
  return result;
}
