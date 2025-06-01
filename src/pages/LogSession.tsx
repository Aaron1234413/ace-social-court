
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PhysicalTracker from '@/components/logging/session/PhysicalTracker';
import MentalTracker from '@/components/logging/session/MentalTracker';
import TechnicalTracker from '@/components/logging/session/TechnicalTracker';
import { SessionSummary } from '@/components/logging/session/SessionSummary';
import { PillarData, PILLARS_CONFIG } from '@/types/logging';

type LoggingStep = 'pillar-selection' | 'physical' | 'mental' | 'technical' | 'summary';

export default function LogSession() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<LoggingStep>('pillar-selection');
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);
  const [pillarData, setPillarData] = useState<PillarData>({});
  const [aiSuggestionsUsed, setAiSuggestionsUsed] = useState(false);

  const handlePillarSelect = (pillar: string) => {
    setSelectedPillars(prev => 
      prev.includes(pillar) 
        ? prev.filter(p => p !== pillar)
        : [...prev, pillar]
    );
  };

  const handleStartLogging = () => {
    if (selectedPillars.length === 0) return;
    setCurrentStep(selectedPillars[0] as LoggingStep);
  };

  const handlePillarComplete = (pillar: string, data: any) => {
    setPillarData(prev => ({ ...prev, [pillar]: data }));
    
    const currentIndex = selectedPillars.indexOf(pillar);
    const nextPillar = selectedPillars[currentIndex + 1];
    
    if (nextPillar) {
      setCurrentStep(nextPillar as LoggingStep);
    } else {
      setCurrentStep('summary');
    }
  };

  const handleEditPillar = (pillar: string) => {
    setCurrentStep(pillar as LoggingStep);
  };

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  if (currentStep === 'pillar-selection') {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Log Training Session</h1>
          <p className="text-gray-600">Select the areas you want to track for this session</p>
        </div>

        <div className="space-y-4 mb-8">
          {Object.entries(PILLARS_CONFIG).map(([key, config]) => (
            <div
              key={key}
              onClick={() => handlePillarSelect(key)}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPillars.includes(key)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{config.emoji}</span>
                <div>
                  <h3 className="font-bold text-lg">{config.title}</h3>
                  <p className="text-gray-600 text-sm">
                    Track your {key} performance and progress
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleStartLogging}
          disabled={selectedPillars.length === 0}
          className="w-full"
          size="lg"
        >
          Start Logging Session
        </Button>
      </div>
    );
  }

  if (currentStep === 'physical') {
    return (
      <PhysicalTracker
        onDataChange={(data) => handlePillarComplete('physical', data)}
        initialData={pillarData.physical}
        onBack={() => setCurrentStep('pillar-selection')}
      />
    );
  }

  if (currentStep === 'mental') {
    return (
      <MentalTracker
        onDataChange={(data) => handlePillarComplete('mental', data)}
        initialData={pillarData.mental}
        onBack={() => setCurrentStep('pillar-selection')}
      />
    );
  }

  if (currentStep === 'technical') {
    return (
      <TechnicalTracker
        onDataChange={(data) => handlePillarComplete('technical', data)}
        initialData={pillarData.technical}
        onBack={() => setCurrentStep('pillar-selection')}
        onAISuggestionUsed={() => setAiSuggestionsUsed(true)}
      />
    );
  }

  if (currentStep === 'summary') {
    return (
      <SessionSummary
        pillarData={pillarData}
        selectedPillars={selectedPillars}
        aiSuggestionsUsed={aiSuggestionsUsed}
        onBack={() => setCurrentStep('pillar-selection')}
        onEdit={handleEditPillar}
        onSuccess={handleSuccess}
      />
    );
  }

  return null;
}
