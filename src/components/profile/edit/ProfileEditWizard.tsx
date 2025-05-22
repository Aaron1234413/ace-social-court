
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { ProfileData } from './ProfileEditContainer';
import { WizardBasicInfo } from './wizard-steps/WizardBasicInfo';
import { WizardPlayingInfo } from './wizard-steps/WizardPlayingInfo';
import { WizardLocationInfo } from './wizard-steps/WizardLocationInfo';
import { WizardAchievements } from './wizard-steps/WizardAchievements';
import { WizardCertifications } from './wizard-steps/WizardCertifications';
import { profileSchema, ProfileFormValues } from './profileSchema';
import { WizardProgress } from './wizard-components/WizardProgress';
import { ValidationMessage } from './wizard-components/ValidationMessage';
import { WizardNavigation } from './wizard-components/WizardNavigation';
import { useProfileData } from './hooks/useProfileData';
import { useWizardState } from './hooks/useWizardState';
import { useLocationState } from './hooks/useLocationState';
import { useProfileSubmit } from './hooks/useProfileSubmit';

interface ProfileEditWizardProps {
  isNewUser: boolean;
  profileData: ProfileData | null;
}

export const ProfileEditWizard = ({ isNewUser, profileData }: ProfileEditWizardProps) => {
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

  // Get user type for conditional rendering
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

  // Initialize custom hooks
  const { locationName, setLocationName, isLocationPickerOpen, setIsLocationPickerOpen, handleSetLocation } = useLocationState(form);
  const { validationMessage, isSaving, onSubmit } = useProfileSubmit(form, isNewUser);
  const { currentStep, activeSteps, progressPercentage, isLastStep, handleNext, handlePrevious } = useWizardState(steps, form);
  useProfileData(form, profileData, setLocationName);

  // Get current step component
  const CurrentStepComponent = activeSteps[currentStep]?.component;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Progress indicator */}
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={activeSteps.length}
        currentStepLabel={activeSteps[currentStep]?.label}
        progressPercentage={progressPercentage}
      />

      <ValidationMessage message={validationMessage} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
          {/* Current step component */}
          <div className="my-6">
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
          <WizardNavigation 
            currentStep={currentStep}
            totalSteps={activeSteps.length}
            isLastStep={isLastStep}
            isSaving={isSaving}
            isNewUser={isNewUser}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </form>
      </Form>
    </div>
  );
};

export default ProfileEditWizard;
