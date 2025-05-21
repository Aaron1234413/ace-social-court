
import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import CoachSearch from './CoachSearch';
import FocusAreaSelect from './FocusAreaSelect';

export default function SessionBasicsForm() {
  const form = useFormContext();
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Session Details</h3>
      
      {/* Session Date */}
      <FormField
        control={form.control}
        name="session_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Session Date</FormLabel>
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
                      <span>Pick a date</span>
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
                  disabled={(date) => date > new Date()}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <FormDescription>
              When did this training session take place?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Coach Selection */}
      <FormField
        control={form.control}
        name="coach_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Coach</FormLabel>
            <FormControl>
              <CoachSearch
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FormControl>
            <FormDescription>
              Select the coach who led this session (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Focus Areas */}
      <FormField
        control={form.control}
        name="focus_areas"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <FocusAreaSelect
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
