
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAIPrompts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePrompts = async (pillar: string, context?: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-logging-prompts', {
        body: { pillar, context }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      return data.suggestions || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prompts';
      setError(errorMessage);
      console.error('Error generating AI prompts:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generatePrompts,
    isLoading,
    error
  };
};
