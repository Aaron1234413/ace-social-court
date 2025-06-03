
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRealtimeDashboard } from '@/hooks/use-realtime-dashboard';
import { Session, SessionDrill, SessionNextStep, PhysicalData, MentalData, TechnicalData } from '@/types/logging';
import { FilterState } from './DashboardContent';
import SessionCard from './cards/SessionCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SessionsListProps {
  filters: FilterState;
  isCoach: boolean;
}

export const SessionsList: React.FC<SessionsListProps> = ({ filters, isCoach }) => {
  const { user } = useAuth();
  
  // Set up real-time subscriptions
  useRealtimeDashboard();
  
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['sessions', filters, isCoach],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('sessions')
        .select(`
          *
        `);
      
      // For coaches, show sessions where they are tagged (in coach_ids array or shared_with_coaches)
      // For players, show all their own sessions
      if (isCoach) {
        // Use the new RLS policies - coaches can see sessions they're tagged in
        // The RLS policy will automatically filter based on coach_ids and shared_with_coaches arrays
        query = query.or(`coach_id.eq.${user.id}`);
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
      
      // Get coach information for sessions with coach_ids array
      const sessionsWithCoaches = await Promise.all(
        (data || []).map(async (session) => {
          // Transform drills from Json[] to SessionDrill[]
          const typedDrills: SessionDrill[] = Array.isArray(session.drills) 
            ? session.drills.map((drill: any) => ({
                name: drill.name || 'Unnamed Drill',
                rating: drill.rating,
                notes: drill.notes,
              }))
            : [];

          // Transform next_steps from Json[] to SessionNextStep[]
          const typedNextSteps: SessionNextStep[] = Array.isArray(session.next_steps) 
            ? session.next_steps.map((step: any) => ({
                description: step.description || 'Unnamed Step',
                completed: step.completed,
              }))
            : [];

          // Ensure focus_areas is an array
          const focusAreas: string[] = Array.isArray(session.focus_areas) 
            ? session.focus_areas 
            : [];

          // Type cast pillar data from Json to proper types with proper type guards
          const physicalData: PhysicalData | undefined = session.physical_data && 
            typeof session.physical_data === 'object' && 
            !Array.isArray(session.physical_data)
            ? session.physical_data as unknown as PhysicalData
            : undefined;
          
          const mentalData: MentalData | undefined = session.mental_data && 
            typeof session.mental_data === 'object' && 
            !Array.isArray(session.mental_data)
            ? session.mental_data as unknown as MentalData
            : undefined;
            
          const technicalData: TechnicalData | undefined = session.technical_data && 
            typeof session.technical_data === 'object' && 
            !Array.isArray(session.technical_data)
            ? session.technical_data as unknown as TechnicalData
            : undefined;

          // Handle multiple coaches - get coach info for all coaches in coach_ids array
          let coaches = [];
          if (session.coach_ids && Array.isArray(session.coach_ids) && session.coach_ids.length > 0) {
            const { data: coachesData } = await supabase
              .from('profiles')
              .select('id, avatar_url, username, full_name')
              .in('id', session.coach_ids);
              
            coaches = coachesData || [];
          } else if (session.coach_id) {
            // Fallback to single coach_id for backward compatibility
            const { data: coachData } = await supabase
              .from('profiles')
              .select('id, avatar_url, username, full_name')
              .eq('id', session.coach_id)
              .single();
              
            if (coachData) {
              coaches = [coachData];
            }
          }

          return {
            ...session,
            drills: typedDrills,
            next_steps: typedNextSteps,
            focus_areas: focusAreas,
            physical_data: physicalData,
            mental_data: mentalData,
            technical_data: technicalData,
            coaches: coaches, // New field for multiple coaches
            coach: coaches[0] || null // Keep backward compatibility
          } as Session & { coaches: any[] };
        })
      );
      
      return sessionsWithCoaches;
    },
    enabled: !!user,
  });
  
  // Filter by search query locally
  const filteredSessions = sessions?.filter(session => {
    if (!filters.searchQuery) return true;
    const searchLower = filters.searchQuery.toLowerCase();
    
    // Search in focus areas, coach names, and notes
    const coachNames = session.coaches?.map(coach => 
      [coach.username, coach.full_name].filter(Boolean).join(' ')
    ).join(' ') || '';
    
    return (
      (session.focus_areas && 
        session.focus_areas.some(area => area.toLowerCase().includes(searchLower))) ||
      coachNames.toLowerCase().includes(searchLower) ||
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
