
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Flame, Lightbulb, Trophy, MessageCircle, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ReactionData {
  id: string;
  type: 'love' | 'fire' | 'tip' | 'achievement';
  count: number;
  userReacted: boolean;
  requiresComment?: boolean;
}

interface ReactionBarProps {
  postId: string;
  postUserId: string;
  postContent?: string;
  privacyLevel?: string;
  isAmbassadorContent?: boolean;
  authorUserType?: string;
  className?: string;
}

const REACTION_CONFIG = {
  love: { icon: Heart, label: 'Love', color: 'text-red-500', bgColor: 'bg-red-50' },
  fire: { icon: Flame, label: 'Fire', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  tip: { icon: Lightbulb, label: 'Tip', color: 'text-yellow-500', bgColor: 'bg-yellow-50', requiresComment: true },
  achievement: { icon: Trophy, label: 'Achievement', color: 'text-purple-500', bgColor: 'bg-purple-50' }
};

export function ReactionBar({ 
  postId, 
  postUserId, 
  postContent, 
  privacyLevel,
  isAmbassadorContent = false,
  authorUserType,
  className = '' 
}: ReactionBarProps) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCommentPrompt, setShowCommentPrompt] = useState<string | null>(null);

  // Determine if user can react based on privacy and ambassador status
  const canReactToPost = () => {
    if (!user) return false;
    
    // Always allow reactions on public_highlights and ambassador content
    if (privacyLevel === 'public_highlights' || isAmbassadorContent || authorUserType === 'ambassador') {
      return true;
    }
    
    // For other posts, check if user is the author or following
    return user.id === postUserId || privacyLevel === 'public';
  };

  const getEducationalTooltip = (reactionType: string) => {
    if (canReactToPost()) return null;
    
    if (!user) {
      return "Sign in to react to posts and engage with the community!";
    }
    
    if (isAmbassadorContent || authorUserType === 'ambassador') {
      return "This is ambassador content - everyone can react!";
    }
    
    switch (privacyLevel) {
      case 'private':
        return "Private posts - only the author can see reactions";
      case 'friends':
        return "Follow this player to react to their posts and see their content";
      case 'coaches':
        return "This content is for coaches only";
      default:
        return "Follow this player to react to their posts";
    }
  };

  useEffect(() => {
    fetchReactions();
    
    // Set up real-time subscription for reactions
    const channel = supabase
      .channel(`post_reactions_${postId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'post_reactions',
          filter: `post_id=eq.${postId}`
        }, 
        () => {
          fetchReactions();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId, user]);

  const fetchReactions = async () => {
    try {
      setIsLoading(true);
      
      // Get reaction counts using raw query since TypeScript doesn't know about the new function yet
      const { data: reactionCounts, error: countError } = await supabase
        .rpc('get_post_reaction_counts', { post_id: postId }) as { data: any, error: any };
      
      if (countError) {
        console.error('Error fetching reaction counts:', countError);
      }
      
      // Get user's reactions if logged in - using raw query
      let userReactions: string[] = [];
      if (user) {
        const { data, error } = await supabase
          .from('post_reactions' as any)
          .select('reaction_type')
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching user reactions:', error);
        } else {
          userReactions = data?.map((r: any) => r.reaction_type) || [];
        }
      }
      
      // Format reaction data
      const formattedReactions: ReactionData[] = Object.entries(REACTION_CONFIG).map(([type, config]) => ({
        id: type,
        type: type as ReactionData['type'],
        count: reactionCounts?.[`${type}_count`] || 0,
        userReacted: userReactions.includes(type),
        requiresComment: config.requiresComment
      }));
      
      setReactions(formattedReactions);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast.error("Please sign in to react to posts");
      return;
    }
    
    if (!canReactToPost()) {
      const tooltip = getEducationalTooltip(reactionType);
      toast.info(tooltip || "You cannot react to this post");
      return;
    }
    
    const reaction = reactions.find(r => r.id === reactionType);
    if (!reaction) return;
    
    // Check if tip reaction requires comment
    if (reactionType === 'tip' && !reaction.userReacted) {
      const { data: hasComment } = await supabase
        .from('comments')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .limit(1);
      
      if (!hasComment || hasComment.length === 0) {
        setShowCommentPrompt(reactionType);
        toast.info("Tip reactions require a helpful comment. Share your insight!");
        return;
      }
    }
    
    try {
      if (reaction.userReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions' as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);
        
        if (error) throw error;
        
        // Log analytics
        await supabase.from('reaction_analytics' as any).insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
          action: 'remove',
          is_ambassador_content: isAmbassadorContent
        });
        
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions' as any)
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });
        
        if (error) throw error;
        
        // Log analytics
        await supabase.from('reaction_analytics' as any).insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
          action: 'add',
          is_ambassador_content: isAmbassadorContent
        });
        
        toast.success(`${REACTION_CONFIG[reactionType as keyof typeof REACTION_CONFIG].label} reaction added!`);
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {Object.keys(REACTION_CONFIG).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {reactions.map((reaction) => {
          const config = REACTION_CONFIG[reaction.type];
          const Icon = config.icon;
          const canReact = canReactToPost();
          const tooltip = getEducationalTooltip(reaction.type);
          
          const button = (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(reaction.type)}
              disabled={!canReact}
              className={`flex items-center gap-1 transition-all duration-200 ${
                reaction.userReacted 
                  ? `${config.color} ${config.bgColor} hover:bg-opacity-80` 
                  : canReact 
                    ? 'text-muted-foreground hover:text-foreground' 
                    : 'text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
            >
              <Icon 
                className={`h-4 w-4 ${reaction.userReacted ? 'fill-current' : ''} ${
                  !canReact ? 'opacity-50' : ''
                }`} 
              />
              <span className="tabular-nums">{reaction.count}</span>
              {!canReact && <Lock className="h-3 w-3 ml-1" />}
              {reaction.requiresComment && (
                <MessageCircle className="h-3 w-3 ml-1 opacity-60" />
              )}
            </Button>
          );
          
          if (tooltip && !canReact) {
            return (
              <Tooltip key={reaction.id}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          if (reaction.requiresComment) {
            return (
              <Tooltip key={reaction.id}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    Tip reactions require a helpful comment to share your insight
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return button;
        })}
        
        {isAmbassadorContent && (
          <Badge variant="secondary" className="text-xs ml-2">
            Ambassador Content
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
