
import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { CheckIcon, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDebounce } from '@/hooks/use-debounce';

interface Coach {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface CoachSearchProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  onBlur?: () => void;
}

export default function CoachSearch({ value, onChange, onBlur }: CoachSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch coaches
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['coach-search', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return [];
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .eq('user_type', 'coach')
          .or(`username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`)
          .limit(10);
          
        if (error) {
          throw error;
        }
        
        return data as Coach[];
      } catch (err) {
        console.error('Error searching coaches:', err);
        return [];
      }
    },
    enabled: debouncedSearch.length >= 2,
  });
  
  // If we have a value but no selected coach, fetch the coach data
  useEffect(() => {
    const fetchSelectedCoach = async () => {
      if (value && !selectedCoach) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .eq('id', value)
            .single();
            
          if (error) throw error;
          
          if (isMounted.current && data) {
            setSelectedCoach(data as Coach);
          }
        } catch (err) {
          console.error('Error fetching selected coach:', err);
        }
      }
    };
    
    fetchSelectedCoach();
  }, [value, selectedCoach]);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          onClick={() => setOpen(!open)}
          onBlur={onBlur}
        >
          {value && selectedCoach ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedCoach.avatar_url || ''} alt={selectedCoach.full_name || ''} />
                <AvatarFallback>
                  {selectedCoach.full_name?.[0] || selectedCoach.username?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span>
                {selectedCoach.full_name || selectedCoach.username || 'Unknown coach'}
              </span>
            </div>
          ) : (
            "Select a coach..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search coaches..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>No coaches found</CommandEmpty>
            <CommandGroup>
              {coaches.map((coach) => (
                <CommandItem
                  key={coach.id}
                  value={coach.id}
                  onSelect={() => {
                    onChange(coach.id);
                    setSelectedCoach(coach);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={coach.avatar_url || ''} alt={coach.full_name || ''} />
                      <AvatarFallback>
                        {coach.full_name?.[0] || coach.username?.[0] || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <span>{coach.full_name || coach.username}</span>
                  </div>
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === coach.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
