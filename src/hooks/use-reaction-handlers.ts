
import { useState } from 'react';
import { toast } from 'sonner';
import { Post } from '@/types/post';
import { ReactionAnalytics } from '@/services/ReactionAnalytics';
import { EngagementMetrics } from '@/services/EngagementMetrics';
import { ReactionPermissionService } from '@/services/ReactionPermissionService';

type ReactionType = 'heart' | 'fire' | 'tip' | 'trophy';

export function useReactionHandlers(
  post: Post,
  userId?: string,
  submitReaction?: (type: ReactionType, comment?: string) => Promise<void>
) {
  const [showTipModal, setShowTipModal] = useState(false);
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);

  const permission = ReactionPermissionService.canReactToPost(post, userId);

  const handleReaction = async (reactionType: ReactionType) => {
    if (!userId) {
      toast.error("Please log in to react to posts");
      return;
    }

    // Track analytics - user clicked
    await ReactionAnalytics.trackReactionEvent({
      user_id: userId,
      post_id: post.id,
      reaction_type: reactionType,
      action: 'clicked',
      is_ambassador_content: post.is_ambassador_content || false
    });

    // Track engagement metrics
    await EngagementMetrics.trackPostReaction(userId, post.id, reactionType);

    // Check permissions
    if (!permission.canReact) {
      toast.error(permission.reason || "You cannot react to this post");
      await ReactionAnalytics.trackReactionEvent({
        user_id: userId,
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

    if (submitReaction) {
      await submitReaction(reactionType);
    }
  };

  const handleTipSubmit = async (comment: string) => {
    setIsSubmittingTip(true);
    if (submitReaction) {
      await submitReaction('tip', comment);
    }
    setIsSubmittingTip(false);
    setShowTipModal(false);
  };

  const handleTipCancel = async () => {
    if (userId) {
      await ReactionAnalytics.trackReactionEvent({
        user_id: userId,
        post_id: post.id,
        reaction_type: 'tip',
        action: 'cancelled',
        is_ambassador_content: post.is_ambassador_content || false
      });
    }
    setShowTipModal(false);
  };

  return {
    permission,
    showTipModal,
    isSubmittingTip,
    handleReaction,
    handleTipSubmit,
    handleTipCancel
  };
}
