
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Sparkles, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ContextPromptEngine } from '@/services/ContextPromptEngine';
import { CoachPromptSystem } from '@/services/CoachPromptSystem';
import { Post } from '@/types/post';
import { useAuth } from '@/components/AuthProvider';

interface PostPromptProps {
  post: Post;
  onCommentSubmit?: (comment: string) => void;
  className?: string;
}

export function PostPrompt({ post, onCommentSubmit, className = '' }: PostPromptProps) {
  const { user, profile } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contextEngine = ContextPromptEngine.getInstance();
  const coachSystem = CoachPromptSystem.getInstance();

  // Build context for prompt generation
  const context = ContextPromptEngine.buildContext(post, user?.id, profile?.user_type);
  const authorName = post.author?.full_name?.split(' ')[0] || 'them';

  // Generate appropriate prompt
  const isCoach = profile?.user_type === 'coach';
  const prompt = isCoach 
    ? coachSystem.generateCoachPrompt(post, context, authorName)
    : contextEngine.generatePrompt(post, context, authorName);

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && prompt.placeholder) {
      setComment('');
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim() || !onCommentSubmit) return;
    
    setIsSubmitting(true);
    try {
      await onCommentSubmit(comment.trim());
      setComment('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPromptIcon = () => {
    if (prompt.requiresCoach) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    if (prompt.category === 'structured') {
      return <Sparkles className="h-4 w-4 text-purple-600" />;
    }
    return <MessageSquare className="h-4 w-4 text-blue-600" />;
  };

  const getPromptStyle = () => {
    if (prompt.requiresCoach) {
      return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 text-yellow-800';
    }
    if (prompt.category === 'structured') {
      return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-800';
    }
    if (prompt.category === 'keyword') {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-800';
    }
    return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 text-gray-700';
  };

  const renderUpgradeTooltip = () => {
    if (!prompt.requiresCoach) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help">
              <Crown className="h-3 w-3" />
              <span className="text-xs font-medium">Coach Feature</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium mb-1">Upgrade to Coach</p>
              <p className="text-sm">Unlock advanced analysis tools and professional insights to help players improve.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Prompt Speech Bubble */}
      <div className={`
        relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${getPromptStyle()}
        ${isExpanded ? 'rounded-b-none' : 'hover:shadow-sm'}
      `} onClick={handleExpand}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {getPromptIcon()}
            <span className="text-sm font-medium flex-1">
              {prompt.text}
            </span>
            {prompt.requiresCoach && renderUpgradeTooltip()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-2"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Speech bubble tail */}
        <div className="absolute -bottom-2 left-6 w-4 h-4 rotate-45 bg-inherit border-r border-b border-inherit"></div>
      </div>

      {/* Expanded Comment Input */}
      {isExpanded && (
        <div className={`
          border border-t-0 rounded-b-lg p-4 space-y-3
          ${prompt.requiresCoach 
            ? 'bg-yellow-50 border-yellow-200' 
            : 'bg-white border-gray-200'
          }
        `}>
          {prompt.requiresCoach ? (
            <div className="text-center py-8">
              <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-medium text-yellow-800 mb-2">Coach Features Required</h3>
              <p className="text-sm text-yellow-700 mb-4">
                Upgrade to access professional coaching tools and advanced insights.
              </p>
              <Button variant="outline" className="bg-white hover:bg-yellow-50">
                Upgrade to Coach
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={prompt.placeholder}
                className="min-h-[80px] resize-none border-gray-200 focus:border-gray-300"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {prompt.category === 'structured' && '✨ AI-suggested prompt'}
                  {prompt.category === 'keyword' && '🎯 Context-aware prompt'}
                  {prompt.category === 'fallback' && '💬 General prompt'}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!comment.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
