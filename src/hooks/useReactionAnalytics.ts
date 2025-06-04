
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReactionAnalytics {
  totalReactions: number;
  reactionsByType: Record<string, number>;
  topReactedPosts: Array<{
    post_id: string;
    total_reactions: number;
    content_preview: string;
  }>;
  ambassadorEngagement: {
    totalAmbassadorReactions: number;
    ambassadorReactionRate: number;
  };
}

export const useReactionAnalytics = (timeframe: 'day' | 'week' | 'month' = 'week') => {
  const [analytics, setAnalytics] = useState<ReactionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const timeframeDays = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      // Get reaction analytics
      const { data: reactionData, error: reactionError } = await supabase
        .from('reaction_analytics')
        .select(`
          reaction_type,
          action,
          is_ambassador_content,
          created_at,
          post_id
        `)
        .gte('created_at', startDate.toISOString())
        .eq('action', 'add');

      if (reactionError) throw reactionError;

      // Process analytics data
      const totalReactions = reactionData?.length || 0;
      const reactionsByType: Record<string, number> = {};
      let ambassadorReactions = 0;

      reactionData?.forEach(reaction => {
        reactionsByType[reaction.reaction_type] = (reactionsByType[reaction.reaction_type] || 0) + 1;
        if (reaction.is_ambassador_content) {
          ambassadorReactions++;
        }
      });

      // Get top reacted posts
      const { data: topPosts } = await supabase
        .rpc('get_top_reacted_posts', { 
          days_back: timeframeDays,
          limit_count: 5 
        });

      const analytics: ReactionAnalytics = {
        totalReactions,
        reactionsByType,
        topReactedPosts: topPosts || [],
        ambassadorEngagement: {
          totalAmbassadorReactions: ambassadorReactions,
          ambassadorReactionRate: totalReactions > 0 ? ambassadorReactions / totalReactions : 0
        }
      };

      setAnalytics(analytics);
    } catch (err) {
      console.error('Error fetching reaction analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    analytics,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
};
