
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Lightbulb, Heart, X } from 'lucide-react';
import { ContextPromptEngine, PromptSuggestion, ContextData } from '@/services/ContextPromptEngine';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

interface ContextPromptsProps {
  context: ContextData;
  onPromptClick?: (prompt: PromptSuggestion) => void;
  className?: string;
}

export function ContextPrompts({ context, onPromptClick, className = '' }: ContextPromptsProps) {
  const { user, profile } = useAuth();
  const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
  const [dismissedPrompts, setDismissedPrompts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const generatePrompts = async () => {
      try {
        if (!mounted) return;
        
        setIsLoading(true);
        setHasError(false);
        
        const engine = ContextPromptEngine.getInstance();
        
        const contextWithUser: ContextData = {
          ...context,
          userType: profile?.user_type || 'player'
        };
        
        const suggestions = await engine.generatePrompts(contextWithUser);
        
        if (!mounted) return;
        
        // Filter out coach-only prompts for non-coaches
        const filteredSuggestions = suggestions.filter(prompt => {
          if (prompt.coachOnly && profile?.user_type !== 'coach') {
            return false;
          }
          return true;
        });
        
        setPrompts(filteredSuggestions);
      } catch (error) {
        if (mounted) {
          console.error('Error generating context prompts:', error);
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to prevent rapid loading states
    const timeoutId = setTimeout(() => {
      generatePrompts();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [context, profile?.user_type]);

  const handlePromptClick = async (prompt: PromptSuggestion) => {
    try {
      // Track click-through for analytics
      const engine = ContextPromptEngine.getInstance();
      await engine.trackPromptInteraction(prompt.id, 'click');
      
      onPromptClick?.(prompt);
      toast.success('Great choice! Share your thoughts.');
    } catch (error) {
      console.error('Error handling prompt click:', error);
    }
  };

  const handlePromptDismiss = async (promptId: string) => {
    try {
      // Track dismissal for analytics
      const engine = ContextPromptEngine.getInstance();
      await engine.trackPromptInteraction(promptId, 'dismiss');
      
      setDismissedPrompts(prev => new Set([...prev, promptId]));
    } catch (error) {
      console.error('Error handling prompt dismiss:', error);
    }
  };

  const getPromptIcon = (category: string) => {
    switch (category) {
      case 'loss_support':
        return <Heart className="h-4 w-4 text-blue-500" />;
      case 'improvement_celebration':
        return <Heart className="h-4 w-4 text-green-500" />;
      case 'coach_specific':
        return <Lightbulb className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPromptBadge = (prompt: PromptSuggestion) => {
    if (prompt.type === 'structured') {
      return <Badge variant="secondary" className="text-xs">Smart</Badge>;
    }
    if (prompt.type === 'keyword_fallback') {
      return <Badge variant="outline" className="text-xs">Contextual</Badge>;
    }
    if (prompt.coachOnly) {
      return <Badge variant="default" className="text-xs bg-purple-500">Coach</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return null; // Gracefully fail without showing error to user
  }

  const visiblePrompts = prompts.filter(prompt => !dismissedPrompts.has(prompt.id));

  if (visiblePrompts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Suggested responses
        </span>
      </div>
      
      <div className="space-y-2">
        {visiblePrompts.slice(0, 2).map((prompt) => (
          <Card key={prompt.id} className="p-3 hover:shadow-sm transition-shadow border border-gray-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                {getPromptIcon(prompt.category)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getPromptBadge(prompt)}
                    {prompt.confidence > 0.8 && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        High confidence
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2 break-words">{prompt.content}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePromptClick(prompt)}
                    className="text-xs h-7"
                  >
                    Use this prompt
                  </Button>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handlePromptDismiss(prompt.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {context.isAmbassadorContent && (
        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Training Data</Badge>
          <span>Ambassador content helps improve suggestions</span>
        </div>
      )}
    </div>
  );
}
