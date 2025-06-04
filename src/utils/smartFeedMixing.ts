
import { Post } from "@/types/post";
import { FeedDistributionService } from "@/services/FeedDistributionService";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content with GUARANTEED ambassador representation
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('🎯 Creating ENHANCED smart feed mix with guaranteed ambassador content', {
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

  console.log('📊 ENHANCED post categories:', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    ambassadorPosts: ambassadorPosts.length,
    publicPosts: publicPosts.length
  });

  // GUARANTEED ambassador content - minimum 3 posts, target 40%
  const minPosts = 10;
  const maxPosts = 25;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, allPosts.length));
  
  // Build feed with GUARANTEED ambassador representation
  const feedPools: Post[] = [];
  
  // Always include user's own recent posts (limited)
  const userPostLimit = Math.min(2, userPosts.length);
  feedPools.push(...userPosts.slice(0, userPostLimit));
  
  // GUARANTEE ambassador content - minimum 3 posts, target 40% of final feed
  const minAmbassadorPosts = 3;
  const targetAmbassadorPosts = Math.max(
    minAmbassadorPosts,
    Math.floor(targetTotal * 0.4) // 40% target
  );
  const actualAmbassadorPosts = Math.min(targetAmbassadorPosts, ambassadorPosts.length);
  feedPools.push(...ambassadorPosts.slice(0, actualAmbassadorPosts));
  
  console.log('🌟 GUARANTEED ambassador allocation:', {
    minAmbassadorPosts,
    targetAmbassadorPosts,
    actualAmbassadorPosts,
    ambassadorPercentage: Math.round((actualAmbassadorPosts / targetTotal) * 100) + '%'
  });
  
  // Fill remaining slots with followed users and public content
  const remainingSlots = targetTotal - feedPools.length;
  if (remainingSlots > 0) {
    // Prioritize followed users
    const followedAllocation = Math.min(
      Math.floor(remainingSlots * 0.7), // 70% of remaining for followed users
      followedPosts.length
    );
    feedPools.push(...followedPosts.slice(0, followedAllocation));
    
    // Fill any remaining with public content
    const stillRemaining = targetTotal - feedPools.length;
    if (stillRemaining > 0) {
      feedPools.push(...publicPosts.slice(0, stillRemaining));
    }
  }

  // Apply fair distribution algorithm
  const distributedFeed = FeedDistributionService.distributePostsFairly(
    feedPools,
    userFollowings,
    targetTotal,
    currentUserId
  );

  // Final validation - ensure we have ambassador content
  const finalAmbassadorCount = distributedFeed.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  ).length;

  console.log('✅ ENHANCED smart feed mix with GUARANTEED ambassadors:', {
    finalCount: distributedFeed.length,
    targetTotal,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: Math.round((finalAmbassadorCount / distributedFeed.length) * 100) + '%',
    guaranteed: finalAmbassadorCount >= minAmbassadorPosts ? '✅' : '⚠️',
    breakdown: {
      user: userPostLimit,
      ambassador: finalAmbassadorCount,
      followed: distributedFeed.filter(p => userFollowings.includes(p.user_id)).length,
      public: distributedFeed.filter(p => 
        p.privacy_level === 'public' && 
        !userFollowings.includes(p.user_id) && 
        p.user_id !== currentUserId &&
        !(p.author?.user_type === 'ambassador' || p.is_ambassador_content)
      ).length
    }
  });
  
  return distributedFeed;
}

/**
 * Enhanced minimum content ensuring with ambassador priority
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
  
  console.log('🔄 Applying ENHANCED fallback with ambassador priority', {
    currentPosts: posts.length,
    availablePosts: allAvailablePosts.length,
    needed: minPosts - posts.length
  });
  
  const existingIds = new Set(posts.map(p => p.id));
  
  // Prioritize ambassador content in fallback
  const fallbackCandidates = allAvailablePosts
    .filter(post => 
      !existingIds.has(post.id) && 
      post.privacy_level === 'public'
    )
    .sort((a, b) => {
      // First sort by ambassador status
      const aIsAmbassador = a.author?.user_type === 'ambassador' || a.is_ambassador_content;
      const bIsAmbassador = b.author?.user_type === 'ambassador' || b.is_ambassador_content;
      
      if (aIsAmbassador && !bIsAmbassador) return -1;
      if (!aIsAmbassador && bIsAmbassador) return 1;
      
      // Then by engagement and recency
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const neededPosts = minPosts - posts.length;
  const fallbackPosts = fallbackCandidates.slice(0, neededPosts);
  
  const result = [...posts, ...fallbackPosts];
  
  const ambassadorCount = result.filter(p => 
    p.author?.user_type === 'ambassador' || p.is_ambassador_content
  ).length;
  
  console.log('✅ ENHANCED fallback with ambassador priority complete:', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length,
    ambassadorCount,
    ambassadorPercentage: Math.round((ambassadorCount / result.length) * 100) + '%'
  });
  
  return result;
}
