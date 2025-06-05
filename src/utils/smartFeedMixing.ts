
import { Post } from "@/types/post";
import { FeedDistributionService } from "@/services/FeedDistributionService";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content with better error handling
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('🎯 Creating smart feed mix', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowings: userFollowings.length
  });

  // Early return if no posts
  if (!allPosts || allPosts.length === 0) {
    console.log('⚠️ No posts provided to mix');
    return [];
  }

  // Remove duplicates based on post ID
  const uniquePosts = allPosts.filter((post, index, arr) => 
    arr.findIndex(p => p.id === post.id) === index
  );

  console.log('📊 Post deduplication:', {
    original: allPosts.length,
    unique: uniquePosts.length,
    duplicatesRemoved: allPosts.length - uniquePosts.length
  });

  // Separate posts into categories
  const userPosts = uniquePosts.filter(post => post.user_id === currentUserId);
  const followedPosts = uniquePosts.filter(post => 
    userFollowings.includes(post.user_id) && post.user_id !== currentUserId
  );
  const ambassadorPosts = uniquePosts.filter(post => 
    (post.author?.user_type === 'ambassador' || post.is_ambassador_content) &&
    post.user_id !== currentUserId
  );
  const publicPosts = uniquePosts.filter(post => 
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

  // Increased content strategy - target 50 posts maximum
  const minPosts = 15;
  const maxPosts = 50;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, uniquePosts.length));
  
  // Ensure we have ambassador content (minimum 20% of feed)
  const minAmbassadorPosts = Math.max(2, Math.floor(targetTotal * 0.2));
  const actualAmbassadorPosts = Math.min(minAmbassadorPosts, ambassadorPosts.length);
  
  // Build guaranteed feed
  const feedPosts: Post[] = [];
  
  // 1. Add ambassador content first (guaranteed)
  if (actualAmbassadorPosts > 0) {
    feedPosts.push(...ambassadorPosts.slice(0, actualAmbassadorPosts));
  }
  
  // 2. Add user's own posts (limited)
  const userPostLimit = Math.min(3, userPosts.length);
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

  // Apply fair distribution algorithm if we have enough posts
  let distributedFeed = feedPosts;
  if (feedPosts.length > 10) {
    try {
      distributedFeed = FeedDistributionService.distributePostsFairly(
        feedPosts,
        userFollowings,
        targetTotal,
        currentUserId
      );
    } catch (error) {
      console.warn('Distribution service failed, using original order:', error);
      distributedFeed = feedPosts;
    }
  }

  // Final validation
  const finalAmbassadorCount = distributedFeed.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  ).length;

  console.log('✅ Smart feed mix complete:', {
    finalCount: distributedFeed.length,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: distributedFeed.length > 0 ? Math.round((finalAmbassadorCount / distributedFeed.length) * 100) + '%' : '0%',
    guaranteed: finalAmbassadorCount >= 2 ? '✅' : '⚠️'
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
  const minPosts = 15;
  
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
    ambassadorPercentage: result.length > 0 ? Math.round((ambassadorCount / result.length) * 100) + '%' : '0%'
  });
  
  return result;
}
