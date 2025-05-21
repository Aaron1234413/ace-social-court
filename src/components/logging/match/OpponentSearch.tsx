
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearch, SearchUser } from '@/hooks/useSearch';
import { MatchFormValues } from './matchSchema';
import { X, User } from 'lucide-react';

interface OpponentSearchProps {
  form: UseFormReturn<MatchFormValues>;
}

const OpponentSearch = ({ form }: OpponentSearchProps) => {
  const { searchQuery, setSearchQuery, results, isLoading } = useSearch();
  const [showResults, setShowResults] = useState(false);

  const handleSelectUser = (user: SearchUser) => {
    form.setValue('opponent_id', user.id);
    form.setValue('opponent_name', user.full_name || user.username || 'Unknown Player');
    setSearchQuery('');
    setShowResults(false);
  };

  const clearOpponent = () => {
    form.setValue('opponent_id', undefined);
    form.setValue('opponent_name', undefined);
  };

  const selectedOpponentName = form.watch('opponent_name');
  
  return (
    <FormItem className="relative">
      <FormLabel>Opponent</FormLabel>
      <div className="relative">
        {selectedOpponentName ? (
          <div className="flex items-center gap-2 p-2 border rounded-md">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {selectedOpponentName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1">{selectedOpponentName}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={clearOpponent}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear selection</span>
            </Button>
          </div>
        ) : (
          <FormControl>
            <div className="relative">
              <Input
                placeholder="Search for opponent..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                className="pl-9"
              />
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </FormControl>
        )}

        {showResults && searchQuery.length >= 2 && (
          <div 
            className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
            onBlur={(e) => {
              // Only hide if focus is outside this container or its children
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setShowResults(false);
              }
            }}
          >
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="py-1">
                {results.map((user) => (
                  <Button
                    key={user.id}
                    type="button"
                    variant="ghost"
                    className="w-full flex items-center justify-start gap-3 p-2 hover:bg-accent"
                    onClick={() => handleSelectUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.username || ''} />
                      )}
                      <AvatarFallback>
                        {(user.full_name || user.username || 'U').charAt(0)}
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
          </div>
        )}
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default OpponentSearch;
