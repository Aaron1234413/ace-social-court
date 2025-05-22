
import { Progress } from '@/components/ui/progress';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  currentStepLabel: string;
  progressPercentage: number;
}

export const WizardProgress = ({
  currentStep,
  totalSteps,
  currentStepLabel,
  progressPercentage
}: WizardProgressProps) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-medium mb-2">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span className="text-primary">{currentStepLabel}</span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
    </div>
  );
};
