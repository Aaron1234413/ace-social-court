
import { supabase } from '@/integrations/supabase/client';

export interface ReactionAnalyticsEvent {
  user_id: string;
  post_id: string;
  reaction_type: 'heart' | 'fire' | 'tip' | 'trophy';
  action: 'clicked' | 'completed' | 'cancelled';
  is_ambassador_content: boolean;
}

export class ReactionAnalytics {
  static async trackReactionEvent(event: ReactionAnalyticsEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('reaction_analytics')
        .insert({
          user_id: event.user_id,
          post_id: event.post_id,
          reaction_type: event.reaction_type,
          action: event.action,
          is_ambassador_content: event.is_ambassador_content
        });

      if (error) {
        console.error('Error tracking reaction analytics:', error);
      }
    } catch (error) {
      console.error('Error in trackReactionEvent:', error);
    }
  }

  static async getReactionStats(postId: string): Promise<{
    clicks: number;
    completions: number;
    cancellations: number;
    conversionRate: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('reaction_analytics')
        .select('action')
        .eq('post_id', postId);

      if (error) throw error;

      const clicks = data?.filter(r => r.action === 'clicked').length || 0;
      const completions = data?.filter(r => r.action === 'completed').length || 0;
      const cancellations = data?.filter(r => r.action === 'cancelled').length || 0;
      
      const conversionRate = clicks > 0 ? (completions / clicks) * 100 : 0;

      return { clicks, completions, cancellations, conversionRate };
    } catch (error) {
      console.error('Error getting reaction stats:', error);
      return { clicks: 0, completions: 0, cancellations: 0, conversionRate: 0 };
    }
  }
}
