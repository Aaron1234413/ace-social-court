
import React from 'react';
import { FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import DrillItem from './DrillItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function SessionDrillsForm() {
  const form = useFormContext();
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "drills"
  });
  
  const handleAddDrill = () => {
    append({ name: "", rating: 3, notes: "" });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <FormLabel className="text-lg font-medium">Drills</FormLabel>
        <Button 
          type="button"
          onClick={handleAddDrill}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Drill
        </Button>
      </div>
      
      <FormField
        control={form.control}
        name="drills"
        render={() => (
          <div>
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground mb-4">No drills added yet</p>
                <Button
                  type="button"
                  onClick={handleAddDrill}
                  variant="default"
                  size="sm"
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Your First Drill
                </Button>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] overflow-auto pr-3">
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <DrillItem
                      key={field.id}
                      index={index}
                      name={field.name}
                      rating={field.rating}
                      notes={field.notes}
                      onNameChange={(name) => update(index, { ...field, name })}
                      onRatingChange={(rating) => update(index, { ...field, rating })}
                      onNotesChange={(notes) => update(index, { ...field, notes })}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
            <FormMessage />
          </div>
        )}
      />
    </div>
  );
}
