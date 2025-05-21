
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { SessionFormValues } from '@/components/logging/session/sessionSchema';
import { toast } from 'sonner';

export function useSessionSubmit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sessionMutation = useMutation({
    mutationFn: async (sessionData: SessionFormValues) => {
      if (!user) throw new Error('User not authenticated');
      
      setIsSubmitting(true);
      
      try {
        // Format the data for database
        const sessionRecord = {
          user_id: user.id,
          coach_id: sessionData.coach_id || null,
          session_date: sessionData.session_date.toISOString(),
          focus_areas: sessionData.focus_areas,
          drills: sessionData.drills || [],
          next_steps: sessionData.next_steps || [],
          session_note: sessionData.session_note || null,
          reminder_date: sessionData.reminder_date ? sessionData.reminder_date.toISOString() : null,
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
        
        // Log the session submission in the prompts table for analytics
        await supabase
          .from('log_prompts')
          .insert({
            user_id: user.id,
            prompt_type: 'session_submission',
            action_taken: 'complete'
          });
          
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries that might depend on this data
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
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
