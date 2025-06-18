
import { ReactionAnalytics } from '@/services/ReactionAnalytics';
import { mockSupabase } from '../mocks/supabase';

describe('ReactionAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackReaction', () => {
    it('tracks reaction successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      await ReactionAnalytics.trackReaction(
        'post-1',
        'user-1',
        'heart',
        'added',
        false
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('reaction_analytics');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        post_id: 'post-1',
        user_id: 'user-1',
        reaction_type: 'heart',
        action: 'added',
        is_ambassador_content: false,
      });
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      });

      // Should not throw
      await ReactionAnalytics.trackReaction(
        'post-1',
        'user-1',
        'heart',
        'added',
        false
      );

      expect(mockSupabase.from().insert).toHaveBeenCalled();
    });
  });

  describe('getPostReactionStats', () => {
    it('returns reaction statistics for post', async () => {
      const mockReactions = [
        { reaction_type: 'heart', action: 'added' },
        { reaction_type: 'heart', action: 'added' },
        { reaction_type: 'fire', action: 'added' },
        { reaction_type: 'heart', action: 'removed' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockReactions,
            error: null,
          }),
        }),
      });

      const stats = await ReactionAnalytics.getPostReactionStats('post-1');

      expect(stats).toEqual({
        totalReactions: 4,
        reactionCounts: {
          heart: 3,
          fire: 1,
        },
        addedCount: 3,
        removedCount: 1,
      });
    });

    it('handles empty reaction data', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const stats = await ReactionAnalytics.getPostReactionStats('post-1');

      expect(stats).toEqual({
        totalReactions: 0,
        reactionCounts: {},
        addedCount: 0,
        removedCount: 0,
      });
    });

    it('handles database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Database error')),
        }),
      });

      const stats = await ReactionAnalytics.getPostReactionStats('post-1');

      expect(stats).toEqual({
        totalReactions: 0,
        reactionCounts: {},
        addedCount: 0,
        removedCount: 0,
      });
    });
  });

  describe('getAmbassadorContentStats', () => {
    it('returns ambassador content reaction statistics', async () => {
      const mockReactions = [
        { reaction_type: 'fire' },
        { reaction_type: 'fire' },
        { reaction_type: 'heart' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: mockReactions,
              error: null,
            }),
          }),
        }),
      });

      const stats = await ReactionAnalytics.getAmbassadorContentStats(7);

      expect(stats).toEqual({
        totalReactions: 3,
        fireReactions: 2,
        averageReactionsPerPost: expect.any(Number),
      });
    });

    it('handles timeframe parameter correctly', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      await ReactionAnalytics.getAmbassadorContentStats(30);

      const expectedDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      expect(mockSupabase.from().select().eq().gte).toHaveBeenCalledWith(
        'created_at',
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });
  });

  describe('getUserReactionHistory', () => {
    it('returns user reaction history', async () => {
      const mockHistory = [
        { post_id: 'post-1', reaction_type: 'heart', action: 'added', created_at: '2024-01-01' },
        { post_id: 'post-2', reaction_type: 'fire', action: 'added', created_at: '2024-01-02' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockHistory,
                error: null,
              }),
            }),
          }),
        }),
      });

      const history = await ReactionAnalytics.getUserReactionHistory('user-1', 7);

      expect(history).toEqual(mockHistory);
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('handles empty history gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const history = await ReactionAnalytics.getUserReactionHistory('user-1', 7);

      expect(history).toEqual([]);
    });
  });
});
