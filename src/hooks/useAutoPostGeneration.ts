
import { useState, useCallback } from 'react';
import { AutoPostService, PostSuggestion } from '@/services/AutoPostService';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export function useAutoPostGeneration() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = useCallback(async (sessionData: SessionFormValues) => {
    if (!user) {
      console.log('No user found, skipping post generation');
      return [];
    }

    try {
      setIsGenerating(true);
      console.log('🚀 Generating post suggestions for session...');
      
      const autoPostService = AutoPostService.getInstance();
      const newSuggestions = await autoPostService.generatePostSuggestions(sessionData, user.id);
      
      setSuggestions(newSuggestions);
      
      if (newSuggestions.length > 0) {
        console.log(`✅ Generated ${newSuggestions.length} post suggestion(s)`);
      } else {
        console.log('ℹ️ No post suggestions generated');
      }
      
      return newSuggestions;
    } catch (error) {
      console.error('❌ Error generating post suggestions:', error);
      toast.error('Failed to generate post suggestions');
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const removeSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  return {
    suggestions,
    isGenerating,
    generateSuggestions,
    clearSuggestions,
    removeSuggestion
  };
}
