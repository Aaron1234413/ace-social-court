
import { useState } from 'react';
import { Control, useFieldArray } from 'react-hook-form';
import { Calendar, Trophy, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import type { ProfileFormValues } from '../profileSchema';

interface WizardAchievementsProps {
  control: Control<ProfileFormValues>;
}

export const WizardAchievements = ({ control }: WizardAchievementsProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "achievements",
  });
  
  const [dateOpen, setDateOpen] = useState<Record<string, boolean>>({});

  const toggleDatePopover = (index: number) => {
    const key = `${index}`;
    setDateOpen((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h2 className="text-xl font-semibold">Tennis Achievements</h2>
        <p className="text-muted-foreground">
          Add your tennis accomplishments to showcase your experience and credentials.
        </p>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-md p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">Achievement {index + 1}</h4>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => remove(index)}
                    className="text-destructive h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove achievement</span>
                  </Button>
                </div>

                <FormField
                  control={control}
                  name={`achievements.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title*</FormLabel>
                      <FormControl>
                        <Input placeholder="Achievement Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`achievements.${index}.date_achieved`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Achieved</FormLabel>
                      <Popover 
                        open={dateOpen[`${index}`]} 
                        onOpenChange={() => toggleDatePopover(index)}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full justify-start text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {field.value ? format(new Date(field.value), "PPP") : "Select date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              field.onChange(date ? date.toISOString() : '');
                              toggleDatePopover(index);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`achievements.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="w-full border rounded-md p-2 min-h-[80px] bg-background"
                          placeholder="Describe your achievement"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({
              title: '',
              date_achieved: '',
              description: ''
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Achievement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WizardAchievements;
