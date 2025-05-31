
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import OpponentSearch from '../OpponentSearch';
import { MatchData } from '../MatchLogger';

interface MatchBasicsStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const SURFACE_OPTIONS = [
  { value: 'hard', label: '🏟️ Hard Court', description: 'Concrete/asphalt with acrylic surface' },
  { value: 'clay', label: '🟤 Clay Court', description: 'Crushed brick or stone dust' },
  { value: 'grass', label: '🌱 Grass Court', description: 'Natural grass surface' },
  { value: 'other', label: '🏓 Other', description: 'Indoor carpet, synthetic, etc.' }
];

export default function MatchBasicsStep({ data, onDataChange, onValidationChange }: MatchBasicsStepProps) {
  const [showOpponentSearch, setShowOpponentSearch] = useState(false);

  // Validation effect
  useEffect(() => {
    const isValid = data.match_date && (data.opponent_id || data.opponent_name);
    onValidationChange(isValid);
  }, [data.match_date, data.opponent_id, data.opponent_name, onValidationChange]);

  const handleOpponentSelect = (opponent: { id: string; name: string }) => {
    onDataChange({
      opponent_id: opponent.id,
      opponent_name: opponent.name
    });
    setShowOpponentSearch(false);
  };

  const handleOpponentNameChange = (name: string) => {
    onDataChange({
      opponent_name: name,
      opponent_id: undefined // Clear ID when typing manually
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Date */}
        <div className="space-y-2">
          <Label htmlFor="match-date">Match Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !data.match_date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {data.match_date ? format(data.match_date, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={data.match_date}
                onSelect={(date) => date && onDataChange({ match_date: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Surface Type */}
        <div className="space-y-2">
          <Label>Court Surface</Label>
          <Select
            value={data.surface || ''}
            onValueChange={(value) => onDataChange({ surface: value as MatchData['surface'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select surface type" />
            </SelectTrigger>
            <SelectContent>
              {SURFACE_OPTIONS.map((surface) => (
                <SelectItem key={surface.value} value={surface.value}>
                  <div className="flex flex-col">
                    <span>{surface.label}</span>
                    <span className="text-xs text-muted-foreground">{surface.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Opponent */}
      <div className="space-y-2">
        <Label htmlFor="opponent">Opponent *</Label>
        <div className="flex gap-2">
          <Input
            id="opponent"
            placeholder="Enter opponent's name or search users..."
            value={data.opponent_name || ''}
            onChange={(e) => handleOpponentNameChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowOpponentSearch(true)}
            className="px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {data.opponent_id && (
          <p className="text-xs text-green-600">✓ Linked to user profile</p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Tennis club, court name, or city..."
          value={data.location || ''}
          onChange={(e) => onDataChange({ location: e.target.value })}
        />
      </div>

      {/* Score */}
      <div className="space-y-2">
        <Label htmlFor="score">Final Score</Label>
        <Input
          id="score"
          placeholder="e.g., 6-4, 3-6, 6-2 or 2-1 sets"
          value={data.score || ''}
          onChange={(e) => onDataChange({ score: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Enter the final score of the match (optional)
        </p>
      </div>

      {/* Opponent Search Modal */}
      {showOpponentSearch && (
        <OpponentSearch
          onSelect={handleOpponentSelect}
          onClose={() => setShowOpponentSearch(false)}
        />
      )}
    </div>
  );
}
