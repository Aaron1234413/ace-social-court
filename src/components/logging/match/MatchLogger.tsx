import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useMatchSubmit } from '@/hooks/use-match-submit';
import { MatchAutoPostIntegration } from './MatchAutoPostIntegration';

// Import step components
import MatchOverviewStep from './steps/MatchOverviewStep';
import MatchBasicsStep from './steps/MatchBasicsStep';
import MatchPerformanceStep from './steps/MatchPerformanceStep';
import MatchHighlightsStep from './steps/MatchHighlightsStep';
import MatchMentalStateStep from './steps/MatchMentalStateStep';
import MatchReflectionStep from './steps/MatchReflectionStep';
import MatchSummaryStep from './steps/MatchSummaryStep';
import MatchRecapCard from './MatchRecapCard';

// Enhanced match data interface
export interface MatchData {
  // Match overview
  match_type?: 'singles' | 'doubles';
  match_outcome?: 'won' | 'lost' | 'tie';
  partner_name?: string;
  opponents_names?: string;
  
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
  
  // Mental state and performance
  energy_emoji?: string;
  focus_emoji?: string;
  emotion_emoji?: string;
  tags?: string[];
  
  // Reflection and notes
  reflection_note?: string;
  
  // Coach integration
  coach_id?: string;
  notify_coach?: boolean;
}

const STEPS = [
  { id: 'overview', title: 'Match Overview', emoji: '🎾' },
  { id: 'basics', title: 'Match Details', emoji: '📋' },
  { id: 'performance', title: 'Performance', emoji: '🧠' },
  { id: 'highlights', title: 'Key Moments', emoji: '⭐' },
  { id: 'mental', title: 'Mental State', emoji: '💭' },
  { id: 'reflection', title: 'Reflection', emoji: '📝' },
  { id: 'summary', title: 'Summary', emoji: '✅' }
];

export default function MatchLogger() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { submitMatch, isSubmitting } = useMatchSubmit();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [showRecapCard, setShowRecapCard] = useState(false);
  const [showAutoPost, setShowAutoPost] = useState(false);
  const [submittedMatch, setSubmittedMatch] = useState<any>(null);
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
    0: false, // overview - requires match_type and match_outcome only
    1: false, // basics - requires opponent_name, location, surface, score
    2: true,  // performance - always valid (has defaults)
    3: true,  // highlights (optional)
    4: true,  // mental (optional)
    5: true,  // reflection (optional)
    6: true   // summary (always valid)
  });

  const updateMatchData = useCallback((updates: Partial<MatchData>) => {
    console.log('Updating match data:', updates);
    setMatchData(prev => {
      const newData = { ...prev, ...updates };
      console.log('New match data:', newData);
      return newData;
    });
  }, []);

  const updateStepValidation = useCallback((step: number, isValid: boolean) => {
    console.log(`Step ${step} validation:`, isValid);
    setStepValidation(prev => ({ ...prev, [step]: isValid }));
  }, []);

  const canProceed = stepValidation[currentStep] || currentStep === STEPS.length - 1;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const goToNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed) {
      console.log(`Moving from step ${currentStep} to ${currentStep + 1}`);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 0) {
      console.log(`Moving from step ${currentStep} to ${currentStep - 1}`);
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    console.log(`Jumping to step ${stepIndex}`);
    setCurrentStep(stepIndex);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to log a match");
      return;
    }

    console.log('Starting match submission with data:', matchData);

    try {
      // Show recap card first
      setShowRecapCard(true);
      
      // Submit the match
      const submittedMatchResult = await submitMatch(matchData);
      console.log('Match submitted successfully:', submittedMatchResult);
      
      setSubmittedMatch(submittedMatchResult);
      
      // Hide recap card and show auto-post integration
      setTimeout(() => {
        setShowRecapCard(false);
        setShowAutoPost(true);
      }, 2000);
      
    } catch (error) {
      console.error("Error logging match:", error);
      setShowRecapCard(false);
      toast.error("Failed to log match. Please try again.");
    }
  };

  const handlePostCreated = () => {
    console.log('Post created successfully');
    setShowAutoPost(false);
    toast.success("Match logged and shared successfully!");
    navigate('/dashboard');
  };

  const handleSkipPost = () => {
    console.log('Skipping post creation');
    setShowAutoPost(false);
    toast.success("Match logged successfully!");
    navigate('/dashboard');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <MatchOverviewStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(0, isValid)}
          />
        );
      case 1:
        return (
          <MatchBasicsStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(1, isValid)}
          />
        );
      case 2:
        return (
          <MatchPerformanceStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(2, isValid)}
          />
        );
      case 3:
        return (
          <MatchHighlightsStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(3, isValid)}
          />
        );
      case 4:
        return (
          <MatchMentalStateStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(4, isValid)}
          />
        );
      case 5:
        return (
          <MatchReflectionStep
            data={matchData}
            onDataChange={updateMatchData}
            onValidationChange={(isValid) => updateStepValidation(5, isValid)}
          />
        );
      case 6:
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

  // Show auto-post integration after successful submission
  if (showAutoPost && submittedMatch) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="gap-1 mb-4"
            onClick={handleSkipPost}
          >
            <ArrowLeft className="h-4 w-4" />
            Skip Sharing
          </Button>
          <h1 className="text-3xl font-bold">Share Your Match</h1>
          <p className="text-muted-foreground mt-2">
            Your match has been logged! Would you like to share it with the community?
          </p>
        </div>

        <MatchAutoPostIntegration 
          matchData={matchData}
          onPostCreated={handlePostCreated}
        />

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={handleSkipPost}>
            Skip and Continue to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
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
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Match"}
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Floating Recap Card */}
      <MatchRecapCard 
        matchData={matchData}
        isVisible={showRecapCard}
        onClose={() => setShowRecapCard(false)}
      />
    </>
  );
}
