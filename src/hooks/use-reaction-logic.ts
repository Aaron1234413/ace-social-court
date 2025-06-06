
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

    console.log('=== REACTION SUBMISSION DEBUG ===');
    console.log('Post ID:', post.id);
    console.log('User ID:', userId);
    console.log('Reaction Type:', reactionType);
    console.log('Comment:', comment);
    console.log('Current user reactions:', userReactions);
    
    setIsLoading(true);
    try {
      const hasReacted = userReactions[reactionType];
      console.log('Has already reacted:', hasReacted);

      if (hasReacted) {
        console.log('=== REMOVING REACTION ===');
        // Remove reaction
        const { data: deleteData, error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', userId)
          .eq('reaction_type', reactionType)
          .select();

        console.log('Delete operation result:', { data: deleteData, error });

        if (error) {
          console.error('Delete error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          toast.error(`Failed to remove reaction: ${error.message}`);
          throw error;
        }

        console.log('Reaction removed successfully');
        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        console.log('=== ADDING REACTION ===');
        
        // Validate required data
        if (!post.id || !userId || !reactionType) {
          const missingFields = [];
          if (!post.id) missingFields.push('post_id');
          if (!userId) missingFields.push('user_id');
          if (!reactionType) missingFields.push('reaction_type');
          
          console.error('Missing required fields:', missingFields);
          toast.error(`Missing required data: ${missingFields.join(', ')}`);
          return;
        }

        // Build the reaction data object
        const reactionData = {
          post_id: post.id,
          user_id: userId,
          reaction_type: reactionType,
          has_comment: reactionType === 'tip' && comment ? true : false,
          ...(reactionType === 'tip' && comment && { comment_content: comment })
        };

        console.log('=== INSERTING REACTION DATA ===');
        console.log('Reaction data to insert:', JSON.stringify(reactionData, null, 2));

        // First, let's test if we can access the table at all
        const { data: testData, error: testError } = await supabase
          .from('post_reactions')
          .select('id')
          .limit(1);

        console.log('Table access test:', { data: testData, error: testError });

        if (testError) {
          console.error('Cannot access post_reactions table:', testError);
          toast.error(`Database access error: ${testError.message}`);
          throw testError;
        }

        // Now try the actual insert
        const { data: insertData, error: insertError } = await supabase
          .from('post_reactions')
          .insert(reactionData)
          .select();

        console.log('Insert operation result:', { data: insertData, error: insertError });

        if (insertError) {
          console.error('Insert error details:', {
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code
          });
          toast.error(`Failed to add reaction: ${insertError.message}`);
          throw insertError;
        }

        console.log('Reaction added successfully:', insertData);
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
        } else {
          toast.success("Reaction added!");
        }
      }
    } catch (error) {
      console.error('=== REACTION SUBMISSION FAILED ===');
      console.error('Final error:', error);
      
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
