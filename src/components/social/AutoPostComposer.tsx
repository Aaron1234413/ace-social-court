
import React, { useState, useEffect } from 'react';
import { PostComposer } from './PostComposer';
import { useAutoPostGeneration } from '@/hooks/useAutoPostGeneration';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, RefreshCw, X } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface AutoPostComposerProps {
  sessionData?: SessionFormValues;
  onSuccess?: () => void;
  className?: string;
}

export function AutoPostComposer({ sessionData, onSuccess, className }: AutoPostComposerProps) {
  const { 
    suggestions, 
    isGenerating, 
    generateSuggestions, 
    clearSuggestions,
    removeSuggestion 
  } = useAutoPostGeneration();
  
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  // Generate suggestions when session data is provided
  useEffect(() => {
    if (sessionData && !suggestions.length && !isGenerating) {
      const hasMinimalData = sessionData.focus_areas?.length || 
                            sessionData.drills?.length || 
                            sessionData.session_note;
      
      if (hasMinimalData) {
        generateSuggestions(sessionData);
      }
    }
  }, [sessionData, suggestions.length, isGenerating, generateSuggestions]);

  const handleRegenerateContent = () => {
    if (sessionData) {
      generateSuggestions(sessionData);
      setCurrentSuggestionIndex(0);
    }
  };

  const handleDismissAll = () => {
    clearSuggestions();
  };

  const handlePostSuccess = () => {
    // Remove the current suggestion after successful post
    if (suggestions[currentSuggestionIndex]) {
      removeSuggestion(suggestions[currentSuggestionIndex].id);
    }
    onSuccess?.();
  };

  const currentSuggestion = suggestions[currentSuggestionIndex];

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loading variant="spinner" />
            <span>Generating post suggestions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show regular composer if no suggestions
  if (!currentSuggestion) {
    return <PostComposer onSuccess={onSuccess} className={className} />;
  }

  return (
    <div className={className}>
      {/* AI Suggestion Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-600">AI Post Suggestion</span>
          {suggestions.length > 1 && (
            <span className="text-xs text-muted-foreground">
              {currentSuggestionIndex + 1} of {suggestions.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {sessionData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerateContent}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="h-8 px-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Post Composer with Suggestion */}
      <PostComposer
        suggestion={currentSuggestion}
        onSuccess={handlePostSuccess}
      />

      {/* Multiple Suggestions Navigation */}
      {suggestions.length > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {suggestions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSuggestionIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSuggestionIndex 
                  ? 'bg-blue-500' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
