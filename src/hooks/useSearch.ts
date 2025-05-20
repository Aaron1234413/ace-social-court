
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from './use-debounce';

export interface SearchUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['user-search', debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 2) {
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`)
          .limit(10);
          
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (err) {
        console.error('Error searching users:', err);
        throw err;
      }
    },
    enabled: debouncedSearchTerm.length >= 2,
  });
  
  return {
    searchQuery,
    setSearchQuery,
    results: results || [],
    isLoading,
    error
  };
}
