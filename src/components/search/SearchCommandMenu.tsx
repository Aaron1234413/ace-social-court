
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';
import { supabase } from '@/integrations/supabase/client';
import { 
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from '@/components/ui/command';
import { SearchUser } from '@/hooks/useSearch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, MapPin } from 'lucide-react';

interface SearchCommandMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SearchCommandMenu: React.FC<SearchCommandMenuProps> = ({ 
  open, 
  setOpen 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const navigate = useNavigate();
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  
  // Search for suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, user_type, bio, skill_level')
          .or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`)
          .limit(5);
          
        if (error) throw error;
        setSuggestions(data || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedSearchTerm]);
  
  const handleSelect = (value: string) => {
    // Save to recent searches
    const updatedSearches = [
      value, 
      ...recentSearches.filter(s => s !== value)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(value)}`);
    setOpen(false);
  };
  
  const handleUserSelect = (user: SearchUser) => {
    navigate(`/profile/${user.id}`);
    setOpen(false);
  };
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Search for players, coaches, or locations..." 
        value={inputValue}
        onValueChange={setInputValue}
        autoFocus
      />
      <CommandList className="max-h-[300px] overflow-auto">
        <CommandEmpty className="py-6 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-tennis-green border-t-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : (
            <p>No results found.</p>
          )}
        </CommandEmpty>
        
        {suggestions.length > 0 && (
          <CommandGroup heading="People">
            {suggestions.map(user => (
              <CommandItem
                key={user.id}
                onSelect={() => handleUserSelect(user)}
                className="flex items-center gap-2 py-3 cursor-pointer animate-slide-up"
                value={`${user.full_name || user.username || ''}`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.full_name || 'User'} />
                  ) : (
                    <AvatarFallback className="bg-tennis-green/10 text-tennis-darkGreen">
                      {user.full_name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{user.full_name || user.username}</span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Badge variant={user.user_type === 'coach' ? 'default' : 'secondary'} className="text-[10px] h-4">
                      {user.user_type === 'coach' ? 'Coach' : 'Player'}
                    </Badge>
                    {user.location && (
                      <span className="ml-2 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((term, i) => (
              <CommandItem 
                key={i} 
                onSelect={() => handleSelect(term)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                {term}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchCommandMenu;
