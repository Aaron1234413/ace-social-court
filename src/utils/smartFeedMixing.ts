
import { Post } from "@/types/post";
import { getContentMixingRatio } from "./privacySanitization";

interface FeedMixingOptions {
  followingCount: number;
  userFollowings: string[];
  currentUserId?: string;
}

/**
 * Creates a smart mix of content based on user's social graph
 */
export function createSmartFeedMix(
  allPosts: Post[], 
  options: FeedMixingOptions
): Post[] {
  const { followingCount, userFollowings, currentUserId } = options;
  
  console.log('Creating smart feed mix', {
    totalPosts: allPosts.length,
    followingCount,
    userFollowings: userFollowings.length
  });

  // Get mixing ratios based on follow count
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

  console.log('Post categories', {
    userPosts: userPosts.length,
    followedPosts: followedPosts.length,
    publicPosts: publicPosts.length
  });

  // Calculate target counts (minimum 5 posts total)
  const minPosts = 5;
  const totalAvailable = userPosts.length + followedPosts.length + publicPosts.length;
  const targetTotal = Math.max(minPosts, Math.min(20, totalAvailable));
  
  const targetFollowed = Math.floor(targetTotal * followedRatio);
  const targetPublic = Math.floor(targetTotal * publicRatio);
  
  // Build the mixed feed
  const mixedFeed: Post[] = [];
  
  // Always include user's own posts first
  mixedFeed.push(...userPosts);
  
  // Add followed users' posts
  const selectedFollowed = followedPosts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, targetFollowed);
  mixedFeed.push(...selectedFollowed);
  
  // Add public discovery posts (prioritize recent and engaging content)
  const selectedPublic = publicPosts
    .sort((a, b) => {
      // Sort by engagement score and recency
      const scoreA = (a.engagement_score || 0) + (a.likes_count || 0) * 2;
      const scoreB = (b.engagement_score || 0) + (b.likes_count || 0) * 2;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, targetPublic);
  mixedFeed.push(...selectedPublic);
  
  // Final sort by creation time
  const finalFeed = mixedFeed
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20); // Limit to 20 posts max
  
  console.log('Smart feed mix completed', {
    finalCount: finalFeed.length,
    ratios: { followedRatio, publicRatio },
    actual: {
      user: userPosts.length,
      followed: selectedFollowed.length,
      public: selectedPublic.length
    }
  });
  
  return finalFeed;
}

/**
 * Ensures minimum content in feed with fallback strategies
 */
export function ensureMinimumContent(
  posts: Post[],
  allAvailablePosts: Post[],
  currentUserId?: string
): Post[] {
  const minPosts = 3;
  
  if (posts.length >= minPosts) {
    return posts;
  }
  
  console.log('Applying fallback content strategy', {
    currentPosts: posts.length,
    availablePosts: allAvailablePosts.length
  });
  
  // Fallback: Add public posts to reach minimum
  const existingIds = new Set(posts.map(p => p.id));
  const fallbackPosts = allAvailablePosts
    .filter(post => 
      !existingIds.has(post.id) && 
      post.privacy_level === 'public'
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, minPosts - posts.length);
  
  const result = [...posts, ...fallbackPosts];
  console.log('Fallback content added', {
    original: posts.length,
    added: fallbackPosts.length,
    final: result.length
  });
  
  return result;
}
