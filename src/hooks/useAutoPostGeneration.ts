
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
      console.log('❌ No user found, skipping post generation');
      return [];
    }

    try {
      setIsGenerating(true);
      console.log('🚀 Generating post suggestions for session...', {
        userId: user.id,
        sessionDate: sessionData.session_date,
        focusAreas: sessionData.focus_areas?.length || 0,
        drills: sessionData.drills?.length || 0,
        hasNote: !!sessionData.session_note
      });
      
      const autoPostService = AutoPostService.getInstance();
      const newSuggestions = await autoPostService.generatePostSuggestions(sessionData, user.id);
      
      console.log('✅ Post generation completed:', {
        suggestionsCount: newSuggestions.length,
        suggestions: newSuggestions.map(s => ({ id: s.id, confidence: s.confidence }))
      });
      
      setSuggestions(newSuggestions);
      
      if (newSuggestions.length > 0) {
        console.log(`✅ Generated ${newSuggestions.length} post suggestion(s)`);
        toast.success(`Generated ${newSuggestions.length} post suggestion${newSuggestions.length > 1 ? 's' : ''}!`);
      } else {
        console.log('ℹ️ No post suggestions generated - check if templates are available');
        toast.info('No post suggestions available. You can still create a custom post!');
      }
      
      return newSuggestions;
    } catch (error) {
      console.error('❌ Error generating post suggestions:', error);
      toast.error('Failed to generate post suggestions. You can still create a custom post!');
      return [];
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const clearSuggestions = useCallback(() => {
    console.log('🧹 Clearing post suggestions');
    setSuggestions([]);
  }, []);

  const removeSuggestion = useCallback((suggestionId: string) => {
    console.log('🗑️ Removing suggestion:', suggestionId);
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
