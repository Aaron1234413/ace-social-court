
import { useState, useCallback } from 'react';
import { ContextPromptEngine, PromptSuggestion, ContextData } from '@/services/ContextPromptEngine';
import { useAuth } from '@/components/AuthProvider';

export function useContextPrompts() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);

  const generatePrompts = useCallback(async (context: ContextData) => {
    try {
      setIsLoading(true);
      const engine = ContextPromptEngine.getInstance();
      
      const contextWithUser: ContextData = {
        ...context,
        userType: profile?.user_type || 'player'
      };
      
      const suggestions = await engine.generatePrompts(contextWithUser);
      
      // Filter out coach-only prompts for non-coaches
      const filteredSuggestions = suggestions.filter(prompt => {
        if (prompt.coachOnly && profile?.user_type !== 'coach') {
          return false;
        }
        return true;
      });
      
      setPrompts(filteredSuggestions);
      return filteredSuggestions;
    } catch (error) {
      console.error('Error generating context prompts:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [profile?.user_type]);

  const trackInteraction = useCallback(async (promptId: string, action: 'click' | 'dismiss') => {
    try {
      const engine = ContextPromptEngine.getInstance();
      await engine.trackPromptInteraction(promptId, action);
    } catch (error) {
      console.error('Error tracking prompt interaction:', error);
    }
  }, []);

  return {
    prompts,
    isLoading,
    generatePrompts,
    trackInteraction
  };
}
