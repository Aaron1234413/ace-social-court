
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
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{currentStepLabel}</span>
      </div>
      <Progress value={progressPercentage} />
    </div>
  );
};
