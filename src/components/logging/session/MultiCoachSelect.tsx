
import React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Coach {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface MultiCoachSelectProps {
  selectedCoachIds: string[];
  onCoachIdsChange: (coachIds: string[]) => void;
  disabled?: boolean;
}

export const MultiCoachSelect: React.FC<MultiCoachSelectProps> = ({
  selectedCoachIds,
  onCoachIdsChange,
  disabled = false
}) => {
  const [open, setOpen] = React.useState(false);

  // Fetch available coaches
  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('user_type', 'coach')
        .order('username');
      
      if (error) {
        console.error('Error fetching coaches:', error);
        return [];
      }
      
      return data as Coach[];
    }
  });

  // Get selected coaches data
  const selectedCoaches = coaches.filter(coach => 
    selectedCoachIds.includes(coach.id)
  );

  const handleSelectCoach = (coachId: string) => {
    if (selectedCoachIds.includes(coachId)) {
      onCoachIdsChange(selectedCoachIds.filter(id => id !== coachId));
    } else {
      onCoachIdsChange([...selectedCoachIds, coachId]);
    }
  };

  const removeCoach = (coachId: string) => {
    onCoachIdsChange(selectedCoachIds.filter(id => id !== coachId));
  };

  const getCoachDisplayName = (coach: Coach) => {
    return coach.full_name || coach.username || 'Unknown Coach';
  };

  const getCoachInitial = (coach: Coach) => {
    const name = getCoachDisplayName(coach);
    return name[0]?.toUpperCase() || 'C';
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled || isLoading}
          >
            {selectedCoaches.length === 0 ? (
              "Select coaches..."
            ) : selectedCoaches.length === 1 ? (
              getCoachDisplayName(selectedCoaches[0])
            ) : (
              `${selectedCoaches.length} coaches selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search coaches..." />
            <CommandEmpty>No coaches found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {coaches.map((coach) => (
                <CommandItem
                  key={coach.id}
                  value={getCoachDisplayName(coach)}
                  onSelect={() => handleSelectCoach(coach.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={coach.avatar_url || ''} alt={getCoachDisplayName(coach)} />
                      <AvatarFallback className="text-xs">
                        {getCoachInitial(coach)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{getCoachDisplayName(coach)}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCoachIds.includes(coach.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected coaches badges */}
      {selectedCoaches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedCoaches.map((coach) => (
            <Badge
              key={coach.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <Avatar className="h-4 w-4">
                <AvatarImage src={coach.avatar_url || ''} alt={getCoachDisplayName(coach)} />
                <AvatarFallback className="text-xs">
                  {getCoachInitial(coach)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs">{getCoachDisplayName(coach)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => removeCoach(coach.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
