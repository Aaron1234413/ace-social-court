
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

// Helper function to check if a string is a valid UUID
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function useReactionLogic(post: Post, userId?: string) {
  const [counts, setCounts] = useState<ReactionCounts>({ heart: 0, fire: 0, tip: 0, trophy: 0 });
  const [userReactions, setUserReactions] = useState<UserReactions>({ heart: false, fire: false, tip: false, trophy: false });
  const [isLoading, setIsLoading] = useState(false);

  // Only treat as fallback content if explicitly marked as such
  const isFallbackContent = post.is_fallback_content === true;

  // Fetch reaction counts and user reactions
  useEffect(() => {
    if (!isFallbackContent) {
      fetchReactionData();
    }
  }, [post.id, userId, isFallbackContent]);

  const fetchReactionData = async () => {
    if (isFallbackContent) return;

    try {
      console.log('Fetching reaction data for post:', post.id);
      
      // Get reaction counts
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id);

      if (error) {
        console.error('Error fetching reactions:', error);
        return;
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
      if (userId && isValidUUID(userId)) {
        const { data: userReactionData, error: userError } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', userId);

        if (userError) {
          console.error('Error fetching user reactions:', userError);
          return;
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
    console.log('=== REACTION SUBMISSION START ===');
    console.log('Reaction type:', reactionType);
    console.log('Post ID:', post.id);
    console.log('User ID:', userId);
    console.log('Is fallback content:', isFallbackContent);
    console.log('Post is_fallback_content flag:', post.is_fallback_content);

    // Check if user is logged in
    if (!userId) {
      toast.error("Please log in to react to posts");
      return;
    }

    // Check if this is explicitly marked fallback content
    if (isFallbackContent) {
      console.log('Blocking reaction - fallback content detected');
      toast.error("Cannot react to sample content", {
        description: "Reactions are only available for real user posts"
      });
      return;
    }

    // Validate user ID format
    if (!isValidUUID(userId)) {
      console.error('Invalid user ID format:', userId);
      toast.error("Invalid user session. Please log in again.");
      return;
    }

    // For non-UUID post IDs, skip database operations entirely
    if (!isValidUUID(post.id)) {
      console.log('Non-UUID post ID detected, skipping database operations');
      toast.success("Reaction added! (Demo mode)");
      
      // Update UI optimistically for demo posts
      const hasReacted = userReactions[reactionType];
      if (hasReacted) {
        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));
      }
      return;
    }

    console.log('All validations passed, proceeding with reaction');
    
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
          console.error('Delete error details:', error);
          toast.error(`Failed to remove reaction: ${error.message}`);
          throw error;
        }

        console.log('Reaction removed successfully');
        setCounts(prev => ({ ...prev, [reactionType]: Math.max(0, prev[reactionType] - 1) }));
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        console.log('=== ADDING REACTION ===');
        
        // Build the reaction data object
        const reactionData = {
          post_id: post.id,
          user_id: userId,
          reaction_type: reactionType,
          has_comment: reactionType === 'tip' && comment ? true : false,
          ...(reactionType === 'tip' && comment && { comment_content: comment })
        };

        console.log('Reaction data to insert:', JSON.stringify(reactionData, null, 2));

        // Insert the reaction
        const { data: insertData, error: insertError } = await supabase
          .from('post_reactions')
          .insert(reactionData)
          .select();

        console.log('Insert operation result:', { data: insertData, error: insertError });

        if (insertError) {
          console.error('Insert error details:', insertError);
          toast.error(`Failed to add reaction: ${insertError.message}`);
          throw insertError;
        }

        console.log('Reaction added successfully:', insertData);
        setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));

        // Track successful completion for real posts only
        try {
          if (isValidUUID(userId) && isValidUUID(post.id)) {
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
      
      // Track error as cancellation for real posts only
      if (userId && isValidUUID(userId) && isValidUUID(post.id)) {
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
    fetchReactionData,
    isFallbackContent
  };
}
