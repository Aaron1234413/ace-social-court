
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TrashIcon } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DrillItemProps {
  index: number;
  name: string;
  notes?: string;
  rating?: number;
  onNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onRemove: () => void;
}

export default function DrillItem({
  index,
  name,
  notes = '',
  rating = 3,
  onNameChange,
  onNotesChange,
  onRatingChange,
  onRemove
}: DrillItemProps) {
  // Get emoji based on rating
  const getEmoji = (rating: number): string => {
    switch (rating) {
      case 1: return '😔';
      case 2: return '🙁';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😀';
      default: return '😐';
    }
  };
  
  // Get label based on rating
  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Average';
    }
  };
  
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Drill #{index + 1}</h4>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="h-8 w-8 p-0"
        >
          <TrashIcon className="h-4 w-4 text-destructive" />
          <span className="sr-only">Remove drill</span>
        </Button>
      </div>
      
      <div className="space-y-2">
        <Input 
          placeholder="Drill name" 
          value={name} 
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="text-sm">Performance</div>
          <div className="text-sm font-medium">
            {getEmoji(rating)} {getRatingLabel(rating)}
          </div>
        </div>
        <Slider 
          value={[rating]}
          min={1}
          max={5}
          step={1}
          className="py-2"
          onValueChange={(values) => onRatingChange(values[0])}
        />
      </div>
      
      <div className="space-y-2">
        <Textarea 
          placeholder="Notes about the drill..." 
          value={notes} 
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}
