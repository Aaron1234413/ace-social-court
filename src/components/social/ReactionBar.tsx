import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Flame, Lightbulb, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Post } from '@/types/post';
import { TipCommentModal } from './TipCommentModal';
import { ReactionPermissionService } from '@/services/ReactionPermissionService';
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

interface ReactionBarProps {
  post: Post;
  className?: string;
}

export function ReactionBar({ post, className = '' }: ReactionBarProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState<ReactionCounts>({ heart: 0, fire: 0, tip: 0, trophy: 0 });
  const [userReactions, setUserReactions] = useState<UserReactions>({ heart: false, fire: false, tip: false, trophy: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);

  const permission = ReactionPermissionService.canReactToPost(post, user?.id);

  // Fetch reaction counts and user reactions
  useEffect(() => {
    fetchReactionData();
  }, [post.id, user?.id]);

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
      if (user) {
        const { data: userReactionData, error: userError } = await supabase
          .from('post_reactions')
          .select('reaction_type')
          .eq('post_id', post.id)
          .eq('user_id', user.id);

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

  const handleReaction = async (reactionType: keyof ReactionCounts) => {
    if (!user) {
      toast.error("Please log in to react to posts");
      return;
    }

    // Track analytics - user clicked
    await ReactionAnalytics.trackReactionEvent({
      user_id: user.id,
      post_id: post.id,
      reaction_type: reactionType,
      action: 'clicked',
      is_ambassador_content: post.is_ambassador_content || false
    });

    // Track engagement metrics
    await EngagementMetrics.trackPostReaction(user.id, post.id, reactionType);

    // Check permissions
    if (!permission.canReact) {
      toast.error(permission.reason || "You cannot react to this post");
      await ReactionAnalytics.trackReactionEvent({
        user_id: user.id,
        post_id: post.id,
        reaction_type: reactionType,
        action: 'cancelled',
        is_ambassador_content: post.is_ambassador_content || false
      });
      return;
    }

    // Special handling for tip reactions
    if (reactionType === 'tip') {
      setShowTipModal(true);
      return;
    }

    await submitReaction(reactionType);
  };

  const submitReaction = async (reactionType: keyof ReactionCounts, comment?: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const hasReacted = userReactions[reactionType];

      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
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
            user_id: user.id,
            reaction_type: reactionType,
            has_comment: !!comment,
            comment_content: comment
          });

        if (error) throw error;

        setCounts(prev => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));

        // Track successful completion
        await ReactionAnalytics.trackReactionEvent({
          user_id: user.id,
          post_id: post.id,
          reaction_type: reactionType,
          action: 'completed',
          is_ambassador_content: post.is_ambassador_content || false
        });

        // Track tip comment quality if applicable
        if (reactionType === 'tip' && comment) {
          await EngagementMetrics.trackReactionComment(user.id, post.id, comment.length);
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
      await ReactionAnalytics.trackReactionEvent({
        user_id: user.id,
        post_id: post.id,
        reaction_type: reactionType,
        action: 'cancelled',
        is_ambassador_content: post.is_ambassador_content || false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTipSubmit = async (comment: string) => {
    setIsSubmittingTip(true);
    await submitReaction('tip', comment);
    setIsSubmittingTip(false);
    setShowTipModal(false);
  };

  const handleTipCancel = async () => {
    if (user) {
      await ReactionAnalytics.trackReactionEvent({
        user_id: user.id,
        post_id: post.id,
        reaction_type: 'tip',
        action: 'cancelled',
        is_ambassador_content: post.is_ambassador_content || false
      });
    }
    setShowTipModal(false);
  };

  const getReactionButton = (
    type: keyof ReactionCounts,
    icon: React.ReactNode,
    label: string
  ) => {
    const isActive = userReactions[type];
    const count = counts[type];
    const canReact = permission.canReact;
    const tooltip = ReactionPermissionService.getReactionTooltip(post, type, canReact, permission.reason);

    return (
      <TooltipProvider key={type}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(type)}
              disabled={isLoading}
              className={`
                flex items-center gap-1 transition-all duration-200 
                ${isActive 
                  ? 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
                  : canReact 
                    ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    : 'text-gray-400 opacity-60'
                }
                ${!canReact ? 'cursor-help' : 'cursor-pointer'}
              `}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className="tabular-nums text-sm">{count}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Show fallback message for completely private posts
  if (!permission.canReact && permission.isRestricted && !post.is_ambassador_content && post.privacy_level === 'private') {
    return (
      <div className={`flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg ${className}`}>
        <span className="text-sm text-gray-600">
          This post is private. {permission.reason}.
        </span>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
          Share
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {getReactionButton('heart', <Heart className="h-4 w-4" />, 'Love')}
        {getReactionButton('fire', <Flame className="h-4 w-4" />, 'Fire')}
        {getReactionButton('tip', <Lightbulb className="h-4 w-4" />, 'Tip')}
        {getReactionButton('trophy', <Trophy className="h-4 w-4" />, 'Achievement')}
      </div>

      <TipCommentModal
        isOpen={showTipModal}
        onClose={handleTipCancel}
        onSubmit={handleTipSubmit}
        isSubmitting={isSubmittingTip}
      />
    </>
  );
}
