
import { Control } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProfileFormValues } from '../profileSchema';
import { Card, CardContent } from '@/components/ui/card';

interface WizardBasicInfoProps {
  control: Control<ProfileFormValues>;
}

export const WizardBasicInfo = ({ control }: WizardBasicInfoProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <p className="text-muted-foreground">Let's start with some basic information about you.</p>
        
        <FormField
          control={control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Choose a username" />
              </FormControl>
              <FormMessage />
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
                <Input {...field} placeholder="Your full name" />
              </FormControl>
              <FormMessage />
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
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default WizardBasicInfo;
