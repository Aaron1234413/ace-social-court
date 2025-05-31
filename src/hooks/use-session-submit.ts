
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';
import { toast } from 'sonner';

export function useSessionSubmit() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionMutation = useMutation({
    mutationFn: async (sessionData: SessionFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      setIsSubmitting(true);
      
      try {
        const isCoach = profile?.user_type === 'coach';
        
        // Format the data for database
        const sessionRecord = {
          user_id: isCoach ? null : user.id,
          coach_id: isCoach ? user.id : (sessionData.coach_id || null),
          session_date: sessionData.session_date.toISOString(),
          focus_areas: sessionData.focus_areas,
          drills: sessionData.drills || [],
          next_steps: sessionData.next_steps || [],
          session_note: sessionData.session_note || null,
          reminder_date: sessionData.reminder_date ? sessionData.reminder_date.toISOString() : null,
          status: 'Logged' as const,
          // Store detailed pillar data in new JSONB columns
          physical_data: sessionData.physical_data || null,
          mental_data: sessionData.mental_data || null,
          technical_data: sessionData.technical_data || null,
          ai_suggestions_used: sessionData.ai_suggestions_used || false,
        };
        
        const { data, error } = await supabase
          .from('sessions')
          .insert(sessionRecord)
          .select()
          .single();
          
        if (error) {
          console.error('Error storing session data:', error);
          throw error;
        }
        
        // If coach is creating session for players, add participants
        if (isCoach && sessionData.participants && sessionData.participants.length > 0) {
          const participantRecords = sessionData.participants.map(playerId => ({
            session_id: data.id,
            player_id: playerId
          }));
          
          const { error: participantsError } = await supabase
            .from('session_participants')
            .insert(participantRecords);
            
          if (participantsError) {
            console.error('Error adding session participants:', participantsError);
            throw participantsError;
          }
        }
        
        // Log the session submission in the prompts table for analytics
        await supabase
          .from('log_prompts')
          .insert({
            user_id: user.id,
            prompt_type: 'session_submission',
            action_taken: 'complete'
          });
          
        // Log AI usage if applicable
        if (sessionData.ai_suggestions_used) {
          await supabase
            .from('log_prompts')
            .insert({
              user_id: user.id,
              prompt_type: 'ai_suggestion_usage',
              action_taken: 'used'
            });
        }
          
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      // Invalidate all relevant queries to trigger real-time updates
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-sessions-count'] });
      queryClient.invalidateQueries({ queryKey: ['coach-dashboard-sessions-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-current-streak'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-weekly-progress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-activities'] });
      queryClient.invalidateQueries({ queryKey: ['coach-todays-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['coach-student-activities'] });
      toast.success("Training session logged successfully!");
    },
    onError: (error) => {
      console.error('Session submission error:', error);
      toast.error("Failed to save training session");
    }
  });
  
  const submitSession = async (data: SessionFormValues) => {
    return sessionMutation.mutateAsync(data);
  };
  
  return {
    submitSession,
    isSubmitting
  };
}
