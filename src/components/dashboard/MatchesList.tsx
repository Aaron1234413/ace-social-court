
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Match, MatchHighlight } from '@/types/logging';
import { FilterState } from './DashboardContent';
import MatchCard from './cards/MatchCard';
import { Skeleton } from '@/components/ui/skeleton';

interface MatchesListProps {
  filters: FilterState;
}

export const MatchesList: React.FC<MatchesListProps> = ({ filters }) => {
  const { user } = useAuth();
  
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['matches', filters],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('matches')
        .select(`
          *
        `)
        .eq('user_id', user.id);
      
      // Apply date filters
      const now = new Date();
      if (filters.dateRange === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        query = query.gte('match_date', oneWeekAgo.toISOString());
      } else if (filters.dateRange === 'month') {
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        query = query.gte('match_date', oneMonthAgo.toISOString());
      } else if (filters.dateRange === 'year') {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        query = query.gte('match_date', oneYearAgo.toISOString());
      }
      
      // Apply sorting
      if (filters.sortBy === 'newest') {
        query = query.order('match_date', { ascending: false });
      } else {
        query = query.order('match_date', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      // Get opponent information in a separate query if needed
      const matchesWithOpponents = await Promise.all(
        (data || []).map(async (match) => {
          // Transform the highlights from Json[] to MatchHighlight[]
          const typedHighlights: MatchHighlight[] = Array.isArray(match.highlights) 
            ? match.highlights.map((highlight: any) => ({
                type: highlight.type || 'winner', // Ensure the required 'type' property exists
                note: highlight.note,
                timestamp: highlight.timestamp,
              }))
            : [];

          if (match.opponent_id) {
            const { data: opponentData } = await supabase
              .from('profiles')
              .select('id, avatar_url, username, full_name')
              .eq('id', match.opponent_id)
              .single();
              
            return {
              ...match,
              highlights: typedHighlights,
              opponent: opponentData
            } as Match;
          }
          
          return {
            ...match,
            highlights: typedHighlights
          } as Match;
        })
      );
      
      return matchesWithOpponents;
    },
    enabled: !!user,
  });
  
  // Filter by search query locally
  const filteredMatches = matches?.filter(match => {
    if (!filters.searchQuery) return true;
    const searchLower = filters.searchQuery.toLowerCase();
    
    return (
      (match.location && match.location.toLowerCase().includes(searchLower)) ||
      (match.opponent?.username && match.opponent.username.toLowerCase().includes(searchLower)) ||
      (match.opponent?.full_name && match.opponent.full_name.toLowerCase().includes(searchLower))
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
        Error loading matches: {(error as Error).message}
      </div>
    );
  }
  
  if (!filteredMatches?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        {filters.searchQuery || filters.dateRange !== 'all' ? 
          "No matches found with the current filters." :
          "You haven't logged any matches yet."}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredMatches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
};
