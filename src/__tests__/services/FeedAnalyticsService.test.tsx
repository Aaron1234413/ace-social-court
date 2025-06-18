import { FeedAnalyticsService } from '@/services/FeedAnalyticsService';
import { mockPosts } from '../mocks/data/posts';

describe('FeedAnalyticsService', () => {
  let analyticsService: FeedAnalyticsService;

  beforeEach(() => {
    analyticsService = FeedAnalyticsService.getInstance();
    analyticsService.clearAnalytics();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = FeedAnalyticsService.getInstance();
      const instance2 = FeedAnalyticsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordFilteredContent', () => {
    it('records filtered content with reason', () => {
      const posts = [mockPosts.standard(), mockPosts.ambassadorContent()];
      analyticsService.recordFilteredContent(posts, 'privacy_restricted');

      const report = analyticsService.getFilteredContentReport();
      expect(report).toHaveLength(1);
      expect(report[0].reason).toBe('privacy_restricted');
      expect(report[0].count).toBe(2);
    });

    it('accumulates filtered content for same reason', () => {
      const posts1 = [mockPosts.standard()];
      const posts2 = [mockPosts.ambassadorContent()];
      
      analyticsService.recordFilteredContent(posts1, 'privacy_restricted');
      analyticsService.recordFilteredContent(posts2, 'privacy_restricted');

      const report = analyticsService.getFilteredContentReport();
      expect(report).toHaveLength(1);
      expect(report[0].count).toBe(2);
    });

    it('stores examples of filtered content', () => {
      const posts = [mockPosts.standard()];
      analyticsService.recordFilteredContent(posts, 'privacy_restricted');

      const report = analyticsService.getFilteredContentReport();
      expect(report[0].examples).toHaveLength(1);
      expect(report[0].examples[0]).toHaveProperty('postId');
      expect(report[0].examples[0]).toHaveProperty('userId');
      expect(report[0].examples[0]).toHaveProperty('content');
    });
  });

  describe('recordPerformanceMetric', () => {
    it('records performance metrics', () => {
      analyticsService.recordPerformanceMetric('level1', {
        queryTime: 150,
        cacheHits: 5,
      });

      const history = analyticsService.getPerformanceHistory();
      expect(history).toHaveLength(1);
      expect(history[0].level).toBe('level1');
      expect(history[0].queryTime).toBe(150);
    });

    it('limits performance history to 10 entries', () => {
      // Add 12 performance records
      for (let i = 0; i < 12; i++) {
        analyticsService.recordPerformanceMetric(`level${i}`, {
          queryTime: i * 10,
        });
      }

      const history = analyticsService.getPerformanceHistory();
      expect(history).toHaveLength(10);
      // Should keep the most recent 10
      expect(history[0].level).toBe('level2');
      expect(history[9].level).toBe('level11');
    });
  });

  describe('analyzeFeedQuality', () => {
    it('analyzes feed quality comprehensively', () => {
      const posts = [
        { ...mockPosts.standard(), user_id: 'user-1' },
        { ...mockPosts.standard(), user_id: 'user-1' },
        { ...mockPosts.ambassadorContent(), user_id: 'user-2' },
        { ...mockPosts.standard(), user_id: 'user-3', privacy_level: 'public' as const },
      ];
      const userFollowings = ['user-1', 'user-2'];

      const analysis = analyticsService.analyzeFeedQuality(posts, userFollowings);

      expect(analysis.contentDiversity.totalUsers).toBe(3);
      expect(analysis.contentDiversity.followedUsersRepresented).toBe(2);
      expect(analysis.contentDiversity.unfollowedUsersRepresented).toBe(1);
      expect(analysis.contentDiversity.maxPostsFromUser).toBe(2);

      expect(analysis.contentTypes.userPosts).toBe(3); // Posts from followed users
      expect(analysis.contentTypes.ambassadorPosts).toBe(1);
      expect(analysis.contentTypes.publicPosts).toBe(1);

      expect(analysis.qualityMetrics.diversityScore).toBeGreaterThan(0);
    });

    it('handles empty feed gracefully', () => {
      const analysis = analyticsService.analyzeFeedQuality([], []);

      expect(analysis.contentDiversity.totalUsers).toBe(0);
      expect(analysis.contentTypes.userPosts).toBe(0);
      expect(analysis.qualityMetrics.averageEngagement).toBe(0);
    });

    it('calculates recent content percentage', () => {
      const recentPost = {
        ...mockPosts.standard(),
        created_at: new Date().toISOString(), // Recent
      };
      const oldPost = {
        ...mockPosts.standard(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      };

      const analysis = analyticsService.analyzeFeedQuality(
        [recentPost, oldPost],
        []
      );

      expect(analysis.qualityMetrics.recentContentPercentage).toBe(50);
    });

    it('includes performance metrics from latest data', () => {
      analyticsService.recordPerformanceMetric('level1', {
        totalQueryTime: 250,
        cascadeLevels: 3,
        cacheHitRate: 0.8,
      });

      const analysis = analyticsService.analyzeFeedQuality([], []);

      expect(analysis.performanceMetrics.totalQueryTime).toBe(250);
      expect(analysis.performanceMetrics.cascadeLevelsUsed).toBe(3);
      expect(analysis.performanceMetrics.cacheHitRate).toBe(0.8);
    });
  });

  describe('clearAnalytics', () => {
    it('clears all analytics data', () => {
      analyticsService.recordFilteredContent([mockPosts.standard()], 'test');
      analyticsService.recordPerformanceMetric('level1', { queryTime: 100 });

      analyticsService.clearAnalytics();

      expect(analyticsService.getFilteredContentReport()).toHaveLength(0);
      expect(analyticsService.getPerformanceHistory()).toHaveLength(0);
    });
  });
});
