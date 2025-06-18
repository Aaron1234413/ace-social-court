import { EngagementMetrics } from '@/services/EngagementMetrics';
import { mockSupabase } from '../mocks/supabase';

describe('EngagementMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackMetric', () => {
    it('tracks engagement metric successfully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackMetric('user-1', 'post_reaction', {
        post_id: 'post-1',
        reaction_type: 'heart',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('engagement_metrics');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        metric_type: 'post_reaction',
        metric_data: {
          post_id: 'post-1',
          reaction_type: 'heart',
        },
      });
    });

    it('handles database errors gracefully', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: { message: 'Database error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      // Should not throw
      await EngagementMetrics.trackMetric('user-1', 'post_reaction', {});
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
    });
  });

  describe('trackPostReaction', () => {
    it('tracks post reaction with correct data', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackPostReaction('user-1', 'post-1', 'fire');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        metric_type: 'post_reaction',
        metric_data: {
          post_id: 'post-1',
          reaction_type: 'fire',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('trackReactionComment', () => {
    it('tracks reaction comment with quality score', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackReactionComment('user-1', 'reaction-1', 150);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        metric_type: 'reaction_comment',
        metric_data: {
          reaction_id: 'reaction-1',
          comment_length: 150,
          quality_score: 4, // Should be 4 for 150 characters
          timestamp: expect.any(String),
        },
      });
    });

    it('calculates quality scores correctly', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      // Test different comment lengths
      await EngagementMetrics.trackReactionComment('user-1', 'reaction-1', 5); // Should be score 1
      await EngagementMetrics.trackReactionComment('user-1', 'reaction-2', 30); // Should be score 2
      await EngagementMetrics.trackReactionComment('user-1', 'reaction-3', 75); // Should be score 3
      await EngagementMetrics.trackReactionComment('user-1', 'reaction-4', 150); // Should be score 4
      await EngagementMetrics.trackReactionComment('user-1', 'reaction-5', 250); // Should be score 5

      const calls = (mockQueryBuilder.insert as jest.Mock).mock.calls;
      expect(calls[0][0].metric_data.quality_score).toBe(1);
      expect(calls[1][0].metric_data.quality_score).toBe(2);
      expect(calls[2][0].metric_data.quality_score).toBe(3);
      expect(calls[3][0].metric_data.quality_score).toBe(4);
      expect(calls[4][0].metric_data.quality_score).toBe(5);
    });
  });

  describe('trackPromptClick', () => {
    it('tracks prompt click actions', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackPromptClick('user-1', 'coaching_tip', 'clicked');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        metric_type: 'prompt_click',
        metric_data: {
          prompt_type: 'coaching_tip',
          action: 'clicked',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('trackDashboardUsage', () => {
    it('tracks coach dashboard usage', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackDashboardUsage('coach-1', 'filters', 'applied');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'coach-1',
        metric_type: 'dashboard_usage',
        metric_data: {
          feature: 'filters',
          action: 'applied',
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe('trackPrivacyIntent', () => {
    it('tracks privacy intent with conversion', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackPrivacyIntent('user-1', 'public', 'private');

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        metric_type: 'privacy_intent',
        metric_data: {
          intended_action: 'public',
          final_action: 'private',
          conversion: false, // public !== private
          timestamp: expect.any(String),
        },
      });
    });

    it('tracks conversion correctly when intent matches final action', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      await EngagementMetrics.trackPrivacyIntent('user-1', 'public', 'public');

      const callData = (mockQueryBuilder.insert as jest.Mock).mock.calls[0][0];
      expect(callData.metric_data.conversion).toBe(true);
    });
  });

  describe('getBaselineData', () => {
    it('returns baseline data successfully', async () => {
      // Mock ambassador reactions query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [
                { reaction_type: 'heart' },
                { reaction_type: 'fire' },
                { reaction_type: 'fire' },
              ],
              error: null,
            }),
          }),
        }),
      });

      // Mock coach engagement query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockResolvedValue({
              data: [
                { metric_type: 'dashboard_usage' },
                { metric_type: 'dashboard_usage' },
              ],
              error: null,
            }),
          }),
        }),
      });

      const baseline = await EngagementMetrics.getBaselineData();

      expect(baseline).toEqual({
        ambassador_posts_reactions_per_day: 3,
        ambassador_fire_reactions_per_24h: 2,
        coach_engagement_per_day: 0, // 2 / 24 * 3 = 0.25, rounded down
        average_tip_quality_score: 3.2,
        prompt_click_through_rate: 0.23,
      });
    });

    it('returns fallback data on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const baseline = await EngagementMetrics.getBaselineData();

      expect(baseline).toEqual({
        ambassador_posts_reactions_per_day: 20,
        ambassador_fire_reactions_per_24h: 15,
        coach_engagement_per_day: 3,
        average_tip_quality_score: 3.2,
        prompt_click_through_rate: 0.23,
      });
    });
  });

  describe('getUserEngagementStats', () => {
    it('returns user engagement statistics', async () => {
      const mockMetrics = [
        { metric_type: 'post_reaction' },
        { metric_type: 'post_reaction' },
        { metric_type: 'dashboard_usage' },
        { metric_type: 'prompt_click' },
        { metric_type: 'privacy_intent' },
      ];

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: mockMetrics,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder);

      const stats = await EngagementMetrics.getUserEngagementStats('user-1', 7);

      expect(stats).toEqual({
        total_interactions: 5,
        post_reactions: 2,
        dashboard_usage: 1,
        prompt_clicks: 1,
        privacy_changes: 1,
      });
    });

    it('handles database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const stats = await EngagementMetrics.getUserEngagementStats('user-1');

      expect(stats).toEqual({
        total_interactions: 0,
        post_reactions: 0,
        dashboard_usage: 0,
        prompt_clicks: 0,
        privacy_changes: 0,
      });
    });
  });
});
