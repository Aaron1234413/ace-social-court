
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProfileData } from './ProfileEditContainer';
import { WizardBasicInfo } from './wizard-steps/WizardBasicInfo';
import { WizardPlayingInfo } from './wizard-steps/WizardPlayingInfo';
import { WizardLocationInfo } from './wizard-steps/WizardLocationInfo';
import { WizardAchievements } from './wizard-steps/WizardAchievements';
import { WizardCertifications } from './wizard-steps/WizardCertifications';
import { profileSchema, ProfileFormValues } from './profileSchema';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ProfileEditWizardProps {
  isNewUser: boolean;
  profileData: ProfileData | null;
}

export const ProfileEditWizard = ({ isNewUser, profileData }: ProfileEditWizardProps) => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [locationName, setLocationName] = useState<string>(profileData?.location_name || '');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  
  // Initialize form with validation
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

  // Watch for user_type changes to update steps
  const userType = form.watch('user_type');
  
  // Form steps configuration
  const steps = [
    { label: 'Basic Info', component: WizardBasicInfo },
    { label: 'Playing Details', component: WizardPlayingInfo },
    { label: 'Location', component: WizardLocationInfo },
    { label: 'Achievements', component: WizardAchievements },
    { label: 'Certifications', component: WizardCertifications, 
      condition: (values: ProfileFormValues) => values.user_type === 'coach' }
  ];
  
  // Filter steps based on conditions
  const activeSteps = steps.filter(step => 
    !step.condition || step.condition(form.getValues())
  );
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / activeSteps.length) * 100;

  // Set location data
  const handleSetLocation = (lat: number, lng: number, address: string) => {
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Invalid location coordinates. Please try again.');
      return;
    }
    
    const parsedLat = parseFloat(Number(lat).toFixed(6));
    const parsedLng = parseFloat(Number(lng).toFixed(6));
    
    form.setValue('latitude', parsedLat);
    form.setValue('longitude', parsedLng);
    form.setValue('location_name', address);
    setLocationName(address);
    
    setIsLocationPickerOpen(false);
    toast.success('Location set successfully');
  };

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

  // Check if the current step is valid before proceeding
  const validateCurrentStep = async () => {
    let isValid = true;
    const values = form.getValues();
    
    switch (currentStep) {
      case 0: // Basic Info
        isValid = await form.trigger(['username', 'full_name', 'user_type']);
        break;
      case 1: // Playing Details
        isValid = await form.trigger(['experience_level']);
        break;
      // Other steps don't have required fields
    }
    
    return isValid;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    
    if (!isValid) {
      toast.error('Please fill in all required fields before proceeding.');
      return;
    }
    
    if (currentStep < activeSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setValidationMessage(null);
    setIsSaving(true);
    
    try {
      // Prepare the data for submission
      const latitude = values.latitude !== undefined ? Number(parseFloat(values.latitude.toString()).toFixed(6)) : null;
      const longitude = values.longitude !== undefined ? Number(parseFloat(values.longitude.toString()).toFixed(6)) : null;
      
      const profileData = {
        id: user.id,
        username: values.username,
        full_name: values.full_name,
        user_type: values.user_type,
        playing_style: values.playing_style || null,
        experience_level: values.experience_level,
        bio: values.bio || null,
        location_name: values.location_name || null,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString()
      };
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Update achievements
      if (values.achievements && values.achievements.length > 0) {
        // First delete all existing achievements
        const { error: deleteError } = await supabase
          .from('achievements')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) throw deleteError;
        
        // Then insert new achievements
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
          
          if (insertError) throw insertError;
        }
      }
      
      // Update certifications
      if (values.certifications && values.certifications.length > 0) {
        // First delete all existing certifications
        const { error: deleteError } = await supabase
          .from('certifications')
          .delete()
          .eq('user_id', user.id);
        
        if (deleteError) throw deleteError;
        
        // Then insert new certifications
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
          
          if (insertError) throw insertError;
        }
      }
      
      // Refresh the profile
      await refreshProfile();
      
      toast.success('Profile updated successfully');
      
      // Redirect based on user state
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

  // Get current step component
  const CurrentStepComponent = activeSteps[currentStep]?.component;
  const isLastStep = currentStep === activeSteps.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {activeSteps.length}</span>
          <span>{activeSteps[currentStep]?.label}</span>
        </div>
        <Progress value={progressPercentage} />
      </div>

      {validationMessage && (
        <Alert variant="destructive">
          <AlertDescription>{validationMessage}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Current step component */}
          <div className="space-y-6">
            {CurrentStepComponent && (
              <>
                {currentStep === 0 && (
                  <WizardBasicInfo
                    control={form.control}
                  />
                )}
                {currentStep === 1 && (
                  <WizardPlayingInfo
                    control={form.control}
                  />
                )}
                {currentStep === 2 && (
                  <WizardLocationInfo
                    control={form.control}
                    locationName={locationName}
                    isLocationPickerOpen={isLocationPickerOpen}
                    setIsLocationPickerOpen={setIsLocationPickerOpen}
                    handleSetLocation={handleSetLocation}
                  />
                )}
                {currentStep === 3 && (
                  <WizardAchievements
                    control={form.control}
                  />
                )}
                {currentStep === 4 && (
                  <WizardCertifications
                    control={form.control}
                  />
                )}
              </>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            
            {isLastStep ? (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isNewUser ? 'Complete Setup' : 'Save Profile'}
                  </>
                )}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfileEditWizard;
