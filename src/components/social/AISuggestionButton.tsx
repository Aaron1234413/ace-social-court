
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, MessageSquare } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ContextPromptEngine } from '@/services/ContextPromptEngine';
import { CoachPromptSystem } from '@/services/CoachPromptSystem';
import { Post } from '@/types/post';
import { useAuth } from '@/components/AuthProvider';

interface AISuggestionButtonProps {
  post: Post;
  onSuggestionSelect: (suggestion: string) => void;
  className?: string;
}

export function AISuggestionButton({ post, onSuggestionSelect, className = '' }: AISuggestionButtonProps) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleSuggestionClick = (suggestionText: string) => {
    onSuggestionSelect(suggestionText);
    setIsOpen(false);
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

  const getButtonStyle = () => {
    if (prompt.requiresCoach) {
      return 'hover:bg-yellow-50 text-yellow-600';
    }
    if (prompt.category === 'structured') {
      return 'hover:bg-purple-50 text-purple-600';
    }
    return 'hover:bg-blue-50 text-blue-600';
  };

  const generateSuggestions = () => {
    const suggestions = [];
    
    // Add the main prompt suggestion
    if (prompt.placeholder) {
      suggestions.push(prompt.placeholder);
    }
    
    // Add some variation suggestions based on category
    if (prompt.category === 'structured') {
      suggestions.push(`Great work, ${authorName}! What was the highlight?`);
      suggestions.push(`Tell us more about this experience!`);
    } else if (prompt.category === 'keyword') {
      suggestions.push(`Keep pushing forward, ${authorName}! 💪`);
      suggestions.push(`We're here to support you!`);
    } else {
      suggestions.push(`Thanks for sharing this update!`);
      suggestions.push(`Keep up the great work! 🎾`);
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  if (prompt.requiresCoach && profile?.user_type !== 'coach') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 ${getButtonStyle()} ${className}`}
            >
              <Crown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium mb-1">Upgrade to Coach</p>
              <p className="text-sm">Unlock advanced analysis tools and professional insights.</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${getButtonStyle()} ${className}`}
        >
          {getPromptIcon()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900 mb-3">
            AI Comment Suggestions
          </div>
          
          {generateSuggestions().map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left p-2 rounded-md hover:bg-gray-50 text-sm border border-gray-200 transition-colors"
            >
              {suggestion}
            </button>
          ))}
          
          <div className="pt-2 border-t text-xs text-gray-500">
            {prompt.category === 'structured' && '✨ AI-suggested prompts'}
            {prompt.category === 'keyword' && '🎯 Context-aware prompts'}
            {prompt.category === 'fallback' && '💬 General prompts'}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
