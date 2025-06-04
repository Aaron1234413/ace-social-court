
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Post } from '@/types/post';
import { ReactionAnalytics } from '@/services/ReactionAnalytics';
import { EngagementMetrics } from '@/services/EngagementMetrics';

interface ReactionCounts {
  heart: number;
  fire: number;
  tip: number;
  trophy: number;
}

interface UserReactions {
  heart: boolean;
  fire: boolean;
  tip: boolean;
  trophy: boolean;
}

export function useReactionLogic(post: Post, userId?: string) {
  const [counts, setCounts] = useState<ReactionCounts>({ heart: 0, fire: 0, tip: 0, trophy: 0 });
  const [userReactions, setUserReactions] = useState<UserReactions>({ heart: false, fire: false, tip: false, trophy: false });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reaction counts and user reactions
  useEffect(() => {
    fetchReactionData();
  }, [post.id, userId]);

  const fetchReactionData = async () => {
    try {
      // Get reaction counts
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id);

      if (error) throw error;

      const newCounts = { heart: 0, fire: 0, tip: 0, trophy: 0 };
      reactions?.forEach(reaction => {
        if (reaction.reaction_type in newCounts) {
          newCounts[reaction.reaction_type as keyof ReactionCounts]++;
        }
      });
      setCounts(newCounts);

      // Get user's reactions if logged in
      if (userId) {
        const { data: userReactionData, error: userError } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', userId);

        if (userError) throw userError;

        const newUserReactions = { heart: false, fire: false, tip: false, trophy: false };
        userReactionData?.forEach(reaction => {
          if (reaction.reaction_type in newUserReactions) {
            newUserReactions[reaction.reaction_type as keyof UserReactions] = true;
          }
        });
        setUserReactions(newUserReactions);
      }
    } catch (error) {
      console.error('Error fetching reaction data:', error);
    }
  };

  const submitReaction = async (reactionType: keyof ReactionCounts, comment?: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const hasReacted = userReactions[reactionType];

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .eq('reaction_type', reactionType);

        if (error) throw error;

        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: userId,
            reaction_type: reactionType,
            has_comment: !!comment,
            comment_content: comment
          });

        if (error) throw error;

        setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));

        // Track successful completion
        await ReactionAnalytics.trackReactionEvent({
          user_id: userId,
          post_id: post.id,
          reaction_type: reactionType,
          action: 'completed',
          is_ambassador_content: post.is_ambassador_content || false
        });

        // Track tip comment quality if applicable
        if (reactionType === 'tip' && comment) {
          await EngagementMetrics.trackReactionComment(userId, post.id, comment.length);
        }

        if (reactionType === 'tip') {
          toast.success("Thanks for your tip! 💡", {
            description: "Your coaching insight helps the community grow."
          });
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error("Failed to update reaction. Please try again.");
      
      // Track error as cancellation
      if (userId) {
        await ReactionAnalytics.trackReactionEvent({
          user_id: userId,
          post_id: post.id,
          reaction_type: reactionType,
          action: 'cancelled',
          is_ambassador_content: post.is_ambassador_content || false
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    counts,
    userReactions,
    isLoading,
    submitReaction,
    fetchReactionData
  };
}
