import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MapPin } from 'lucide-react';
import LocationPickerDialog from '@/components/profile/LocationPickerDialog';

type UserType = Database['public']['Enums']['user_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

// Define schema for form validation
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [locationName, setLocationName] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
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

        if (error) throw error;

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
      } catch (error) {
        toast.error('Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, form]);

  const handleSetLocation = (lat: number, lng: number, address: string) => {
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    form.setValue('location_name', address);
    setLocationName(address);
    setIsLocationPickerOpen(false);
    toast.success('Location set successfully');
  };

  const openLocationPicker = () => {
    setIsLocationPickerOpen(true);
    // Initialize map in a modal or side panel here
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          full_name: values.full_name,
          user_type: values.user_type,
          playing_style: values.playing_style,
          experience_level: values.experience_level,
          bio: values.bio,
          location_name: values.location_name,
          latitude: values.latitude,
          longitude: values.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Choose a username" />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your full name" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
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
                <FormLabel>Experience Level</FormLabel>
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
                    className="w-full border rounded p-2 min-h-[100px]"
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

          <Button type="submit" className="w-full">Save Profile</Button>
        </form>
      </Form>

      {/* We'll implement the location picker component next */}
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
