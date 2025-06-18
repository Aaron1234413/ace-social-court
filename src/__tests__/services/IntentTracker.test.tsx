
import { IntentTracker } from '@/services/IntentTracker';
import { EngagementMetrics } from '@/services/EngagementMetrics';

// Mock EngagementMetrics
jest.mock('@/services/EngagementMetrics', () => ({
  EngagementMetrics: {
    trackPrivacyIntent: jest.fn(),
    trackMetric: jest.fn(),
    getUserEngagementStats: jest.fn(),
  },
}));

describe('IntentTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear active intents
    (IntentTracker as any).activeIntents = new Map();
  });

  describe('startPrivacyIntent', () => {
    it('starts tracking privacy intent', () => {
      IntentTracker.startPrivacyIntent('user-1', 'public');

      const activeIntents = (IntentTracker as any).activeIntents;
      expect(activeIntents.has('user-1')).toBe(true);
      expect(activeIntents.get('user-1').initialAction).toBe('public');
      expect(activeIntents.get('user-1').interactions).toBe(1);
    });

    it('overwrites existing intent for same user', () => {
      IntentTracker.startPrivacyIntent('user-1', 'public');
      IntentTracker.startPrivacyIntent('user-1', 'private');

      const activeIntents = (IntentTracker as any).activeIntents;
      expect(activeIntents.get('user-1').initialAction).toBe('private');
    });
  });

  describe('trackPrivacyInteraction', () => {
    it('increments interaction count for existing intent', () => {
      IntentTracker.startPrivacyIntent('user-1', 'public');
      IntentTracker.trackPrivacyInteraction('user-1');

      const activeIntents = (IntentTracker as any).activeIntents;
      expect(activeIntents.get('user-1').interactions).toBe(2);
    });

    it('ignores interaction for non-existing intent', () => {
      IntentTracker.trackPrivacyInteraction('non-existent-user');
      // Should not throw or create new intent
      const activeIntents = (IntentTracker as any).activeIntents;
      expect(activeIntents.has('non-existent-user')).toBe(false);
    });
  });

  describe('completePrivacyIntent', () => {
    it('completes intent and tracks metrics', async () => {
      IntentTracker.startPrivacyIntent('user-1', 'public');
      IntentTracker.trackPrivacyInteraction('user-1');
      
      await IntentTracker.completePrivacyIntent('user-1', 'private');

      expect(EngagementMetrics.trackPrivacyIntent).toHaveBeenCalledWith(
        'user-1',
        'public',
        'private'
      );
      expect(EngagementMetrics.trackMetric).toHaveBeenCalledWith(
        'user-1',
        'privacy_intent',
        expect.objectContaining({
          initial_action: 'public',
          final_action: 'private',
          converted: false,
          hesitation_score: expect.any(Number),
        })
      );

      // Should clean up intent
      const activeIntents = (IntentTracker as any).activeIntents;
      expect(activeIntents.has('user-1')).toBe(false);
    });

    it('handles completion without active intent', async () => {
      await IntentTracker.completePrivacyIntent('user-1', 'private');

      expect(EngagementMetrics.trackPrivacyIntent).not.toHaveBeenCalled();
      expect(EngagementMetrics.trackMetric).not.toHaveBeenCalled();
    });

    it('calculates hesitation score correctly', async () => {
      IntentTracker.startPrivacyIntent('user-1', 'public');
      // Add multiple interactions to increase hesitation
      IntentTracker.trackPrivacyInteraction('user-1');
      IntentTracker.trackPrivacyInteraction('user-1');
      IntentTracker.trackPrivacyInteraction('user-1');

      await IntentTracker.completePrivacyIntent('user-1', 'private');

      expect(EngagementMetrics.trackMetric).toHaveBeenCalledWith(
        'user-1',
        'privacy_intent',
        expect.objectContaining({
          hesitation_score: expect.any(Number),
        })
      );

      const callArgs = (EngagementMetrics.trackMetric as jest.Mock).mock.calls[0][2];
      expect(callArgs.hesitation_score).toBeGreaterThan(0);
    });
  });

  describe('getPrivacyBehaviorAnalytics', () => {
    it('returns privacy analytics successfully', async () => {
      (EngagementMetrics.getUserEngagementStats as jest.Mock).mockResolvedValue({
        privacy_changes: 5,
      });

      const analytics = await IntentTracker.getPrivacyBehaviorAnalytics('user-1');

      expect(analytics).toEqual({
        total_privacy_changes: 5,
        average_hesitation_score: 2.3,
        most_common_flow: 'public → private',
        conversion_rate: 0.78,
      });
    });

    it('handles errors gracefully', async () => {
      (EngagementMetrics.getUserEngagementStats as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const analytics = await IntentTracker.getPrivacyBehaviorAnalytics('user-1');

      expect(analytics).toEqual({
        total_privacy_changes: 0,
        average_hesitation_score: 0,
        most_common_flow: 'unknown',
        conversion_rate: 0,
      });
    });
  });
});
