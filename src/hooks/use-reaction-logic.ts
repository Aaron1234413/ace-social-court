
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
      console.log('Fetching reaction data for post:', post.id);
      
      // Get reaction counts
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id);

      if (error) {
        console.error('Error fetching reactions:', error);
        throw error;
      }

      console.log('Reactions fetched:', reactions);

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

        if (userError) {
          console.error('Error fetching user reactions:', userError);
          throw userError;
        }

        console.log('User reactions fetched:', userReactionData);

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
    if (!userId) {
      toast.error("Please log in to react to posts");
      return;
    }

    console.log('Submitting reaction:', { reactionType, postId: post.id, userId, comment });
    
    setIsLoading(true);
    try {
      const hasReacted = userReactions[reactionType];

      if (hasReacted) {
        console.log('Removing reaction...');
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .eq('reaction_type', reactionType);

        if (error) {
          console.error('Error removing reaction:', error);
          throw error;
        }

        console.log('Reaction removed successfully');
        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        console.log('Adding reaction...');
        // Add reaction
        const reactionData = {
          post_id: post.id,
          user_id: userId,
          reaction_type: reactionType
        };

        // Add optional fields only if they have values
        if (comment) {
          (reactionData as any).comment_content = comment;
          (reactionData as any).has_comment = true;
        }

        console.log('Inserting reaction with data:', reactionData);

        const { error } = await supabase
          .from('post_reactions')
          .insert(reactionData);

        if (error) {
          console.error('Error adding reaction:', error);
          throw error;
        }

        console.log('Reaction added successfully');
        setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));

        // Track successful completion
        try {
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
        } catch (analyticsError) {
          console.warn('Analytics tracking failed:', analyticsError);
          // Don't fail the reaction for analytics errors
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
        try {
          await ReactionAnalytics.trackReactionEvent({
            user_id: userId,
            post_id: post.id,
            reaction_type: reactionType,
            action: 'cancelled',
            is_ambassador_content: post.is_ambassador_content || false
          });
        } catch (analyticsError) {
          console.warn('Analytics error tracking failed:', analyticsError);
        }
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
