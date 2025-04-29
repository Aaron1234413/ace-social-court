
import { Post } from "@/types/post";

// Scoring weights for different factors
const WEIGHTS = {
  FOLLOWING: 2.0,    // Posts from users you follow
  LIKES: 0.5,        // Posts with more likes
  RECENCY: 1.0,      // More recent posts
  COMMENTS: 0.3,     // Posts with more comments
  SAME_USER_TYPE: 0.5 // Posts from users with the same type (coach/player)
};

export interface PersonalizationContext {
  currentUserId?: string;
  userFollowings?: string[];
  userType?: string | null;
}

/**
 * Calculate a personalization score for each post based on various factors
 * Higher score = higher relevance to the user
 */
export const personalizePostFeed = (posts: Post[], context: PersonalizationContext): Post[] => {
  if (!context.currentUserId || posts.length === 0) {
    return posts;
  }
  
  // Calculate a score for each post
  const scoredPosts = posts.map(post => {
    let score = 0;
    
    // Boost posts from users the current user follows
    if (context.userFollowings?.includes(post.user_id)) {
      score += WEIGHTS.FOLLOWING;
    }
    
    // Boost posts from users with the same type (coach/player)
    if (context.userType && post.author?.user_type === context.userType) {
      score += WEIGHTS.SAME_USER_TYPE;
    }
    
    // Boost for recency (posts from the last 24 hours get higher score)
    const postDate = new Date(post.created_at);
    const now = new Date();
    const hoursSincePosted = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
    if (hoursSincePosted < 24) {
      score += WEIGHTS.RECENCY * (1 - hoursSincePosted / 24);
    }
    
    return {
      post,
      score
    };
  });
  
  // Sort by score (higher scores first)
  scoredPosts.sort((a, b) => b.score - a.score);
  
  // Return the sorted posts without the scores
  return scoredPosts.map(item => item.post);
};
