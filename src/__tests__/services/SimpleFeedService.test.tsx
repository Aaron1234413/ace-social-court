
import { SimpleFeedService } from '@/services/SimpleFeedService';
import { mockSupabase } from '../mocks/supabase';
import { mockPosts } from '../mocks/data/posts';

describe('SimpleFeedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserFeed', () => {
    it('fetches user feed successfully', async () => {
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

      const posts = await SimpleFeedService.getUserFeed('user-1', ['friend-1'], 20);

      expect(posts).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    });

    it('handles empty following list', async () => {
      mockSupabase.from.mockReturnValue({
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

      const posts = await SimpleFeedService.getUserFeed('user-1', [], 20);

      expect(posts).toBeDefined();
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('privacy_level', 'public');
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockRejectedValue(new Error('Database error')),
              }),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getUserFeed('user-1', ['friend-1'], 20);

      expect(posts).toEqual([]);
    });

    it('filters out flagged content', async () => {
      const postsWithFlagged = [
        mockPosts.standard(),
        { ...mockPosts.standard(), is_flagged: true },
        mockPosts.ambassadorContent(),
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: postsWithFlagged,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getUserFeed('user-1', ['friend-1'], 20);

      expect(posts).toHaveLength(2);
      expect(posts.every(p => !p.is_flagged)).toBe(true);
    });

    it('respects limit parameter', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue({
                  data: Array(15).fill(mockPosts.standard()),
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getUserFeed('user-1', ['friend-1'], 10);

      expect(mockSupabase.from().select().in().eq().order().limit).toHaveBeenCalledWith(10);
    });
  });

  describe('getPublicFeed', () => {
    it('fetches public posts successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: [mockPosts.standard()],
                error: null,
              }),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getPublicFeed(20);

      expect(posts).toHaveLength(1);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('privacy_level', 'public');
    });

    it('handles database errors in public feed', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getPublicFeed(20);

      expect(posts).toEqual([]);
    });
  });

  describe('getAmbassadorContent', () => {
    it('fetches ambassador content successfully', async () => {
      mockSupabase.from.mockReturnValue({
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

      const posts = await SimpleFeedService.getAmbassadorContent(10);

      expect(posts).toHaveLength(1);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('is_ambassador_content', true);
    });

    it('handles errors in ambassador content fetch', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockRejectedValue(new Error('Database error')),
            }),
          }),
        }),
      });

      const posts = await SimpleFeedService.getAmbassadorContent(10);

      expect(posts).toEqual([]);
    });
  });
});
