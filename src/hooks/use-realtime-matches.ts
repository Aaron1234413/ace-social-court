
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

export function useRealtimeMatches() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime subscription for matches');

    const channel = supabase
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
          console.log('Match change received:', payload);
          
          // Invalidate relevant queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-matches-count'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-activity-ranking'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-current-streak'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-weekly-progress'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
