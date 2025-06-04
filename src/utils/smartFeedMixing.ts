
import { Post } from "@/types/post";
import { getContentMixingRatio } from "./privacySanitization";
import { FeedDistributionService } from "@/services/FeedDistributionService";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content based on user's social graph with improved distribution
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('🎯 Creating enhanced smart feed mix', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowings: userFollowings.length
  });

  // Get mixing ratios based on follow count
  const { followedRatio, publicRatio } = getContentMixingRatio(followingCount);
  
  // Separate posts into categories for analysis
  const userPosts = allPosts.filter(post => post.user_id === currentUserId);
  const followedPosts = allPosts.filter(post => 
    userFollowings.includes(post.user_id) && post.user_id !== currentUserId
  );
  const ambassadorPosts = allPosts.filter(post => 
    (post.author?.user_type === 'ambassador' || post.is_ambassador_content) &&
    post.user_id !== currentUserId
  );
  const publicPosts = allPosts.filter(post => 
    post.privacy_level === 'public' && 
    post.user_id !== currentUserId && 
    !userFollowings.includes(post.user_id) &&
    !(post.author?.user_type === 'ambassador' || post.is_ambassador_content)
  );

  console.log('📊 Enhanced post categories', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    ambassadorPosts: ambassadorPosts.length,
    publicPosts: publicPosts.length
  });

  // Calculate target counts with improved distribution
  const minPosts = 8; // Increased minimum for better variety
  const maxPosts = 25; // Reasonable maximum
  const totalAvailable = allPosts.length;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, totalAvailable));
  
  // Enhanced ratio calculation based on network size
  let adjustedFollowedRatio = followedRatio;
  let adjustedPublicRatio = publicRatio;
  
  // If user follows many people, increase their content ratio
  if (followingCount > 10) {
    adjustedFollowedRatio = Math.min(0.8, followedRatio + 0.2);
    adjustedPublicRatio = 1 - adjustedFollowedRatio;
  }
  
  // Build categorized feed pools
  const feedPools: Post[] = [];
  
  // Always include user's own recent posts (but limit to avoid domination)
  const userPostLimit = Math.min(3, userPosts.length);
  feedPools.push(...userPosts.slice(0, userPostLimit));
  
  // Add followed users' posts
  const targetFollowed = Math.floor((targetTotal - userPostLimit) * adjustedFollowedRatio);
  feedPools.push(...followedPosts.slice(0, targetFollowed));
  
  // Add ambassador content (mixed from followed and unfollowed)
  const targetAmbassador = Math.min(
    Math.floor(targetTotal * 0.3), // Max 30% ambassador content
    ambassadorPosts.length
  );
  feedPools.push(...ambassadorPosts.slice(0, targetAmbassador));
  
  // Fill remaining with public content
  const remainingSlots = targetTotal - feedPools.length;
  if (remainingSlots > 0) {
    feedPools.push(...publicPosts.slice(0, remainingSlots));
  }

  // Apply fair distribution algorithm
  const distributedFeed = FeedDistributionService.distributePostsFairly(
    feedPools,
    userFollowings,
    currentUserId,
    targetTotal
  );

  // Analyze diversity for logging
  const diversity = FeedDistributionService.analyzeFeedDiversity(distributedFeed, userFollowings);
  
  console.log('✅ Enhanced smart feed mix completed', {
    finalCount: distributedFeed.length,
    targetTotal,
    ratios: { followedRatio: adjustedFollowedRatio, publicRatio: adjustedPublicRatio },
    diversity,
    actual: {
      user: userPostLimit,
      followed: targetFollowed,
      ambassador: targetAmbassador,
      public: remainingSlots
    }
  });
  
  return distributedFeed;
}

/**
 * Enhanced minimum content ensuring with better fallback strategies
 */
export function ensureMinimumContent(
  posts: Post[],
  allAvailablePosts: Post[],
  currentUserId?: string
): Post[] {
  const minPosts = 5; // Increased minimum
  
  if (posts.length >= minPosts) {
    return posts;
  }
  
  console.log('🔄 Applying enhanced fallback content strategy', {
    currentPosts: posts.length,
    availablePosts: allAvailablePosts.length,
    needed: minPosts - posts.length
  });
  
  const existingIds = new Set(posts.map(p => p.id));
  
  // Enhanced fallback strategy: prioritize engaging content
  const fallbackCandidates = allAvailablePosts
    .filter(post => 
      !existingIds.has(post.id) && 
      post.privacy_level === 'public'
    )
    .sort((a, b) => {
      // Sort by engagement score, then recency
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const neededPosts = minPosts - posts.length;
  const fallbackPosts = fallbackCandidates.slice(0, neededPosts);
  
  const result = [...posts, ...fallbackPosts];
  
  console.log('✅ Enhanced fallback content added', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length,
    diversity: FeedDistributionService.analyzeFeedDiversity(result, [])
  });
  
  return result;
}
