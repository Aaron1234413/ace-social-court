
import React from 'react';
import { FormField, FormLabel, FormDescription, FormMessage, FormControl, FormItem } from '@/components/ui/form';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarIcon } from 'lucide-react';
import NextStepItem from './NextStepItem';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SessionNextStepsForm() {
  const form = useFormContext();
  
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "next_steps"
  });
  
  const handleAddStep = () => {
    append({ description: "", completed: false });
  };
  
  return (
    <div className="space-y-6">
      <div>
        <FormLabel className="text-lg font-medium">Session Notes</FormLabel>
        <FormDescription className="mt-1 mb-2">
          Add any general notes about this session
        </FormDescription>
        
        <FormField
          control={form.control}
          name="session_note"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea 
                  placeholder="Notes about the session, overall performance, etc."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <FormLabel className="text-lg font-medium">Next Steps</FormLabel>
          <Button 
            type="button"
            onClick={handleAddStep}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            Add Step
          </Button>
        </div>
        
        <FormField
          control={form.control}
          name="next_steps"
          render={() => (
            <div className="border rounded-lg p-4 bg-card">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-muted-foreground mb-2">No next steps added</p>
                  <Button
                    type="button"
                    onClick={handleAddStep}
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add a Next Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {fields.map((field, index) => (
                    <NextStepItem
                      key={field.id}
                      index={index}
                      description={field.description}
                      completed={field.completed}
                      onDescriptionChange={(description) => update(index, { ...field, description })}
                      onCompletedChange={(completed) => update(index, { ...field, completed })}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        />
      </div>
      
      {/* Reminder Date */}
      <FormField
        control={form.control}
        name="reminder_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Reminder Date (Optional)</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
                    ) : (
                      <span>Set a reminder date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              Set a date for when you want to be reminded about these next steps
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
