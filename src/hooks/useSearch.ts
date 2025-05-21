
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './use-debounce';

export interface SearchUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  user_type?: string;
  bio?: string | null;
  skill_level?: string | null; // Changed from number to string to match DB schema
  location?: string | null;
}

export interface SearchFilters {
  userType?: string[];
  skillLevel?: string; // Changed from number to string to match DB schema
  sortBy?: 'relevance' | 'distance' | 'rating' | 'newest';
  nearby?: boolean;
}

const PAGE_SIZE = 12;

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    userType: [],
    sortBy: 'relevance',
    nearby: false
  });
  
  const [allResults, setAllResults] = useState<SearchUser[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  // Query to get all users initially and search results when a term is entered
  const { 
    data: results, 
    isLoading, 
    error, 
    refetch
  } = useQuery({
    queryKey: ['user-search', debouncedSearchTerm, filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, bio, skill_level, location_name');
          
        // Apply filters
        if (filters.userType && filters.userType.length > 0) {
          query = query.in('user_type', filters.userType as any);
        }
        
        if (filters.skillLevel) {
          query = query.eq('skill_level', filters.skillLevel);
        }
        
        // If there's a search term, apply the search filters
        if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
          query = query.or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`);
        }
        
        // Sort results
        switch (filters.sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'rating':
            query = query.order('skill_level', { ascending: false });
            break;
          default:
            // Default relevance sorting
            break;
        }
        
        // Limit the results
        query = query.limit(PAGE_SIZE);
          
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data as SearchUser[] || [];
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
  
  // Load more function for infinite scrolling
  const loadMore = async (page: number): Promise<SearchUser[] | null> => {
    setIsLoadingMore(true);
    
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, user_type, bio, skill_level, location_name');
        
      // Apply same filters as initial query
      if (filters.userType && filters.userType.length > 0) {
        query = query.in('user_type', filters.userType as any);
      }
      
      if (filters.skillLevel) {
        query = query.eq('skill_level', filters.skillLevel);
      }
      
      // If there's a search term, apply the search filters
      if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
        query = query.or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`);
      }
      
      // Sort results
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('skill_level', { ascending: false });
          break;
      }
        
      // Paginate the results
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
        
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Append new results to existing ones
      if (data && data.length > 0) {
        const newResults = data as SearchUser[];
        setAllResults(prev => {
          // Filter out duplicates
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
    error
  };
}
