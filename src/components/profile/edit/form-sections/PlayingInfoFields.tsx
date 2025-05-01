
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileFormValues } from '../ProfileEditForm';

interface PlayingInfoFieldsProps {
  control: Control<ProfileFormValues>;
}

export const PlayingInfoFields = ({ control }: PlayingInfoFieldsProps) => {
  return (
    <>
      <FormField
        control={control}
        name="playing_style"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Playing Style</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Describe your playing style" />
            </FormControl>
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
            {field.name && (
              <p className="text-sm text-destructive">{field.name}</p>
            )}
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
                className="w-full border rounded p-2 min-h-[100px] bg-background"
                placeholder="Tell us about yourself"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};
