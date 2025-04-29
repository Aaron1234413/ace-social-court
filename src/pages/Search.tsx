
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/hooks/use-debounce';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import UserSearchResults from '@/components/search/UserSearchResults';

type UserType = 'all' | 'player' | 'coach';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userType, setUserType] = useState<UserType>('all');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['user-search', debouncedSearch, userType],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];

      let query = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, user_type, bio')
        .or(`full_name.ilike.%${debouncedSearch}%,username.ilike.%${debouncedSearch}%`);

      if (userType !== 'all') {
        query = query.eq('user_type', userType);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: debouncedSearch.length >= 2,
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Find Tennis Players & Coaches</h1>
      
      <div className="space-y-6">
        <Card className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div>
              <p className="mb-2 text-sm font-medium">Filter by:</p>
              <RadioGroup value={userType} onValueChange={(value) => setUserType(value as UserType)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="player" id="player" />
                  <Label htmlFor="player">Players</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coach" id="coach" />
                  <Label htmlFor="coach">Coaches</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>
        
        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : debouncedSearch.length < 2 ? (
            <div className="text-center py-12 text-muted-foreground">
              Enter at least 2 characters to search
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <UserSearchResults users={searchResults} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No users found. Try a different search term.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
