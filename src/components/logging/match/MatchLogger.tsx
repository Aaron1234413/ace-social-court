
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useMatchSubmit } from '@/hooks/use-match-submit';

// Import step components
import MatchBasicsStep from './steps/MatchBasicsStep';
import MatchPerformanceStep from './steps/MatchPerformanceStep';
import MatchHighlightsStep from './steps/MatchHighlightsStep';
import MatchMentalStateStep from './steps/MatchMentalStateStep';
import MatchReflectionStep from './steps/MatchReflectionStep';
import MatchSummaryStep from './steps/MatchSummaryStep';

// Enhanced match data interface
export interface MatchData {
  // Basic match info
  match_date: Date;
  opponent_id?: string;
  opponent_name?: string;
  location?: string;
  surface?: 'hard' | 'clay' | 'grass' | 'other';
  score?: string;
  
  // Performance ratings
  serve_rating?: number;
  return_rating?: number;
  endurance_rating?: number;
  
  // Highlights
  highlights?: Array<{
    type: 'ace' | 'winner' | 'breakpoint' | 'error';
    note?: string;
    timestamp?: number;
  }>;
  
  // Mental state
  energy_emoji?: string;
  focus_emoji?: string;
  emotion_emoji?: string;
  
  // Reflection and notes
  reflection_note?: string;
  tags?: string[];
  
  // Coach integration
  coach_id?: string;
  notify_coach?: boolean;
  
  // Media
  media_url?: string;
  media_type?: string;
}

const STEPS = [
  { id: 'basics', title: 'Match Basics', emoji: '🎾' },
  { id: 'performance', title: 'Performance', emoji: '📊' },
  { id: 'highlights', title: 'Key Moments', emoji: '⭐' },
  { id: 'mental', title: 'Mental State', emoji: '🧠' },
  { id: 'reflection', title: 'Reflection', emoji: '💭' },
  { id: 'summary', title: 'Summary', emoji: '✅' }
];

export default function MatchLogger() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitMatch, isSubmitting } = useMatchSubmit();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [matchData, setMatchData] = useState<MatchData>({
    match_date: new Date(),
    serve_rating: 3,
    return_rating: 3,
    endurance_rating: 3,
    highlights: [],
    tags: [],
    notify_coach: false
  });

  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({
    0: false, // basics
    1: false, // performance  
    2: true,  // highlights (optional)
    3: false, // mental
    4: true,  // reflection (optional)
    5: true   // summary (always valid)
  });

  const updateMatchData = useCallback((updates: Partial<MatchData>) => {
    setMatchData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStepValidation = useCallback((step: number, isValid: boolean) => {
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
  }, []);

  const canProceed = stepValidation[currentStep] || currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goToNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to log a match");
      return;
    }

    try {
      console.log('Submitting match data:', matchData);
      await submitMatch(matchData);
      toast.success("Match logged successfully!");
      navigate('/dashboard');
    } catch (error) {
      console.error("Error logging match:", error);
      toast.error("Failed to log match. Please try again.");
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <MatchBasicsStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(0, isValid)}
          />
        );
      case 1:
        return (
          <MatchPerformanceStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(1, isValid)}
          />
        );
      case 2:
        return (
          <MatchHighlightsStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(2, isValid)}
          />
        );
      case 3:
        return (
          <MatchMentalStateStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(3, isValid)}
          />
        );
      case 4:
        return (
          <MatchReflectionStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(4, isValid)}
          />
        );
      case 5:
        return (
          <MatchSummaryStep
            data={matchData}
            onEdit={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="gap-1 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Log a Match</h1>
        <p className="text-muted-foreground mt-2">
          Record your tennis match with detailed tracking and insights
        </p>
      </div>

      {/* Progress Section */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Match Logging Progress</CardTitle>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STEPS.map((step, index) => (
              <Button
                key={step.id}
                variant={index === currentStep ? "default" : index < currentStep ? "secondary" : "outline"}
                size="sm"
                onClick={() => goToStep(index)}
                className={`flex items-center gap-2 ${
                  index <= currentStep ? 'opacity-100' : 'opacity-50'
                }`}
                disabled={index > currentStep + 1}
              >
                <span>{step.emoji}</span>
                <span className="hidden sm:inline">{step.title}</span>
                {index < currentStep && <Check className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">{STEPS[currentStep].emoji}</span>
            <div>
              <h2 className="text-xl">{STEPS[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                Step {currentStep + 1} of {STEPS.length}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentStep === 0}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {!canProceed && currentStep < STEPS.length - 1 && (
            <span className="text-sm text-muted-foreground">
              Complete required fields to continue
            </span>
          )}
        </div>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={goToNext}
            disabled={!canProceed}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? "Saving..." : "Save Match"}
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
