
import React from 'react';
import { Heart, Flame, Lightbulb, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { Post } from '@/types/post';
import { TipCommentModal } from './TipCommentModal';
import { ReactionButton } from './ReactionButton';
import { ReactionPermissionService } from '@/services/ReactionPermissionService';
import { useReactionLogic } from '@/hooks/use-reaction-logic';
import { useReactionHandlers } from '@/hooks/use-reaction-handlers';

interface ReactionBarProps {
  post: Post;
  className?: string;
}

export function ReactionBar({ post, className = '' }: ReactionBarProps) {
  const { user } = useAuth();
  const { counts, userReactions, isLoading, submitReaction, isFallbackContent } = useReactionLogic(post, user?.id);
  const {
    permission,
    showTipModal,
    isSubmittingTip,
    handleReaction,
    handleTipSubmit,
    handleTipCancel
  } = useReactionHandlers(post, user?.id, submitReaction);

  const getReactionTooltip = (type: string) => {
    // Check if this is explicitly marked fallback content
    if (isFallbackContent) {
      return "Reactions are only available for real user posts";
    }
    return ReactionPermissionService.getReactionTooltip(
      post, 
      type, 
      permission.canReact, 
      permission.reason
    );
  };

  // For fallback content, show disabled buttons with appropriate styling
  const canReact = permission.canReact && !isFallbackContent;

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
        <ReactionButton
          icon={<Heart className="h-4 w-4" />}
          count={counts.heart}
          isActive={userReactions.heart}
          canReact={canReact}
          tooltip={getReactionTooltip('heart')}
          onClick={() => handleReaction('heart')}
          disabled={isLoading}
        />
        
        <ReactionButton
          icon={<Flame className="h-4 w-4" />}
          count={counts.fire}
          isActive={userReactions.fire}
          canReact={canReact}
          tooltip={getReactionTooltip('fire')}
          onClick={() => handleReaction('fire')}
          disabled={isLoading}
        />
        
        <ReactionButton
          icon={<Lightbulb className="h-4 w-4" />}
          count={counts.tip}
          isActive={userReactions.tip}
          canReact={canReact}
          tooltip={getReactionTooltip('tip')}
          onClick={() => handleReaction('tip')}
          disabled={isLoading}
        />
        
        <ReactionButton
          icon={<Trophy className="h-4 w-4" />}
          count={counts.trophy}
          isActive={userReactions.trophy}
          canReact={canReact}
          tooltip={getReactionTooltip('trophy')}
          onClick={() => handleReaction('trophy')}
          disabled={isLoading}
        />
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
