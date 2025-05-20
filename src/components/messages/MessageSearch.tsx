
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';
import { supabase } from '@/integrations/supabase/client';

type UserResult = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

interface MessageSearchProps {
  onSelectUser: (user: UserResult) => void;
}

const MessageSearch = ({ onSelectUser }: MessageSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchQuery, 500);
  
  // Search for users when debounced search term changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${debouncedSearchTerm}%,full_name.ilike.%${debouncedSearchTerm}%`)
          .limit(10);
          
        if (error) {
          console.error('Error searching users:', error);
          return;
        }
        
        setResults(data || []);
      } catch (error) {
        console.error('Error in user search:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    searchUsers();
  }, [debouncedSearchTerm]);
  
  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 w-full"
        />
      </div>
      
      {isSearching && (
        <div className="mt-2 text-sm text-muted-foreground">Searching...</div>
      )}
      
      {results.length > 0 && (
        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto border rounded-md shadow-sm p-2">
          {results.map(user => (
            <Button
              key={user.id}
              variant="ghost"
              className="w-full flex items-center justify-start gap-3 p-2 hover:bg-accent"
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="h-8 w-8">
                {user.avatar_url && (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name || user.username || 'User'} 
                    className="h-full w-full object-cover"
                  />
                )}
                <AvatarFallback>
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium">
                  {user.full_name || user.username || 'Unknown User'}
                </p>
                {user.username && (
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
      
      {debouncedSearchTerm && debouncedSearchTerm.length >= 3 && results.length === 0 && !isSearching && (
        <div className="mt-2 text-sm text-muted-foreground">No users found</div>
      )}
    </div>
  );
};

export default MessageSearch;
