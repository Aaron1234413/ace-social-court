import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { BasicInfoFields } from './form-sections/BasicInfoFields';
import { PlayingInfoFields } from './form-sections/PlayingInfoFields';
import { LocationField } from './form-sections/LocationField';
import { AchievementsField } from './form-sections/AchievementsField';
import { CertificationsField } from './form-sections/CertificationsField';
import { Database } from '@/integrations/supabase/types';
import { ProfileData } from './ProfileEditContainer';

type UserType = Database['public']['Enums']['user_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

// Define achievement schema
const achievementSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  date_achieved: z.string().optional(),
  description: z.string().optional()
});

// Define certification schema
const certificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  issuing_organization: z.string().min(1, 'Organization is required'),
  issue_date: z.string().optional(),
  expiry_date: z.string().optional()
});

// Define schema for form validation
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').nonempty('Username is required'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').nonempty('Full name is required'),
  user_type: z.enum(['player', 'coach', 'ambassador'] as const),
  playing_style: z.string().optional(),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional'] as const),
  bio: z.string().optional(),
  location_name: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  achievements: z.array(achievementSchema).optional().default([]),
  certifications: z.array(certificationSchema).optional().default([])
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  isNewUser: boolean;
  profileData: ProfileData | null;
}

export const ProfileEditForm = ({ isNewUser, profileData }: ProfileEditFormProps) => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [locationName, setLocationName] = useState<string>(profileData?.location_name || '');
  const [formSubmitAttempt, setFormSubmitAttempt] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);

  // Initialize form with validation mode set to onChange for better user experience
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
      achievements: [],
      certifications: []
    }
  });

  // Fetch user achievements and certifications
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          // Fetch achievements
          const { data: achievementsData, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .eq('user_id', user.id);
          
          if (achievementsError) throw achievementsError;
          setAchievements(achievementsData || []);
          
          // Fetch certifications
          const { data: certificationsData, error: certificationsError } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', user.id);
          
          if (certificationsError) throw certificationsError;
          setCertifications(certificationsData || []);
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to fetch user data');
        }
      };
      
      fetchUserData();
    }
  }, [user]);

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profileData) {
      console.log('Setting form values from profile data:', profileData);
      
      // Update form with profile data
      form.reset({
        username: profileData.username || '',
        full_name: profileData.full_name || '',
        user_type: profileData.user_type || 'player',
        playing_style: profileData.playing_style || '',
        experience_level: profileData.experience_level || 'beginner',
        bio: profileData.bio || '',
        location_name: profileData.location_name || '',
        latitude: profileData.latitude || undefined,
        longitude: profileData.longitude || undefined,
        achievements: achievements,
        certifications: certifications
      });

      if (profileData.location_name) {
        setLocationName(profileData.location_name);
      }
    }
  }, [profileData, form, achievements, certifications]);

  // Set location data
  const handleSetLocation = (lat: number, lng: number, address: string) => {
    console.log('Setting location:', { lat, lng, address });
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid location coordinates:', { lat, lng });
      toast.error('Invalid location coordinates. Please try again.');
      return;
    }
    
    // Convert to proper number format to ensure it's stored correctly
    const parsedLat = parseFloat(Number(lat).toFixed(6));
    const parsedLng = parseFloat(Number(lng).toFixed(6));
    
    console.log('Parsed coordinates:', { parsedLat, parsedLng });
    
    // Directly set the values in the form
    form.setValue('latitude', parsedLat);
    form.setValue('longitude', parsedLng);
    form.setValue('location_name', address);
    setLocationName(address);
    
    // Close the dialog after location is set
    setIsLocationPickerOpen(false);
    toast.success('Location set successfully');
    
    console.log('Form values after setting location:', form.getValues());
  };

  const openLocationPicker = () => {
    setIsLocationPickerOpen(true);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    // Clear previous validation message
    setValidationMessage(null);

    console.log('Form validation status:', {
      isValid: form.formState.isValid,
      dirtyFields: form.formState.dirtyFields,
      touchedFields: form.formState.touchedFields,
      errors: form.formState.errors,
      values
    });
    
    // Explicit validation check for required fields
    const { username, full_name, user_type, experience_level } = values;
    if (!username || !full_name || !user_type || !experience_level) {
      const missingFields = [];
      if (!username) missingFields.push('Username');
      if (!full_name) missingFields.push('Full Name');
      if (!user_type) missingFields.push('Account Type');
      if (!experience_level) missingFields.push('Experience Level');
      
      const errorMessage = `Please fill in all required fields: ${missingFields.join(', ')}`;
      setValidationMessage(errorMessage);
      toast.error(errorMessage);
      setFormSubmitAttempt(true);
      return;
    }

    setIsSaving(true);
    try {
      console.log('Submitting profile with values:', values);
      
      // Prepare the data for submission
      // Convert latitude/longitude to numbers or null
      const latitude = values.latitude !== undefined ? Number(parseFloat(values.latitude.toString()).toFixed(6)) : null;
      const longitude = values.longitude !== undefined ? Number(parseFloat(values.longitude.toString()).toFixed(6)) : null;
      
      const profileData = {
        id: user.id,
        username: values.username,
        full_name: values.full_name,
        user_type: values.user_type as UserType,
        playing_style: values.playing_style || null,
        experience_level: values.experience_level as ExperienceLevel,
        bio: values.bio || null,
        location_name: values.location_name || null,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString()
      };
      
      console.log('Submitting profile data:', profileData);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw profileError;
      }

      // Update achievements
      if (values.achievements && values.achievements.length > 0) {
        // First delete all existing achievements for this user
        const { error: deleteError } = await supabase
          .from('achievements')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error deleting achievements:', deleteError);
          throw deleteError;
        }
        
        // Then insert the new achievements
        const achievementsToInsert = values.achievements.map(achievement => ({
          user_id: user.id,
          title: achievement.title,
          date_achieved: achievement.date_achieved || null,
          description: achievement.description || null
        }));
        
        if (achievementsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('achievements')
            .insert(achievementsToInsert);
          
          if (insertError) {
            console.error('Error inserting achievements:', insertError);
            throw insertError;
          }
        }
      }
      
      // Update certifications
      if (values.certifications && values.certifications.length > 0) {
        // First delete all existing certifications for this user
        const { error: deleteError } = await supabase
          .from('certifications')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) {
          console.error('Error deleting certifications:', deleteError);
          throw deleteError;
        }
        
        // Then insert the new certifications
        const certificationsToInsert = values.certifications.map(certification => ({
          user_id: user.id,
          title: certification.title,
          issuing_organization: certification.issuing_organization,
          issue_date: certification.issue_date || null,
          expiry_date: certification.expiry_date || null
        }));
        
        if (certificationsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('certifications')
            .insert(certificationsToInsert);
          
          if (insertError) {
            console.error('Error inserting certifications:', insertError);
            throw insertError;
          }
        }
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isNewUser && (
          <Alert className="mb-6 bg-primary/10">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Complete your profile</AlertTitle>
            <AlertDescription>
              Please set up your profile to continue using the app. Fields marked with * are required.
            </AlertDescription>
          </Alert>
        )}
        
        {validationMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>{validationMessage}</AlertDescription>
          </Alert>
        )}

        <BasicInfoFields control={form.control} />
        <PlayingInfoFields control={form.control} />
        <LocationField 
          form={form}
          locationName={locationName}
          isLocationPickerOpen={isLocationPickerOpen}
          setIsLocationPickerOpen={setIsLocationPickerOpen}
          openLocationPicker={openLocationPicker}
          onSelectLocation={handleSetLocation}
        />

        {/* Add Achievements section */}
        <div className="border-t pt-6 mt-6">
          <AchievementsField control={form.control} />
        </div>

        {/* Add Certifications section - only show for coaches */}
        {form.watch('user_type') === 'coach' && (
          <div className="border-t pt-6 mt-6">
            <CertificationsField control={form.control} />
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full font-medium"
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
  );
};

export default ProfileEditForm;
