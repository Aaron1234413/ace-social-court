
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
  
  console.log('🎯 [DEBUG] Smart feed mix START', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowingsLength: userFollowings.length,
    currentUserId,
    samplePosts: allPosts.slice(0, 2)
  });

  // Early return if no posts
  if (!allPosts || allPosts.length === 0) {
    console.log('⚠️ [DEBUG] No posts provided to mix - returning empty array');
    return [];
  }

  // Remove duplicates based on post ID
  const uniquePosts = allPosts.filter((post, index, arr) => 
    arr.findIndex(p => p.id === post.id) === index
  );

  console.log('📊 [DEBUG] Post deduplication complete', {
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

  console.log('📊 [DEBUG] Post categorization complete', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    ambassadorPosts: ambassadorPosts.length,
    publicPosts: publicPosts.length,
    totalCategorized: userPosts.length + followedPosts.length + ambassadorPosts.length + publicPosts.length
  });

  // If we have no posts after categorization, return the original posts
  if (userPosts.length + followedPosts.length + ambassadorPosts.length + publicPosts.length === 0) {
    console.log('⚠️ [DEBUG] No posts after categorization, returning original posts');
    return uniquePosts;
  }

  // Increased content strategy - target 50 posts maximum
  const minPosts = 15;
  const maxPosts = 50;
  const targetTotal = Math.max(minPosts, Math.min(maxPosts, uniquePosts.length));
  
  console.log('🎯 [DEBUG] Target calculation', {
    minPosts,
    maxPosts,
    uniquePostsLength: uniquePosts.length,
    targetTotal
  });

  // Ensure we have ambassador content (minimum 20% of feed)
  const minAmbassadorPosts = Math.max(2, Math.floor(targetTotal * 0.2));
  const actualAmbassadorPosts = Math.min(minAmbassadorPosts, ambassadorPosts.length);
  
  console.log('👑 [DEBUG] Ambassador allocation', {
    minAmbassadorPosts,
    availableAmbassadorPosts: ambassadorPosts.length,
    actualAmbassadorPosts
  });

  // Build guaranteed feed
  const feedPosts: Post[] = [];
  
  // 1. Add ambassador content first (guaranteed)
  if (actualAmbassadorPosts > 0) {
    const selectedAmbassadors = ambassadorPosts.slice(0, actualAmbassadorPosts);
    feedPosts.push(...selectedAmbassadors);
    console.log('👑 [DEBUG] Added ambassador posts', {
      count: selectedAmbassadors.length,
      postIds: selectedAmbassadors.map(p => p.id)
    });
  }
  
  // 2. Add user's own posts (limited)
  const userPostLimit = Math.min(3, userPosts.length);
  if (userPostLimit > 0) {
    const selectedUserPosts = userPosts.slice(0, userPostLimit);
    feedPosts.push(...selectedUserPosts);
    console.log('👤 [DEBUG] Added user posts', {
      count: selectedUserPosts.length,
      postIds: selectedUserPosts.map(p => p.id)
    });
  }
  
  // 3. Fill remaining with followed users
  const remainingSlots = targetTotal - feedPosts.length;
  console.log('👥 [DEBUG] Filling with followed users', {
    remainingSlots,
    availableFollowedPosts: followedPosts.length
  });

  if (remainingSlots > 0 && followedPosts.length > 0) {
    const followedAllocation = Math.min(remainingSlots, followedPosts.length);
    const selectedFollowedPosts = followedPosts.slice(0, followedAllocation);
    feedPosts.push(...selectedFollowedPosts);
    console.log('👥 [DEBUG] Added followed user posts', {
      count: selectedFollowedPosts.length,
      postIds: selectedFollowedPosts.map(p => p.id)
    });
  }
  
  // 4. Fill any remaining with public content
  const stillRemaining = targetTotal - feedPosts.length;
  console.log('🌍 [DEBUG] Filling with public posts', {
    stillRemaining,
    availablePublicPosts: publicPosts.length
  });

  if (stillRemaining > 0 && publicPosts.length > 0) {
    const selectedPublicPosts = publicPosts.slice(0, stillRemaining);
    feedPosts.push(...selectedPublicPosts);
    console.log('🌍 [DEBUG] Added public posts', {
      count: selectedPublicPosts.length,
      postIds: selectedPublicPosts.map(p => p.id)
    });
  }

  console.log('📋 [DEBUG] Feed building complete', {
    totalFeedPosts: feedPosts.length,
    breakdown: {
      ambassador: feedPosts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length,
      followed: feedPosts.filter(p => userFollowings.includes(p.user_id) && p.user_id !== currentUserId).length,
      user: feedPosts.filter(p => p.user_id === currentUserId).length,
      public: feedPosts.filter(p => 
        p.privacy_level === 'public' && 
        p.user_id !== currentUserId && 
        !userFollowings.includes(p.user_id) &&
        !(p.author?.user_type === 'ambassador' || p.is_ambassador_content)
      ).length
    }
  });

  // Apply fair distribution algorithm if we have enough posts
  let distributedFeed = feedPosts;
  if (feedPosts.length > 10) {
    try {
      console.log('🔄 [DEBUG] Applying fair distribution algorithm');
      distributedFeed = FeedDistributionService.distributePostsFairly(
        feedPosts,
        userFollowings,
        targetTotal,
        currentUserId
      );
      console.log('✅ [DEBUG] Fair distribution complete', {
        originalCount: feedPosts.length,
        distributedCount: distributedFeed.length
      });
    } catch (error) {
      console.warn('⚠️ [DEBUG] Distribution service failed, using original order:', error);
      distributedFeed = feedPosts;
    }
  } else {
    console.log('ℹ️ [DEBUG] Skipping fair distribution (not enough posts)');
  }

  // Final validation
  const finalAmbassadorCount = distributedFeed.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  ).length;

  console.log('✅ [DEBUG] Smart feed mix COMPLETE', {
    finalCount: distributedFeed.length,
    ambassadorCount: finalAmbassadorCount,
    ambassadorPercentage: distributedFeed.length > 0 ? Math.round((finalAmbassadorCount / distributedFeed.length) * 100) + '%' : '0%',
    guaranteed: finalAmbassadorCount >= 2 ? '✅' : '⚠️',
    finalPostIds: distributedFeed.map(p => p.id)
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
