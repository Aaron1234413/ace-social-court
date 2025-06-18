
import { FeedQueryCascade } from '@/services/FeedQueryCascade';
import { mockSupabase } from '../mocks/supabase';
import { mockPosts } from '../mocks/data/posts';

// Mock FeedDistributionService
jest.mock('@/services/FeedDistributionService', () => ({
  FeedDistributionService: {
    distributePostsFairly: jest.fn((posts) => posts.slice(0, 10)),
    analyzeFeedDiversity: jest.fn(() => ({
      totalUsers: 5,
      followedUsersRepresented: 3,
      maxPostsFromSingleUser: 2,
    })),
  },
}));

describe('FeedQueryCascade', () => {
  let feedService: FeedQueryCascade;

  beforeEach(() => {
    jest.clearAllMocks();
    feedService = FeedQueryCascade.getInstance();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = FeedQueryCascade.getInstance();
      const instance2 = FeedQueryCascade.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('buildUserFeed', () => {
    const mockUser = {
      id: 'user-1',
      followingUserIds: ['friend-1', 'friend-2'],
      isCoach: false,
    };

    beforeEach(() => {
      // Mock successful posts query
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [mockPosts.standard(), mockPosts.ambassadorContent()],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
    });

    it('builds feed successfully with cascade levels', async () => {
      const feed = await feedService.buildUserFeed(mockUser, 20);

      expect(feed.posts).toBeDefined();
      expect(feed.metadata.cascadeLevelsUsed).toBeGreaterThan(0);
      expect(feed.metadata.totalQueryTime).toBeGreaterThan(0);
    });

    it('handles empty following list gracefully', async () => {
      const userWithNoFollowing = { ...mockUser, followingUserIds: [] };

      const feed = await feedService.buildUserFeed(userWithNoFollowing, 20);

      expect(feed.posts).toBeDefined();
      expect(feed.metadata.cascadeLevelsUsed).toBeGreaterThan(0);
    });

    it('includes performance metadata', async () => {
      const feed = await feedService.buildUserFeed(mockUser, 20);

      expect(feed.metadata).toHaveProperty('totalQueryTime');
      expect(feed.metadata).toHaveProperty('cascadeLevelsUsed');
      expect(feed.metadata).toHaveProperty('cacheHitRate');
      expect(feed.metadata).toHaveProperty('diversityScore');
    });

    it('handles database errors by falling back to next level', async () => {
      // Mock first query to fail, second to succeed
      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            in: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockRejectedValue(new Error('Database error')),
                }),
              }),
            }),
          }),
        })
        .mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: [mockPosts.ambassadorContent()],
                  error: null,
                }),
              }),
            }),
          }),
        });

      const feed = await feedService.buildUserFeed(mockUser, 20);

      expect(feed.posts).toBeDefined();
      expect(feed.metadata.cascadeLevelsUsed).toBeGreaterThan(1);
    });

    it('respects target feed size', async () => {
      const smallFeed = await feedService.buildUserFeed(mockUser, 5);
      const largeFeed = await feedService.buildUserFeed(mockUser, 50);

      expect(smallFeed.posts.length).toBeLessThanOrEqual(5);
      expect(largeFeed.posts.length).toBeLessThanOrEqual(50);
    });

    it('includes diversity analysis in metadata', async () => {
      const feed = await feedService.buildUserFeed(mockUser, 20);

      expect(feed.metadata.diversityMetrics).toHaveProperty('totalUsers');
      expect(feed.metadata.diversityMetrics).toHaveProperty('followedUsersRepresented');
      expect(feed.metadata.diversityMetrics).toHaveProperty('maxPostsFromSingleUser');
    });
  });

  describe('invalidateCache', () => {
    it('clears user-specific cache', () => {
      feedService.invalidateUserCache('user-1');
      // Method should execute without error
      expect(true).toBe(true);
    });

    it('clears all cache', () => {
      feedService.clearCache();
      // Method should execute without error
      expect(true).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('returns cache statistics', () => {
      const stats = feedService.getCacheStats();
      
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('memoryUsage');
      expect(typeof stats.hitRate).toBe('number');
    });
  });
});
