import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../profileSchema';
import { toast } from 'sonner';

interface Step {
  label: string;
  component: React.ComponentType<any>;
  condition?: (values: ProfileFormValues) => boolean;
}

export const useWizardState = (steps: Step[], form: UseFormReturn<ProfileFormValues>) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Filter steps based on conditions
  const activeSteps = steps.filter(step => 
    !step.condition || step.condition(form.getValues())
  );
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / activeSteps.length) * 100;
  
  // Check if the current step is valid before proceeding
  const validateCurrentStep = async () => {
    let isValid = true;
    
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

  return {
    currentStep,
    activeSteps,
    progressPercentage,
    isLastStep: currentStep === activeSteps.length - 1,
    handleNext,
    handlePrevious
  };
};
