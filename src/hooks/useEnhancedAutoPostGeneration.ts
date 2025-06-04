
import { useState, useCallback } from 'react';
import { EnhancedAutoPostService, EnhancedPostSuggestion } from '@/services/EnhancedAutoPostService';
import { MatchData } from '@/components/logging/match/MatchLogger';

export function useEnhancedAutoPostGeneration() {
  const [suggestions, setSuggestions] = useState<EnhancedPostSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMatchSuggestions = useCallback(async (matchData: MatchData) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const newSuggestions = EnhancedAutoPostService.generateMatchSuggestions(matchData);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Error generating match suggestions:', err);
      setError('Failed to generate suggestions');
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateSessionSuggestions = useCallback(async (sessionData: any) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const newSuggestions = EnhancedAutoPostService.generateSessionSuggestions(sessionData);
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error('Error generating session suggestions:', err);
      setError('Failed to generate suggestions');
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isGenerating,
    error,
    generateMatchSuggestions,
    generateSessionSuggestions,
    clearSuggestions
  };
}
