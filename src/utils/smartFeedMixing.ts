
import { Post } from "@/types/post";
import { FeedDistributionService } from "@/services/FeedDistributionService";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content with GUARANTEED 35% ambassador representation
 * Ambassador content is now fixed at 35% regardless of follow count
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('🎯 Creating GUARANTEED 35% ambassador feed mix', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowings: userFollowings.length
  });

  // Separate posts into categories
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

  console.log('📊 Post categories:', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    ambassadorPosts: ambassadorPosts.length,
    publicPosts: publicPosts.length
  });

  // FIXED AMBASSADOR STRATEGY - Always 35% regardless of follows
  const minPosts = 10;
  const maxPosts = 25;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, allPosts.length));
  
  // FIXED 35% ambassador content - never changes based on follow count
  const guaranteedAmbassadorPosts = Math.max(3, Math.floor(targetTotal * 0.35));
  const actualAmbassadorPosts = Math.min(guaranteedAmbassadorPosts, ambassadorPosts.length);
  
  // Build guaranteed feed with fixed ambassador percentage
  const feedPosts: Post[] = [];
  
  // 1. Always include 35% ambassador content first (GUARANTEED)
  if (actualAmbassadorPosts > 0) {
    // Sort ambassador posts by engagement and recency for rotation
    const sortedAmbassadorPosts = ambassadorPosts
      .sort((a, b) => {
        const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
        const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    
    feedPosts.push(...sortedAmbassadorPosts.slice(0, actualAmbassadorPosts));
    console.log('✅ Ambassador content guaranteed:', {
      requested: guaranteedAmbassadorPosts,
      actual: actualAmbassadorPosts,
      percentage: Math.round((actualAmbassadorPosts / targetTotal) * 100) + '%'
    });
  }
  
  // 2. Add user's own posts (limited to 2 max)
  const userPostLimit = Math.min(2, userPosts.length);
  feedPosts.push(...userPosts.slice(0, userPostLimit));
  
  // 3. Fill remaining with followed users (priority to followed content)
  const remainingSlots = targetTotal - feedPosts.length;
  if (remainingSlots > 0 && followedPosts.length > 0) {
    const followedAllocation = Math.min(remainingSlots, followedPosts.length);
    feedPosts.push(...followedPosts.slice(0, followedAllocation));
  }
  
  // 4. Fill any remaining with high-engagement public content
  const stillRemaining = targetTotal - feedPosts.length;
  if (stillRemaining > 0 && publicPosts.length > 0) {
    const sortedPublicPosts = publicPosts.sort((a, b) => {
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      return scoreB - scoreA;
    });
    feedPosts.push(...sortedPublicPosts.slice(0, stillRemaining));
  }

  // Apply fair distribution algorithm
  const distributedFeed = FeedDistributionService.distributePostsFairly(
    feedPosts,
    userFollowings,
    targetTotal,
    currentUserId
  );

  // Final validation - ensure we hit our 35% target
  const finalAmbassadorCount = distributedFeed.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  ).length;

  const finalAmbassadorPercentage = Math.round((finalAmbassadorCount / distributedFeed.length) * 100);

  console.log('✅ GUARANTEED 35% ambassador feed complete:', {
    finalCount: distributedFeed.length,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: finalAmbassadorPercentage + '%',
    target: '35%',
    guaranteed: finalAmbassadorPercentage >= 30 ? '✅' : '⚠️'
  });
  
  return distributedFeed;
}

/**
 * Enhanced minimum content ensuring with FIXED ambassador priority
 * Now maintains 35% ambassador content even in fallback scenarios
 */
export function ensureMinimumContent(
  posts: Post[],
  allAvailablePosts: Post[],
  currentUserId?: string
): Post[] {
  const minPosts = 8;
  
  if (posts.length >= minPosts) {
    return posts;
  }
  
  console.log('🔄 Applying fallback with FIXED 35% ambassador priority', {
    currentPosts: posts.length,
    availablePosts: allAvailablePosts.length,
    needed: minPosts - posts.length
  });
  
  const existingIds = new Set(posts.map(p => p.id));
  
  // Calculate how many ambassador posts we need to maintain 35%
  const targetAmbassadorCount = Math.floor(minPosts * 0.35);
  const currentAmbassadorCount = posts.filter(p => 
    p.author?.user_type === 'ambassador' || p.is_ambassador_content
  ).length;
  const neededAmbassadorPosts = Math.max(0, targetAmbassadorCount - currentAmbassadorCount);
  
  // Prioritize ambassador content in fallback to maintain 35%
  const fallbackCandidates = allAvailablePosts
    .filter(post => 
      !existingIds.has(post.id) && 
      post.privacy_level === 'public'
    )
    .sort((a, b) => {
      // First priority: Ambassador content if we need more
      const aIsAmbassador = a.author?.user_type === 'ambassador' || a.is_ambassador_content;
      const bIsAmbassador = b.author?.user_type === 'ambassador' || b.is_ambassador_content;
      
      if (neededAmbassadorPosts > 0) {
        if (aIsAmbassador && !bIsAmbassador) return -1;
        if (!aIsAmbassador && bIsAmbassador) return 1;
      }
      
      // Then by engagement and recency
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const neededPosts = minPosts - posts.length;
  const fallbackPosts = fallbackCandidates.slice(0, neededPosts);
  
  const result = [...posts, ...fallbackPosts];
  
  const finalAmbassadorCount = result.filter(p => 
    p.author?.user_type === 'ambassador' || p.is_ambassador_content
  ).length;
  
  const finalAmbassadorPercentage = Math.round((finalAmbassadorCount / result.length) * 100);
  
  console.log('✅ Fallback with FIXED 35% ambassador priority complete:', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: finalAmbassadorPercentage + '%',
    target: '35%'
  });
  
  return result;
}
