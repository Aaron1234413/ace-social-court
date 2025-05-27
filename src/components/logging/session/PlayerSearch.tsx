
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Plus, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface Player {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface PlayerSearchProps {
  selectedPlayers: string[];
  onChange: (playerIds: string[]) => void;
}

export default function PlayerSearch({ selectedPlayers, onChange }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedPlayerData, setSelectedPlayerData] = useState<Player[]>([]);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch players for search
  const { data: searchResults = [] } = useQuery({
    queryKey: ['player-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('user_type', 'player')
          .or(`username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`)
          .not('id', 'in', `(${selectedPlayers.join(',')})`)
          .limit(10);
          
        if (error) {
          throw error;
        }
        
        return data as Player[];
      } catch (err) {
        console.error('Error searching players:', err);
        return [];
      }
    },
    enabled: debouncedSearch.length >= 2,
  });
  
  // Fetch selected player data
  useEffect(() => {
    const fetchSelectedPlayers = async () => {
      if (selectedPlayers.length === 0) {
        setSelectedPlayerData([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', selectedPlayers);
          
        if (error) throw error;
        
        if (isMounted.current && data) {
          setSelectedPlayerData(data as Player[]);
        }
      } catch (err) {
        console.error('Error fetching selected players:', err);
      }
    };
    
    fetchSelectedPlayers();
  }, [selectedPlayers]);
  
  const addPlayer = (player: Player) => {
    if (!selectedPlayers.includes(player.id)) {
      onChange([...selectedPlayers, player.id]);
      setSearchQuery('');
      setShowSearch(false);
    }
  };
  
  const removePlayer = (playerId: string) => {
    onChange(selectedPlayers.filter(id => id !== playerId));
  };
  
  return (
    <div className="space-y-3">
      {/* Selected players */}
      {selectedPlayerData.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPlayerData.map((player) => (
            <Badge key={player.id} variant="secondary" className="flex items-center gap-2 p-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={player.avatar_url || ''} alt={player.full_name || ''} />
                <AvatarFallback className="text-xs">
                  {player.full_name?.[0] || player.username?.[0] || 'P'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {player.full_name || player.username || 'Unknown player'}
              </span>
              <button
                onClick={() => removePlayer(player.id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Search toggle */}
      {!showSearch && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowSearch(true)}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      )}
      
      {/* Search input and results */}
      {showSearch && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          
          {debouncedSearch.length >= 2 && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {searchResults.length > 0 ? (
                searchResults.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => addPlayer(player)}
                    className="w-full p-3 text-left hover:bg-muted flex items-center gap-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatar_url || ''} alt={player.full_name || ''} />
                      <AvatarFallback>
                        {player.full_name?.[0] || player.username?.[0] || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{player.full_name || player.username}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-muted-foreground">
                  No players found
                </div>
              )}
            </div>
          )}
          
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
