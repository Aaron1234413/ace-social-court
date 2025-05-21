
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrashIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface NextStepItemProps {
  index: number;
  description: string;
  completed: boolean;
  onDescriptionChange: (value: string) => void;
  onCompletedChange: (checked: boolean) => void;
  onRemove: () => void;
}

export default function NextStepItem({
  index,
  description,
  completed,
  onDescriptionChange,
  onCompletedChange,
  onRemove
}: NextStepItemProps) {
  return (
    <div className="flex items-center space-x-2 py-2">
      <Checkbox 
        checked={completed} 
        onCheckedChange={onCompletedChange} 
        id={`step-${index}`}
      />
      <div className="flex-1">
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Next step description..."
          className={completed ? "line-through text-muted-foreground" : ""}
        />
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onRemove}
        className="h-8 w-8 p-0"
      >
        <TrashIcon className="h-4 w-4 text-destructive" />
        <span className="sr-only">Remove step</span>
      </Button>
    </div>
  );
}
