
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './use-debounce';
import { AIUserSocialService } from '@/services/AIUserSocialService';

export interface EnhancedSearchUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type?: string;
  bio?: string | null;
  skill_level?: string | null;
  location?: string | null;
  location_name?: string | null;
  is_ai_user?: boolean;
  ai_personality_type?: string | null;
  follower_count?: number;
  following_count?: number;
}

export interface EnhancedSearchFilters {
  userType?: string[];
  skillLevel?: string;
  includeAI?: boolean;
  sortBy?: 'relevance' | 'distance' | 'popularity' | 'newest';
  nearby?: boolean;
}

const PAGE_SIZE = 12;

export function useEnhancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EnhancedSearchFilters>({
    userType: [],
    includeAI: true,
    sortBy: 'relevance',
    nearby: false
  });
  
  const [allResults, setAllResults] = useState<EnhancedSearchUser[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  const aiSocialService = AIUserSocialService.getInstance();
  
  // Enhanced query to include AI users and engagement metrics
  const { 
    data: results, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['enhanced-user-search', debouncedSearchTerm, filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            username, 
            avatar_url, 
            user_type, 
            bio, 
            skill_level, 
            location_name,
            is_ai_user,
            ai_personality_type
          `);
          
        // Apply filters
        if (filters.userType && filters.userType.length > 0) {
          query = query.in('user_type', filters.userType as any);
        }
        
        if (filters.skillLevel) {
          query = query.eq('skill_level', filters.skillLevel);
        }

        // Include/exclude AI users based on filter
        if (!filters.includeAI) {
          query = query.eq('is_ai_user', false);
        }
        
        // Apply search term
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
          query = query.or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`);
        }
        
        // Sort results
        switch (filters.sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'popularity':
            // We'll sort by follower count later since we need to fetch it
            break;
          default:
            // Default relevance sorting
            break;
        }
        
        query = query.limit(PAGE_SIZE);
          
        const { data, error } = await query;
        
        if (error) throw error;
        
        let enhancedResults = data as EnhancedSearchUser[] || [];

        // Map location_name to location for backward compatibility
        enhancedResults = enhancedResults.map(user => ({
          ...user,
          location: user.location_name
        }));

        // Get follower/following counts for popularity sorting
        if (filters.sortBy === 'popularity') {
          enhancedResults = await Promise.all(
            enhancedResults.map(async (user) => {
              const [followerCount, followingCount] = await Promise.all([
                supabase.rpc('get_followers_count', { user_id: user.id }),
                supabase.rpc('get_following_count', { user_id: user.id })
              ]);
              
              return {
                ...user,
                follower_count: followerCount.data || 0,
                following_count: followingCount.data || 0
              };
            })
          );

          // Sort by follower count
          enhancedResults.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
        }
        
        return enhancedResults;
      } catch (err) {
        console.error('Error searching users:', err);
        throw err;
      }
    },
  });
  
  // Update all results when initial results change
  useEffect(() => {
    if (results) {
      setAllResults(results);
    }
  }, [results]);

  // Get suggested AI users for discovery
  const getSuggestedAIUsers = async (excludeIds: string[] = []): Promise<EnhancedSearchUser[]> => {
    try {
      const aiUsers = await aiSocialService.getDiscoverableAIUsers(excludeIds);
      return aiUsers.map(user => ({
        ...user,
        location: user.location_name
      }));
    } catch (error) {
      console.error('Error fetching suggested AI users:', error);
      return [];
    }
  };
  
  // Load more function for infinite scrolling
  const loadMore = async (page: number): Promise<EnhancedSearchUser[] | null> => {
    setIsLoadingMore(true);
    
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          username, 
          avatar_url, 
          user_type, 
          bio, 
          skill_level, 
          location_name,
          is_ai_user,
          ai_personality_type
        `);
        
      // Apply same filters as initial query
      if (filters.userType && filters.userType.length > 0) {
        query = query.in('user_type', filters.userType as any);
      }
      
      if (filters.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel);
      }

      if (!filters.includeAI) {
        query = query.eq('is_ai_user', false);
      }
      
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        query = query.or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`);
      }
      
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
      }
        
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
        
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newResults = data.map(user => ({
          ...user,
          location: user.location_name
        })) as EnhancedSearchUser[];
        
        setAllResults(prev => {
          const newIds = new Set(newResults.map(item => item.id));
          const filteredPrev = prev.filter(item => !newIds.has(item.id));
          return [...filteredPrev, ...newResults];
        });
        return newResults;
      }
      
      return [];
    } catch (err) {
      console.error('Error loading more search results:', err);
      return [];
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Reset results when search term or filters change
  useEffect(() => {
    refetch();
  }, [debouncedSearchTerm, filters, refetch]);
  
  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    results: allResults,
    isLoading,
    isLoadingMore,
    loadMore,
    getSuggestedAIUsers,
    error
  };
}
