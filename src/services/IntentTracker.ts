
import { EngagementMetrics } from './EngagementMetrics';

export interface PrivacyIntent {
  userId: string;
  initialAction: string;
  finalAction: string;
  timeSpent: number;
  dropdownInteractions: number;
}

export class IntentTracker {
  private static activeIntents = new Map<string, {
    initialAction: string;
    startTime: number;
    interactions: number;
  }>();

  // Track when user starts interacting with privacy dropdown
  static startPrivacyIntent(userId: string, initialAction: string): void {
    this.activeIntents.set(userId, {
      initialAction,
      startTime: Date.now(),
      interactions: 1
    });
  }

  // Track each interaction with privacy dropdown
  static trackPrivacyInteraction(userId: string): void {
    const intent = this.activeIntents.get(userId);
    if (intent) {
      intent.interactions += 1;
    }
  }

  // Track final privacy selection and calculate metrics
  static async completePrivacyIntent(userId: string, finalAction: string): Promise<void> {
    const intent = this.activeIntents.get(userId);
    
    if (intent) {
      const timeSpent = Date.now() - intent.startTime;
      
      // Track the complete intent journey
      await EngagementMetrics.trackPrivacyIntent(
        userId,
        intent.initialAction,
        finalAction
      );

      // Track additional metrics
      await EngagementMetrics.trackMetric(userId, 'privacy_intent', {
        initial_action: intent.initialAction,
        final_action: finalAction,
        time_spent_ms: timeSpent,
        dropdown_interactions: intent.interactions,
        converted: intent.initialAction === finalAction,
        hesitation_score: this.calculateHesitationScore(timeSpent, intent.interactions)
      });

      // Clean up
      this.activeIntents.delete(userId);
    }
  }

  // Calculate hesitation score based on time and interactions
  private static calculateHesitationScore(timeSpent: number, interactions: number): number {
    const timeScore = Math.min(timeSpent / 10000, 5); // 0-5 based on time (up to 10 seconds)
    const interactionScore = Math.min(interactions - 1, 5); // 0-5 based on extra interactions
    return Math.round((timeScore + interactionScore) / 2 * 10) / 10; // Average, rounded to 1 decimal
  }

  // Get privacy behavior analytics
  static async getPrivacyBehaviorAnalytics(userId: string): Promise<{
    total_privacy_changes: number;
    average_hesitation_score: number;
    most_common_flow: string;
    conversion_rate: number;
  }> {
    try {
      const stats = await EngagementMetrics.getUserEngagementStats(userId, 30);
      
      // Mock calculations for demonstration
      return {
        total_privacy_changes: stats.privacy_changes || 0,
        average_hesitation_score: 2.3,
        most_common_flow: 'public → private',
        conversion_rate: 0.78
      };
    } catch (error) {
      console.error('Error getting privacy analytics:', error);
      return {
        total_privacy_changes: 0,
        average_hesitation_score: 0,
        most_common_flow: 'unknown',
        conversion_rate: 0
      };
    }
  }
}
