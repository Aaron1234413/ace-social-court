
import { Post } from "@/types/post";

interface UserPostGroup {
  userId: string;
  posts: Post[];
  priority: number;
  isFollowed: boolean;
  isAmbassador: boolean;
}

export class FeedDistributionService {
  private static readonly MAX_POSTS_PER_USER = 3; // Prevent any user from dominating
  private static readonly MIN_POSTS_PER_FOLLOWED_USER = 1; // Ensure representation

  /**
   * Distributes posts ensuring fair representation across all followed users
   */
  static distributePostsFairly(
    posts: Post[], 
    followingUserIds: string[],
    currentUserId?: string,
    targetFeedSize: number = 20
  ): Post[] {
    console.log('🎯 Starting fair post distribution', {
      totalPosts: posts.length,
      followingCount: followingUserIds.length,
      targetSize: targetFeedSize
    });

    // Group posts by user
    const userGroups = this.groupPostsByUser(posts, followingUserIds, currentUserId);
    
    // Calculate distribution strategy
    const distribution = this.calculateDistribution(userGroups, targetFeedSize);
    
    // Apply round-robin distribution
    const distributedPosts = this.applyRoundRobinDistribution(userGroups, distribution);
    
    // Final sort by engagement and recency
    const finalFeed = this.finalSort(distributedPosts, targetFeedSize);
    
    console.log('✅ Fair distribution complete', {
      originalPosts: posts.length,
      finalPosts: finalFeed.length,
      usersRepresented: new Set(finalFeed.map(p => p.user_id)).size
    });

    return finalFeed;
  }

  private static groupPostsByUser(
    posts: Post[], 
    followingUserIds: string[],
    currentUserId?: string
  ): UserPostGroup[] {
    const groups = new Map<string, UserPostGroup>();

    posts.forEach(post => {
      if (!groups.has(post.user_id)) {
        groups.set(post.user_id, {
          userId: post.user_id,
          posts: [],
          priority: this.calculateUserPriority(post.user_id, followingUserIds, currentUserId, post),
          isFollowed: followingUserIds.includes(post.user_id) || post.user_id === currentUserId,
          isAmbassador: post.author?.user_type === 'ambassador' || post.is_ambassador_content || false
        });
      }
      
      groups.get(post.user_id)!.posts.push(post);
    });

    // Sort posts within each group by engagement and recency
    groups.forEach(group => {
      group.posts.sort((a, b) => {
        const scoreA = this.calculatePostScore(a);
        const scoreB = this.calculatePostScore(b);
        return scoreB - scoreA;
      });
    });

    return Array.from(groups.values()).sort((a, b) => b.priority - a.priority);
  }

  private static calculateUserPriority(
    userId: string, 
    followingUserIds: string[], 
    currentUserId?: string,
    samplePost: Post
  ): number {
    let priority = 0;

    // Highest priority: current user's own posts
    if (userId === currentUserId) {
      priority += 100;
    }
    // High priority: users you follow
    else if (followingUserIds.includes(userId)) {
      priority += 50;
    }
    // Medium priority: ambassadors you follow
    else if ((samplePost.author?.user_type === 'ambassador' || samplePost.is_ambassador_content) && 
             followingUserIds.includes(userId)) {
      priority += 70;
    }
    // Lower priority: ambassadors you don't follow
    else if (samplePost.author?.user_type === 'ambassador' || samplePost.is_ambassador_content) {
      priority += 30;
    }
    // Lowest: public posts from unfollowed users
    else {
      priority += 10;
    }

    return priority;
  }

  private static calculatePostScore(post: Post): number {
    let score = 0;

    // Engagement score
    score += (post.engagement_score || 0) * 2;
    score += (post.likes_count || 0) * 1.5;
    score += (post.comments_count || 0) * 2;

    // Recency bonus (posts from last 24 hours get boost)
    const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) {
      score += (24 - hoursOld) / 24 * 10; // Up to 10 point bonus
    }

    return score;
  }

  private static calculateDistribution(
    userGroups: UserPostGroup[], 
    targetFeedSize: number
  ): Map<string, number> {
    const distribution = new Map<string, number>();
    
    // Separate followed users from others
    const followedUsers = userGroups.filter(g => g.isFollowed);
    const otherUsers = userGroups.filter(g => !g.isFollowed);
    
    console.log('📊 Distribution analysis', {
      followedUsers: followedUsers.length,
      otherUsers: otherUsers.length,
      targetSize: targetFeedSize
    });

    // Reserve slots for followed users first
    const followedUserSlots = Math.min(
      targetFeedSize * 0.7, // 70% for followed users
      followedUsers.length * this.MAX_POSTS_PER_USER
    );

    // Distribute slots among followed users
    if (followedUsers.length > 0) {
      const slotsPerFollowedUser = Math.max(
        this.MIN_POSTS_PER_FOLLOWED_USER,
        Math.floor(followedUserSlots / followedUsers.length)
      );

      followedUsers.forEach(user => {
        const allocation = Math.min(
          slotsPerFollowedUser,
          user.posts.length,
          this.MAX_POSTS_PER_USER
        );
        distribution.set(user.userId, allocation);
      });
    }

    // Distribute remaining slots to other users
    const usedSlots = Array.from(distribution.values()).reduce((sum, count) => sum + count, 0);
    const remainingSlots = targetFeedSize - usedSlots;

    if (remainingSlots > 0 && otherUsers.length > 0) {
      const slotsPerOtherUser = Math.floor(remainingSlots / otherUsers.length);
      
      otherUsers.forEach(user => {
        const allocation = Math.min(
          slotsPerOtherUser,
          user.posts.length,
          this.MAX_POSTS_PER_USER
        );
        distribution.set(user.userId, allocation);
      });
    }

    return distribution;
  }

  private static applyRoundRobinDistribution(
    userGroups: UserPostGroup[], 
    distribution: Map<string, number>
  ): Post[] {
    const result: Post[] = [];
    const userQueues = new Map<string, Post[]>();
    
    // Initialize queues for each user
    userGroups.forEach(group => {
      const allocation = distribution.get(group.userId) || 0;
      if (allocation > 0) {
        userQueues.set(group.userId, [...group.posts.slice(0, allocation)]);
      }
    });

    // Round-robin distribution
    let hasMorePosts = true;
    while (hasMorePosts && result.length < 50) { // Safety limit
      hasMorePosts = false;
      
      // Go through each user queue in priority order
      for (const group of userGroups) {
        const queue = userQueues.get(group.userId);
        if (queue && queue.length > 0) {
          const post = queue.shift();
          if (post) {
            result.push(post);
            hasMorePosts = true;
          }
        }
      }
    }

    return result;
  }

  private static finalSort(posts: Post[], targetSize: number): Post[] {
    // Light shuffle to avoid too predictable patterns while preserving some optimization
    const shuffled = [...posts];
    
    // Gentle shuffle: only swap adjacent elements sometimes
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      if (Math.random() > 0.7) { // 30% chance to swap
        [shuffled[i], shuffled[i + 1]] = [shuffled[i + 1], shuffled[i]];
      }
    }

    return shuffled.slice(0, targetSize);
  }

  /**
   * Analyzes the final feed for diversity metrics
   */
  static analyzeFeedDiversity(posts: Post[], followingUserIds: string[]): {
    totalUsers: number;
    followedUsersRepresented: number;
    maxPostsFromSingleUser: number;
    averagePostsPerUser: number;
    userDistribution: Record<string, number>;
  } {
    const userCounts = new Map<string, number>();
    
    posts.forEach(post => {
      userCounts.set(post.user_id, (userCounts.get(post.user_id) || 0) + 1);
    });

    const followedUsersInFeed = Array.from(userCounts.keys()).filter(userId => 
      followingUserIds.includes(userId)
    );

    return {
      totalUsers: userCounts.size,
      followedUsersRepresented: followedUsersInFeed.length,
      maxPostsFromSingleUser: Math.max(...Array.from(userCounts.values())),
      averagePostsPerUser: posts.length / userCounts.size,
      userDistribution: Object.fromEntries(userCounts)
    };
  }
}
