
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileFormValues } from '../profileSchema';
import { Card, CardContent } from '@/components/ui/card';

interface WizardPlayingInfoProps {
  control: Control<ProfileFormValues>;
}

export const WizardPlayingInfo = ({ control }: WizardPlayingInfoProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h2 className="text-xl font-semibold">Tennis Profile</h2>
        <p className="text-muted-foreground">Tell us about your tennis game and experience.</p>

        <FormField
          control={control}
          name="playing_style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Playing Style</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Describe your playing style" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="experience_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Level *</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                defaultValue="beginner"
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <textarea
                  {...field}
                  className="w-full border rounded-md p-2 min-h-[100px] bg-background"
                  placeholder="Tell us about yourself"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default WizardPlayingInfo;
