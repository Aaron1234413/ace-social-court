
import { Post } from "@/types/post";

interface FeedAnalytics {
  contentDiversity: {
    totalUsers: number;
    followedUsersRepresented: number;
    unfollowedUsersRepresented: number;
    maxPostsFromUser: number;
    averagePostsPerUser: number;
    userDistribution: Record<string, number>;
  };
  contentTypes: {
    userPosts: number;
    ambassadorPosts: number;
    publicPosts: number;
    fallbackPosts: number;
  };
  performanceMetrics: {
    totalQueryTime: number;
    cascadeLevelsUsed: number;
    cacheHitRate: number;
    filteredOutCount: number;
  };
  qualityMetrics: {
    averageEngagement: number;
    recentContentPercentage: number;
    diversityScore: number;
  };
}

interface FilteredContent {
  reason: string;
  count: number;
  examples: Array<{
    postId: string;
    userId: string;
    content: string;
    filterReason: string;
  }>;
}

export class FeedAnalyticsService {
  private static instance: FeedAnalyticsService;
  private filteredContent: FilteredContent[] = [];
  private performanceData: any[] = [];

  static getInstance(): FeedAnalyticsService {
    if (!this.instance) {
      this.instance = new FeedAnalyticsService();
    }
    return this.instance;
  }

  recordFilteredContent(posts: Post[], reason: string, filterDetails?: any) {
    console.log(`🚫 Content filtered: ${posts.length} posts - Reason: ${reason}`, filterDetails);
    
    const existing = this.filteredContent.find(f => f.reason === reason);
    if (existing) {
      existing.count += posts.length;
      existing.examples.push(...posts.slice(0, 3).map(post => ({
        postId: post.id,
        userId: post.user_id,
        content: post.content.substring(0, 100),
        filterReason: reason
      })));
    } else {
      this.filteredContent.push({
        reason,
        count: posts.length,
        examples: posts.slice(0, 3).map(post => ({
          postId: post.id,
          userId: post.user_id,
          content: post.content.substring(0, 100),
          filterReason: reason
        }))
      });
    }
  }

  recordPerformanceMetric(level: string, metric: any) {
    this.performanceData.push({
      timestamp: Date.now(),
      level,
      ...metric
    });

    // Keep only last 10 performance records
    if (this.performanceData.length > 10) {
      this.performanceData = this.performanceData.slice(-10);
    }
  }

  analyzeFeedQuality(posts: Post[], userFollowings: string[]): FeedAnalytics {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Content diversity analysis
    const userCounts = new Map<string, number>();
    posts.forEach(post => {
      userCounts.set(post.user_id, (userCounts.get(post.user_id) || 0) + 1);
    });

    const followedUsersInFeed = Array.from(userCounts.keys()).filter(userId => 
      userFollowings.includes(userId)
    );

    const contentDiversity = {
      totalUsers: userCounts.size,
      followedUsersRepresented: followedUsersInFeed.length,
      unfollowedUsersRepresented: userCounts.size - followedUsersInFeed.length,
      maxPostsFromUser: Math.max(...Array.from(userCounts.values()), 0),
      averagePostsPerUser: posts.length / Math.max(userCounts.size, 1),
      userDistribution: Object.fromEntries(userCounts)
    };

    // Content types analysis
    const contentTypes = {
      userPosts: posts.filter(p => userFollowings.includes(p.user_id)).length,
      ambassadorPosts: posts.filter(p => p.is_ambassador_content || p.author?.user_type === 'ambassador').length,
      publicPosts: posts.filter(p => p.privacy_level === 'public' && !userFollowings.includes(p.user_id)).length,
      fallbackPosts: posts.filter(p => p.is_fallback_content).length
    };

    // Performance metrics
    const latestPerformance = this.performanceData[this.performanceData.length - 1];
    const performanceMetrics = {
      totalQueryTime: latestPerformance?.totalQueryTime || 0,
      cascadeLevelsUsed: latestPerformance?.cascadeLevels || 0,
      cacheHitRate: latestPerformance?.cacheHitRate || 0,
      filteredOutCount: this.filteredContent.reduce((sum, f) => sum + f.count, 0)
    };

    // Quality metrics
    const recentPosts = posts.filter(p => {
      const postDate = new Date(p.created_at);
      return postDate > oneDayAgo;
    });
    const qualityMetrics = {
      averageEngagement: posts.reduce((sum, p) => sum + (p.engagement_score || 0), 0) / Math.max(posts.length, 1),
      recentContentPercentage: (recentPosts.length / Math.max(posts.length, 1)) * 100,
      diversityScore: this.calculateDiversityScore(contentDiversity, contentTypes)
    };

    return {
      contentDiversity,
      contentTypes,
      performanceMetrics,
      qualityMetrics
    };
  }

  private calculateDiversityScore(diversity: any, types: any): number {
    // Diversity score based on user representation and content type mix
    const userRepresentationScore = Math.min(diversity.followedUsersRepresented / Math.max(diversity.totalUsers, 1), 1) * 40;
    const contentTypeScore = (Object.values(types).filter(count => (count as number) > 0).length / 4) * 30;
    const distributionScore = (1 - (diversity.maxPostsFromUser / Math.max(diversity.totalUsers * 3, 1))) * 30;
    
    return Math.round(userRepresentationScore + contentTypeScore + distributionScore);
  }

  getFilteredContentReport(): FilteredContent[] {
    return this.filteredContent;
  }

  getPerformanceHistory(): any[] {
    return this.performanceData;
  }

  clearAnalytics() {
    this.filteredContent = [];
    this.performanceData = [];
  }
}
