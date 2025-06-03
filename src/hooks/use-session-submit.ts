
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
      
      console.log('🚀 Starting session submission with data:', sessionData);
      setIsSubmitting(true);
      
      try {
        const isCoach = profile?.user_type === 'coach';
        console.log('👤 User type:', isCoach ? 'coach' : 'player');
        
        // Format the data for database - cast pillar data to Json type
        const sessionRecord = {
          user_id: isCoach ? null : user.id,
          coach_id: isCoach ? user.id : (sessionData.coach_id || null),
          // Handle multiple coaches - convert single coach_id to array or use coach_ids
          coach_ids: sessionData.coach_ids && sessionData.coach_ids.length > 0 
            ? sessionData.coach_ids 
            : sessionData.coach_id 
              ? [sessionData.coach_id] 
              : [],
          notify_coaches: sessionData.notify_coaches || false,
          shared_with_coaches: sessionData.shared_with_coaches || [],
          session_date: sessionData.session_date.toISOString(),
          focus_areas: sessionData.focus_areas || [],
          drills: sessionData.drills || [],
          next_steps: sessionData.next_steps || [],
          session_note: sessionData.session_note || null,
          reminder_date: sessionData.reminder_date ? sessionData.reminder_date.toISOString() : null,
          status: 'Logged' as const,
          // Store detailed pillar data in JSONB columns - cast to Json
          physical_data: sessionData.physical_data ? sessionData.physical_data as any : null,
          mental_data: sessionData.mental_data ? sessionData.mental_data as any : null,
          technical_data: sessionData.technical_data ? sessionData.technical_data as any : null,
          ai_suggestions_used: sessionData.ai_suggestions_used || false,
        };
        
        console.log('💾 Prepared session record:', sessionRecord);
        
        const { data, error } = await supabase
          .from('sessions')
          .insert(sessionRecord)
          .select()
          .single();
          
        if (error) {
          console.error('❌ Database error:', error);
          throw new Error(`Failed to save session: ${error.message}`);
        }
        
        console.log('✅ Session saved successfully:', data);
        
        // If coach is creating session for players, add participants
        if (isCoach && sessionData.participants && sessionData.participants.length > 0) {
          console.log('👥 Adding participants:', sessionData.participants);
          
          const participantRecords = sessionData.participants.map(playerId => ({
            session_id: data.id,
            player_id: playerId
          }));
          
          const { error: participantsError } = await supabase
            .from('session_participants')
            .insert(participantRecords);
            
          if (participantsError) {
            console.error('❌ Participants error:', participantsError);
            // Don't throw here, session was saved successfully
          } else {
            console.log('✅ Participants added successfully');
          }
        }
        
        // Note: Notifications will be handled automatically by the database trigger
        // when notify_coaches is true and coach_ids is populated
        if (sessionData.notify_coaches && sessionRecord.coach_ids.length > 0) {
          console.log('🔔 Notifications will be sent to coaches via database trigger:', sessionRecord.coach_ids);
        }
        
        // Log the session submission for analytics (don't fail if this errors)
        try {
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
        } catch (logError) {
          console.warn('⚠️ Analytics logging failed (non-critical):', logError);
        }
          
        return data;
      } catch (error) {
        console.error('💥 Session submission failed:', error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: () => {
      console.log('🎉 Session mutation completed successfully');
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
      console.error('💥 Session submission error:', error);
      toast.error(`Failed to save training session: ${error.message}`);
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
