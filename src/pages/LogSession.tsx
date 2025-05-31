
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';
import PhysicalTracker from '@/components/logging/session/PhysicalTracker';
import MentalTracker from '@/components/logging/session/MentalTracker';
import TechnicalTracker from '@/components/logging/session/TechnicalTracker';
import SessionSummary from '@/components/logging/session/SessionSummary';
import { toast } from 'sonner';

type Pillar = 'physical' | 'mental' | 'technical';

interface PillarData {
  physical?: any;
  mental?: any;
  technical?: any;
}

export default function LogSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPillars, setSelectedPillars] = useState<Pillar[]>([]);
  const [completedPillars, setCompletedPillars] = useState<Pillar[]>([]);
  const [currentStep, setCurrentStep] = useState<'selection' | Pillar | 'summary'>('selection');
  const [pillarData, setPillarData] = useState<PillarData>({});
  const [aiSuggestionsUsed, setAiSuggestionsUsed] = useState(false);

  const pillars = [
    {
      id: 'physical' as Pillar,
      title: 'PHYSICAL',
      emoji: '💪',
      description: 'Energy, endurance, and court coverage',
      gradient: 'from-red-500 to-orange-500',
      ringColor: 'ring-orange-500'
    },
    {
      id: 'mental' as Pillar,
      title: 'MENTAL',
      emoji: '🧠',
      description: 'Focus, confidence, and mindset',
      gradient: 'from-blue-500 to-purple-500',
      ringColor: 'ring-purple-500'
    },
    {
      id: 'technical' as Pillar,
      title: 'TECHNICAL',
      emoji: '🎾',
      description: 'Strokes, technique, and skills',
      gradient: 'from-green-500 to-teal-500',
      ringColor: 'ring-teal-500'
    }
  ];

  const togglePillar = (pillar: Pillar) => {
    setSelectedPillars(prev => 
      prev.includes(pillar) 
        ? prev.filter(p => p !== pillar)
        : [...prev, pillar]
    );
  };

  const isPillarSelected = (pillar: Pillar) => selectedPillars.includes(pillar);
  const isPillarCompleted = (pillar: Pillar) => completedPillars.includes(pillar);

  const startLogging = () => {
    if (selectedPillars.length === 0) return;
    setCurrentStep(selectedPillars[0]);
  };

  const goBackToSelection = () => {
    setCurrentStep('selection');
  };

  const handlePillarComplete = (pillar: Pillar, data: any) => {
    setPillarData(prev => ({ ...prev, [pillar]: data }));
    
    if (!completedPillars.includes(pillar)) {
      setCompletedPillars(prev => [...prev, pillar]);
    }

    // Move to next pillar or summary
    const currentIndex = selectedPillars.indexOf(pillar);
    const nextPillar = selectedPillars[currentIndex + 1];
    
    if (nextPillar) {
      setCurrentStep(nextPillar);
    } else {
      setCurrentStep('summary');
    }
  };

  const handleEditPillar = (pillar: string) => {
    setCurrentStep(pillar as Pillar);
  };

  const handleSessionSuccess = () => {
    toast.success("Training session logged successfully!");
    navigate('/dashboard');
  };

  const handlePhysicalDataChange = (data: any) => {
    setPillarData(prev => ({ ...prev, physical: data }));
  };

  const handleMentalDataChange = (data: any) => {
    setPillarData(prev => ({ ...prev, mental: data }));
  };

  const handleTechnicalDataChange = (data: any) => {
    setPillarData(prev => ({ ...prev, technical: data }));
  };

  const handleAISuggestionUsed = () => {
    setAiSuggestionsUsed(true);
  };

  // Handle Session Summary Step
  if (currentStep === 'summary') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={goBackToSelection}
              className="mb-4 md:mb-6 h-12 px-4 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pillar Selection
            </Button>
            
            <SessionSummary
              pillarData={pillarData}
              selectedPillars={selectedPillars}
              aiSuggestionsUsed={aiSuggestionsUsed}
              onBack={goBackToSelection}
              onEdit={handleEditPillar}
              onSuccess={handleSessionSuccess}
            />
          </div>
        </div>
      </div>
    );
  }

  // Handle Physical Tracker Step
  if (currentStep === 'physical') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="container mx-auto py-4 md:py-6">
          <PhysicalTracker 
            onDataChange={handlePhysicalDataChange}
            initialData={pillarData.physical}
            onBack={goBackToSelection}
          />
          
          <div className="flex justify-between mt-6 md:mt-8 px-4 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              onClick={goBackToSelection}
              className="h-12 md:h-14 px-6 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => handlePillarComplete('physical', pillarData.physical)}
              disabled={!pillarData.physical?.energyLevel}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white h-12 md:h-14 px-6 shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation disabled:opacity-50"
            >
              {selectedPillars.indexOf('physical') === selectedPillars.length - 1 ? 'Finish' : 'Next Pillar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Mental Tracker Step
  if (currentStep === 'mental') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto py-4 md:py-6">
          <MentalTracker 
            onDataChange={handleMentalDataChange}
            initialData={pillarData.mental}
            onBack={goBackToSelection}
          />
          
          <div className="flex justify-between mt-6 md:mt-8 px-4 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              onClick={goBackToSelection}
              className="h-12 md:h-14 px-6 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => handlePillarComplete('mental', pillarData.mental)}
              disabled={!pillarData.mental?.emotionEmoji}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-12 md:h-14 px-6 shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation disabled:opacity-50"
            >
              {selectedPillars.indexOf('mental') === selectedPillars.length - 1 ? 'Finish' : 'Next Pillar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Technical Tracker Step
  if (currentStep === 'technical') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
        <div className="container mx-auto py-4 md:py-6">
          <TechnicalTracker 
            onDataChange={handleTechnicalDataChange}
            initialData={pillarData.technical}
            onBack={goBackToSelection}
          />
          
          <div className="flex justify-between mt-6 md:mt-8 px-4 max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              onClick={goBackToSelection}
              className="h-12 md:h-14 px-6 shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => handlePillarComplete('technical', pillarData.technical)}
              disabled={!pillarData.technical?.selectedStrokes || Object.keys(pillarData.technical.selectedStrokes).length === 0}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white h-12 md:h-14 px-6 shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation disabled:opacity-50"
            >
              {selectedPillars.indexOf('technical') === selectedPillars.length - 1 ? 'Finish' : 'Next Pillar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {!user && <LoginPromptModal />}
      
      <div className="container mx-auto py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
              How did today's tennis go?
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              Choose which aspects you'd like to track from your session
            </p>
          </div>

          {/* Progress Bar - Enhanced */}
          <div className="mb-8 md:mb-12">
            <div className="flex justify-center items-center space-x-2 md:space-x-4 mb-4">
              {pillars.map((pillar, index) => (
                <div key={pillar.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-300 shadow-md
                        ${isPillarSelected(pillar.id) 
                          ? isPillarCompleted(pillar.id)
                            ? 'bg-green-500 text-white shadow-lg'
                            : `bg-gradient-to-r ${pillar.gradient} text-white shadow-lg scale-110`
                          : 'bg-white text-gray-400 border-2 border-gray-200'
                        }
                      `}
                    >
                      {isPillarCompleted(pillar.id) ? (
                        <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                      ) : (
                        pillar.emoji
                      )}
                    </div>
                    <span className={`text-xs mt-1 md:mt-2 font-medium text-center ${isPillarSelected(pillar.id) ? 'text-gray-900' : 'text-gray-400'}`}>
                      {pillar.title}
                    </span>
                  </div>
                  {index < pillars.length - 1 && (
                    <div className={`w-6 md:w-8 h-1 mx-2 md:mx-4 rounded-full transition-colors duration-300 ${
                      isPillarSelected(pillars[index + 1].id) ? 'bg-gray-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {selectedPillars.length > 0 && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700">
                    {selectedPillars.length} pillar{selectedPillars.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Pillar Selection Cards - Mobile Optimized */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {pillars.map((pillar) => (
              <Card 
                key={pillar.id}
                className={`
                  cursor-pointer transition-all duration-300 transform hover:scale-105 relative overflow-hidden touch-manipulation shadow-lg
                  ${isPillarSelected(pillar.id) 
                    ? `ring-4 ring-offset-2 shadow-2xl ${pillar.ringColor}` 
                    : 'hover:shadow-xl'
                  }
                `}
                onClick={() => togglePillar(pillar.id)}
              >
                {/* Background Gradient Overlay */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 transition-opacity duration-300 ${
                    isPillarSelected(pillar.id) ? 'opacity-10' : 'hover:opacity-5'
                  }`}
                />
                
                <CardHeader className="text-center pb-3 md:pb-4 relative z-10">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4 transform transition-transform duration-300 hover:scale-110">
                    {pillar.emoji}
                  </div>
                  <CardTitle className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="text-center relative z-10 pb-6">
                  <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                    {pillar.description}
                  </p>
                  
                  <div className={`
                    w-6 h-6 md:w-8 md:h-8 mx-auto rounded-full border-2 transition-all duration-300 flex items-center justify-center
                    ${isPillarSelected(pillar.id) 
                      ? 'border-white bg-gradient-to-r ' + pillar.gradient + ' text-white' 
                      : 'border-gray-300'
                    }
                  `}>
                    {isPillarSelected(pillar.id) && (
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Continue Button - Mobile Optimized */}
          <div className="text-center">
            <Button
              onClick={startLogging}
              disabled={selectedPillars.length === 0}
              size="lg"
              className={`
                px-8 md:px-12 py-3 md:py-4 text-base md:text-lg font-semibold rounded-2xl transition-all duration-300 transform touch-manipulation h-14 md:h-16
                ${selectedPillars.length > 0 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl hover:scale-105 hover:shadow-2xl' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selectedPillars.length === 0 
                ? 'Select at least one pillar to continue'
                : `Start tracking ${selectedPillars.length} pillar${selectedPillars.length !== 1 ? 's' : ''}`
              }
            </Button>
            
            {selectedPillars.length > 0 && (
              <p className="text-xs md:text-sm text-gray-500 mt-3 md:mt-4">
                You can always come back and edit your selections
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
