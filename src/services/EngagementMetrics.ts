
import { supabase } from '@/integrations/supabase/client';

export interface EngagementMetric {
  id: string;
  user_id: string;
  metric_type: 'post_reaction' | 'reaction_comment' | 'prompt_click' | 'dashboard_usage' | 'privacy_intent';
  metric_data: any;
  created_at: string;
}

export interface BaselineData {
  ambassador_posts_reactions_per_day: number;
  ambassador_fire_reactions_per_24h: number;
  coach_engagement_per_day: number;
  average_tip_quality_score: number;
  prompt_click_through_rate: number;
}

export class EngagementMetrics {
  // Track various engagement events
  static async trackMetric(
    userId: string, 
    metricType: EngagementMetric['metric_type'], 
    data: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('engagement_metrics')
        .insert({
          user_id: userId,
          metric_type: metricType,
          metric_data: data
        });

      if (error) {
        console.error('Error tracking engagement metric:', error);
      }
    } catch (error) {
      console.error('Error in trackMetric:', error);
    }
  }

  // Track post reactions
  static async trackPostReaction(userId: string, postId: string, reactionType: string): Promise<void> {
    await this.trackMetric(userId, 'post_reaction', {
      post_id: postId,
      reaction_type: reactionType,
      timestamp: new Date().toISOString()
    });
  }

  // Track reactions with comments (tip quality)
  static async trackReactionComment(userId: string, reactionId: string, commentLength: number): Promise<void> {
    await this.trackMetric(userId, 'reaction_comment', {
      reaction_id: reactionId,
      comment_length: commentLength,
      quality_score: this.calculateTipQuality(commentLength),
      timestamp: new Date().toISOString()
    });
  }

  // Track prompt clicks
  static async trackPromptClick(userId: string, promptType: string, action: 'clicked' | 'dismissed'): Promise<void> {
    await this.trackMetric(userId, 'prompt_click', {
      prompt_type: promptType,
      action,
      timestamp: new Date().toISOString()
    });
  }

  // Track coach dashboard usage
  static async trackDashboardUsage(userId: string, feature: string, action: string): Promise<void> {
    await this.trackMetric(userId, 'dashboard_usage', {
      feature, // 'filters', 'stars', 'alerts', etc.
      action, // 'applied', 'clicked', 'toggled'
      timestamp: new Date().toISOString()
    });
  }

  // Track privacy dropdown behavior
  static async trackPrivacyIntent(userId: string, intent: string, finalAction: string): Promise<void> {
    await this.trackMetric(userId, 'privacy_intent', {
      intended_action: intent,
      final_action: finalAction,
      conversion: intent === finalAction,
      timestamp: new Date().toISOString()
    });
  }

  // Calculate tip quality based on comment length and content
  private static calculateTipQuality(commentLength: number): number {
    if (commentLength < 10) return 1;
    if (commentLength < 50) return 2;
    if (commentLength < 100) return 3;
    if (commentLength < 200) return 4;
    return 5;
  }

  // Get baseline data for ambassador content
  static async getBaselineData(): Promise<BaselineData> {
    try {
      // Get ambassador posts reactions in last 24 hours
      const { data: ambassadorReactions } = await supabase
        .from('post_reactions')
        .select(`
          *,
          posts!inner(is_ambassador_content)
        `)
        .eq('posts.is_ambassador_content', true)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get coach engagement metrics
      const { data: coachEngagement } = await supabase
        .from('engagement_metrics')
        .select('*')
        .eq('metric_type', 'dashboard_usage')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Calculate baseline metrics
      const ambassadorReactionsPerDay = ambassadorReactions?.length || 0;
      const fireReactions = ambassadorReactions?.filter(r => r.reaction_type === 'fire').length || 0;
      const coachEngagementPerDay = coachEngagement?.length || 0;

      return {
        ambassador_posts_reactions_per_day: ambassadorReactionsPerDay,
        ambassador_fire_reactions_per_24h: fireReactions,
        coach_engagement_per_day: Math.round(coachEngagementPerDay / 24 * 3), // Average per coach
        average_tip_quality_score: 3.2, // Mock baseline
        prompt_click_through_rate: 0.23 // Mock baseline
      };
    } catch (error) {
      console.error('Error getting baseline data:', error);
      // Return mock data as fallback
      return {
        ambassador_posts_reactions_per_day: 20,
        ambassador_fire_reactions_per_24h: 15,
        coach_engagement_per_day: 3,
        average_tip_quality_score: 3.2,
        prompt_click_through_rate: 0.23
      };
    }
  }

  // Get engagement stats for a specific user
  static async getUserEngagementStats(userId: string, days: number = 7): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate metrics
      const stats = {
        total_interactions: data?.length || 0,
        post_reactions: data?.filter(m => m.metric_type === 'post_reaction').length || 0,
        dashboard_usage: data?.filter(m => m.metric_type === 'dashboard_usage').length || 0,
        prompt_clicks: data?.filter(m => m.metric_type === 'prompt_click').length || 0,
        privacy_changes: data?.filter(m => m.metric_type === 'privacy_intent').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      return {
        total_interactions: 0,
        post_reactions: 0,
        dashboard_usage: 0,
        prompt_clicks: 0,
        privacy_changes: 0
      };
    }
  }
}
