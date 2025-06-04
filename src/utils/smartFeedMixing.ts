
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
  
  console.log('🎯 Creating GUARANTEED smart feed mix', {
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

  // GUARANTEED content strategy
  const minPosts = 10;
  const maxPosts = 25;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, allPosts.length));
  
  // Always ensure we have ambassador content (minimum 30% of feed)
  const minAmbassadorPosts = Math.max(3, Math.floor(targetTotal * 0.3));
  const actualAmbassadorPosts = Math.min(minAmbassadorPosts, ambassadorPosts.length);
  
  // Build guaranteed feed
  const feedPosts: Post[] = [];
  
  // 1. Always include ambassador content first (guaranteed)
  if (actualAmbassadorPosts > 0) {
    feedPosts.push(...ambassadorPosts.slice(0, actualAmbassadorPosts));
  }
  
  // 2. Add user's own posts (limited)
  const userPostLimit = Math.min(2, userPosts.length);
  feedPosts.push(...userPosts.slice(0, userPostLimit));
  
  // 3. Fill remaining with followed users
  const remainingSlots = targetTotal - feedPosts.length;
  if (remainingSlots > 0 && followedPosts.length > 0) {
    const followedAllocation = Math.min(remainingSlots, followedPosts.length);
    feedPosts.push(...followedPosts.slice(0, followedAllocation));
  }
  
  // 4. Fill any remaining with public content
  const stillRemaining = targetTotal - feedPosts.length;
  if (stillRemaining > 0 && publicPosts.length > 0) {
    feedPosts.push(...publicPosts.slice(0, stillRemaining));
  }

  // Apply fair distribution algorithm
  const distributedFeed = FeedDistributionService.distributePostsFairly(
    feedPosts,
    userFollowings,
    targetTotal,
    currentUserId
  );

  // Final validation
  const finalAmbassadorCount = distributedFeed.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  ).length;

  console.log('✅ GUARANTEED smart feed mix complete:', {
    finalCount: distributedFeed.length,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: Math.round((finalAmbassadorCount / distributedFeed.length) * 100) + '%',
    guaranteed: finalAmbassadorCount >= 3 ? '✅' : '⚠️'
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
  
  console.log('🔄 Applying fallback with ambassador priority', {
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
  
  console.log('✅ Fallback with ambassador priority complete:', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length,
    ambassadorCount,
    ambassadorPercentage: Math.round((ambassadorCount / result.length) * 100) + '%'
  });
  
  return result;
}
