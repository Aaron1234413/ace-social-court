
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export function useRealtimeDashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const isCoach = profile?.user_type === 'coach';

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for sessions
    const sessionsChannel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: isCoach ? `coach_id=eq.${user.id}` : `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Sessions change detected:', payload);
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['sessions'] });
          queryClient.invalidateQueries({ queryKey: ['coach-todays-lessons'] });
          queryClient.invalidateQueries({ queryKey: ['coach-student-activities'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-sessions-count'] });
          queryClient.invalidateQueries({ queryKey: ['coach-dashboard-sessions-count'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-current-streak'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-weekly-progress'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-activities'] });
        }
      )
      .subscribe();

    // Set up real-time subscription for matches
    const matchesChannel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Matches change detected:', payload);
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-matches-count'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-current-streak'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-upcoming-activities'] });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(matchesChannel);
    };
  }, [user?.id, isCoach, queryClient]);
}
