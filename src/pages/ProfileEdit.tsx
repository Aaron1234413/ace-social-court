
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import LocationPickerDialog from '@/components/profile/LocationPickerDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type UserType = Database['public']['Enums']['user_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

// Define schema for form validation with required fields marked
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').nonempty('Username is required'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').nonempty('Full name is required'),
  user_type: z.enum(['player', 'coach'] as const),
  playing_style: z.string().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional'] as const),
  bio: z.string().optional(),
  location_name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfileEdit = () => {
  const { user, refreshProfile, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = location.state?.newUser === true;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [formSubmitAttempt, setFormSubmitAttempt] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      username: '',
      full_name: '',
      user_type: 'player',
      playing_style: '',
      experience_level: 'beginner',
      bio: '',
      location_name: '',
      latitude: undefined,
      longitude: undefined,
    }
  });

  useEffect(() => {
    if (!user) {
      toast.error('You must be logged in to edit your profile');
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {  // Not found is ok for new users
          console.error('Error fetching profile:', error);
          throw error;
        }

        console.log('Fetched profile data:', data);

        // Only set form values if we have data
        if (data) {
          form.reset({
            username: data.username || '',
            full_name: data.full_name || '',
            user_type: (data.user_type as UserType) || 'player',
            playing_style: data.playing_style || '',
            experience_level: (data.experience_level as ExperienceLevel) || 'beginner',
            bio: data.bio || '',
            location_name: data.location_name || '',
            latitude: data.latitude || undefined,
            longitude: data.longitude || undefined,
          });

          setLocationName(data.location_name || '');
        }
        // For new users, try to pre-populate full name from auth metadata if available
        else if (user.user_metadata?.full_name) {
          form.setValue('full_name', user.user_metadata.full_name);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, form]);

  const handleSetLocation = (lat: number, lng: number, address: string) => {
    console.log('Setting location:', { lat, lng, address });
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    form.setValue('location_name', address);
    setLocationName(address);
    setIsLocationPickerOpen(false); // Close the dialog after location is set
    toast.success('Location set successfully');
  };

  const openLocationPicker = () => {
    setIsLocationPickerOpen(true);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    console.log('Form validation status:', {
      isValid: form.formState.isValid,
      errors: form.formState.errors,
      values
    });
    
    // Show errors for required fields if they're missing
    if (!form.formState.isValid) {
      const errorFields = Object.keys(form.formState.errors);
      toast.error(`Please fill in all required fields: ${errorFields.join(', ')}`);
      setFormSubmitAttempt(true);
      return;
    }

    setIsSaving(true);
    try {
      console.log('Submitting profile with values:', values);
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: values.username,
          full_name: values.full_name,
          user_type: values.user_type,
          playing_style: values.playing_style || null,
          experience_level: values.experience_level,
          bio: values.bio || null,
          location_name: values.location_name || null,
          latitude: values.latitude || null,
          longitude: values.longitude || null,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully, refreshing profile data');
      
      // Refresh the profile in the AuthContext
      await refreshProfile();
      
      toast.success('Profile updated successfully');
      
      // If this was a new user completing setup, redirect to feed
      if (isNewUser) {
        navigate('/feed');
      } else {
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {isNewUser && (
        <Alert className="mb-6 bg-primary/10">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Complete your profile</AlertTitle>
          <AlertDescription>
            Please set up your profile to continue using the app. Fields marked with * are required.
          </AlertDescription>
        </Alert>
      )}
      
      <h1 className="text-3xl font-bold mb-6">
        {isNewUser ? 'Set Up Your Profile' : 'Edit Profile'}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Choose a username" required />
                </FormControl>
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
                )}
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your full name" required />
                </FormControl>
                {form.formState.errors.full_name && (
                  <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type *</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
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
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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
            control={form.control}
            name="experience_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level *</FormLabel>
                <Select 
                  value={field.value} 
                  onValueChange={field.onChange}
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
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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

          <Card className="border border-muted">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Location</CardTitle>
              <CardDescription>
                Set your home location to appear on the map when you're not actively sharing your position
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {locationName || form.watch('location_name') || 'No location set'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={openLocationPicker}
                    className="text-sm"
                  >
                    {form.watch('latitude') ? 'Change Location' : 'Set Location'}
                  </Button>
                  {form.watch('latitude') && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        form.setValue('latitude', undefined);
                        form.setValue('longitude', undefined);
                        form.setValue('location_name', '');
                        setLocationName('');
                      }}
                      className="text-sm text-destructive"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                {/* Hidden fields to store location data */}
                <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
                <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />
                <input type="hidden" {...form.register('location_name')} />
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isNewUser ? 'Complete Profile Setup' : 'Save Profile'
            )}
          </Button>
        </form>
      </Form>

      {isLocationPickerOpen && (
        <LocationPickerDialog 
          isOpen={isLocationPickerOpen}
          onClose={() => setIsLocationPickerOpen(false)}
          onSelectLocation={handleSetLocation}
          initialLatitude={form.watch('latitude')}
          initialLongitude={form.watch('longitude')}
        />
      )}
    </div>
  );
};

export default ProfileEdit;
