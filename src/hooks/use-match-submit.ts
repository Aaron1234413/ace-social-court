
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { MatchFormValues } from '@/components/logging/match/matchSchema';

export function useMatchSubmit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchMutation = useMutation({
    mutationFn: async (matchData: MatchFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      setIsSubmitting(true);
      
      try {
        // Format the data for database
        const matchRecord = {
          user_id: user.id,
          opponent_id: matchData.opponent_id || null,
          match_date: matchData.match_date.toISOString(),
          surface: matchData.surface || null,
          location: matchData.location || null,
          score: matchData.score || null,
          highlights: matchData.highlights || [],
          serve_rating: matchData.serve_rating,
          return_rating: matchData.return_rating,
          endurance_rating: matchData.endurance_rating,
          reflection_note: matchData.reflection_note || null,
          media_url: matchData.media_url || null,
          media_type: matchData.media_type || null
        };
        
        const { data, error } = await supabase
          .from('matches')
          .insert(matchRecord)
          .select()
          .single();
          
        if (error) {
          console.error('Error storing match data:', error);
          throw error;
        }
        
        // Log the match submission in the prompts table for analytics
        await supabase
          .from('log_prompts')
          .insert({
            user_id: user.id,
            prompt_type: 'match_submission',
            action_taken: 'complete'
          });
          
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries that might depend on this data
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
  });
  
  const submitMatch = async (data: MatchFormValues) => {
    return matchMutation.mutateAsync(data);
  };
  
  return {
    submitMatch,
    isSubmitting
  };
}
