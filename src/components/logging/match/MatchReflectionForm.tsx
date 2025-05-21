
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MatchFormValues } from './matchSchema';

interface MatchReflectionFormProps {
  form: UseFormReturn<MatchFormValues>;
}

const MatchReflectionForm = ({ form }: MatchReflectionFormProps) => {
  return (
    <>
      <CardHeader>
        <CardTitle>Match Reflection</CardTitle>
        <CardDescription>Rate your performance and add notes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Serve Rating */}
          <FormField
            control={form.control}
            name="serve_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serve Rating</FormLabel>
                <FormControl>
                  <div className="pt-2">
                    <Slider 
                      min={1} 
                      max={5} 
                      step={1} 
                      value={[field.value]} 
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Return Rating */}
          <FormField
            control={form.control}
            name="return_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Return Rating</FormLabel>
                <FormControl>
                  <div className="pt-2">
                    <Slider 
                      min={1} 
                      max={5} 
                      step={1} 
                      value={[field.value]} 
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Endurance Rating */}
          <FormField
            control={form.control}
            name="endurance_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endurance Rating</FormLabel>
                <FormControl>
                  <div className="pt-2">
                    <Slider 
                      min={1} 
                      max={5} 
                      step={1} 
                      value={[field.value]} 
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Poor</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Reflection Notes */}
          <FormField
            control={form.control}
            name="reflection_note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Your thoughts on the match..." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  What went well? What could improve? Any strategies that worked?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </>
  );
};

export default MatchReflectionForm;
