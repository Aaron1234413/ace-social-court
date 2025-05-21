
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Common tennis focus areas
const FOCUS_AREAS = [
  { value: 'serve', label: 'Serve' },
  { value: 'return', label: 'Return' },
  { value: 'forehand', label: 'Forehand' },
  { value: 'backhand', label: 'Backhand' },
  { value: 'volley', label: 'Volley' },
  { value: 'footwork', label: 'Footwork' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'mental', label: 'Mental Game' }
];

interface FocusAreaSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export default function FocusAreaSelect({ value, onChange, error }: FocusAreaSelectProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-1">
        <Label>Focus Areas</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Select the areas you worked on in this session
        </p>
      </div>
      
      <ToggleGroup 
        type="multiple" 
        className="flex flex-wrap gap-2 justify-start" 
        value={value}
        onValueChange={(newValue) => {
          // Ensure we don't end up with an empty array if all items are deselected
          if (newValue.length > 0) {
            onChange(newValue);
          }
        }}
      >
        {FOCUS_AREAS.map(area => (
          <ToggleGroupItem 
            key={area.value} 
            value={area.value}
            className={cn(
              "data-[state=on]:bg-tennis-green data-[state=on]:text-white",
              "h-auto py-1 px-3 rounded-full"
            )}
          >
            {area.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      
      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
}
