
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileFormValues } from '../ProfileEditForm';

interface BasicInfoFieldsProps {
  control: Control<ProfileFormValues>;
}

export const BasicInfoFields = ({ control }: BasicInfoFieldsProps) => {
  return (
    <>
      <FormField
        control={control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Choose a username" required />
            </FormControl>
            {field.name && (
              <p className="text-sm text-destructive">{field.name}</p>
            )}
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="full_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Your full name" required />
            </FormControl>
            {field.name && (
              <p className="text-sm text-destructive">{field.name}</p>
            )}
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="user_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Type *</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              defaultValue="player"
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectContent>
            </Select>
            {field.name && (
              <p className="text-sm text-destructive">{field.name}</p>
            )}
          </FormItem>
        )}
      />
    </>
  );
};
