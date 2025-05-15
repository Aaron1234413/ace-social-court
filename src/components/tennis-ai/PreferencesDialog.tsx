
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OnboardingQuestionnaire } from "./OnboardingQuestionnaire";
import { toast } from "sonner";
import { useState } from "react";

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreferencesDialog({ open, onOpenChange }: PreferencesDialogProps) {
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const handleComplete = () => {
    setShowQuestionnaire(false);
    onOpenChange(false);
    toast.success("Your tennis preferences have been saved! The AI will now personalize its responses for you.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl">
        {!showQuestionnaire ? (
          <>
            <DialogHeader>
              <DialogTitle>Personalize Your Tennis AI Experience</DialogTitle>
              <DialogDescription>
                Help us tailor the Tennis AI to your specific needs and preferences.
                Answer a few questions to get personalized assistance, training plans,
                and technical advice.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                This information helps the AI understand your playing style, experience level,
                and goals to provide more relevant advice and recommendations.
              </p>
              <p className="text-sm text-muted-foreground">
                You can update your preferences at any time from your profile settings.
              </p>
            </div>
            <DialogFooter className="sm:justify-between">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Skip for now
              </Button>
              <Button onClick={() => setShowQuestionnaire(true)}>
                Start Questionnaire
              </Button>
            </DialogFooter>
          </>
        ) : (
          <OnboardingQuestionnaire onComplete={handleComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
}
