
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Session } from '@/types/logging';
import { FilterState } from './DashboardContent';
import SessionCard from './cards/SessionCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionsListProps {
  filters: FilterState;
  isCoach: boolean;
}

export const SessionsList: React.FC<SessionsListProps> = ({ filters, isCoach }) => {
  const { user } = useAuth();
  
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', filters, isCoach],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('sessions')
        .select(`
          *
        `);
      
      // For coaches, only show sessions where they are tagged
      // For players, show all their own sessions
      if (isCoach) {
        query = query.eq('coach_id', user.id);
      } else {
        query = query.eq('user_id', user.id);
      }
      
      // Apply date filters
      const now = new Date();
      if (filters.dateRange === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('session_date', oneWeekAgo.toISOString());
      } else if (filters.dateRange === 'month') {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte('session_date', oneMonthAgo.toISOString());
      } else if (filters.dateRange === 'year') {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        query = query.gte('session_date', oneYearAgo.toISOString());
      }
      
      // Apply sorting
      if (filters.sortBy === 'newest') {
        query = query.order('session_date', { ascending: false });
      } else {
        query = query.order('session_date', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
      
      // Get coach information in a separate query if needed
      const sessionsWithCoaches = await Promise.all(
        (data || []).map(async (session) => {
          if (session.coach_id) {
            const { data: coachData } = await supabase
              .from('profiles')
              .select('id, avatar_url, username, full_name')
              .eq('id', session.coach_id)
              .single();
              
            return {
              ...session,
              drills: Array.isArray(session.drills) ? session.drills : [],
              next_steps: Array.isArray(session.next_steps) ? session.next_steps : [],
              focus_areas: Array.isArray(session.focus_areas) ? session.focus_areas : [],
              coach: coachData
            };
          }
          return {
            ...session,
            drills: Array.isArray(session.drills) ? session.drills : [],
            next_steps: Array.isArray(session.next_steps) ? session.next_steps : [],
            focus_areas: Array.isArray(session.focus_areas) ? session.focus_areas : []
          };
        })
      );
      
      return sessionsWithCoaches as Session[];
    },
    enabled: !!user,
  });
  
  // Filter by search query locally
  const filteredSessions = sessions?.filter(session => {
    if (!filters.searchQuery) return true;
    const searchLower = filters.searchQuery.toLowerCase();
    
    // Search in focus areas, coach name, and notes
    return (
      (session.focus_areas && 
        session.focus_areas.some(area => area.toLowerCase().includes(searchLower))) ||
      (session.coach?.username && 
        session.coach.username.toLowerCase().includes(searchLower)) ||
      (session.coach?.full_name && 
        session.coach.full_name.toLowerCase().includes(searchLower)) ||
      (session.session_note && 
        session.session_note.toLowerCase().includes(searchLower))
    );
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-4 text-red-500">
        Error loading sessions: {(error as Error).message}
      </div>
    );
  }
  
  if (!filteredSessions?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {filters.searchQuery || filters.dateRange !== 'all' ? 
          "No training sessions found with the current filters." :
          isCoach ? 
            "You haven't been tagged in any training sessions yet." :
            "You haven't logged any training sessions yet."}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredSessions.map(session => (
        <SessionCard key={session.id} session={session} isCoach={isCoach} />
      ))}
    </div>
  );
};
