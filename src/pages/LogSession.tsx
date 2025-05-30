
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';
import PhysicalTracker from '@/components/logging/session/PhysicalTracker';
import MentalTracker from '@/components/logging/session/MentalTracker';

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

  const handlePhysicalDataChange = (data: any) => {
    setPillarData(prev => ({ ...prev, physical: data }));
  };

  const handleMentalDataChange = (data: any) => {
    setPillarData(prev => ({ ...prev, mental: data }));
  };

  // Handle Physical Tracker Step
  if (currentStep === 'physical') {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={goBackToSelection}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pillar Selection
          </Button>
          
          <PhysicalTracker 
            onDataChange={handlePhysicalDataChange}
            initialData={pillarData.physical}
          />
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={goBackToSelection}
            >
              Back
            </Button>
            <Button
              onClick={() => handlePillarComplete('physical', pillarData.physical)}
              disabled={!pillarData.physical?.energyLevel}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
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
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={goBackToSelection}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pillar Selection
          </Button>
          
          <MentalTracker 
            onDataChange={handleMentalDataChange}
            initialData={pillarData.mental}
          />
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={goBackToSelection}
            >
              Back
            </Button>
            <Button
              onClick={() => handlePillarComplete('mental', pillarData.mental)}
              disabled={!pillarData.mental?.emotionEmoji}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
            >
              {selectedPillars.indexOf('mental') === selectedPillars.length - 1 ? 'Finish' : 'Next Pillar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle other pillar steps (placeholder for now)
  if (currentStep !== 'selection' && currentStep !== 'summary') {
    return (
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={goBackToSelection}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pillar Selection
          </Button>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {pillars.find(p => p.id === currentStep)?.emoji}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {pillars.find(p => p.id === currentStep)?.title} Tracker
            </h2>
            <p className="text-gray-600">
              Coming in the next step - {pillars.find(p => p.id === currentStep)?.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      {!user && <LoginPromptModal />}
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How did today's tennis go?
          </h1>
          <p className="text-lg text-gray-600">
            Choose which aspects you'd like to track from your session
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-center items-center space-x-4 mb-4">
            {pillars.map((pillar, index) => (
              <div key={pillar.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-300
                      ${isPillarSelected(pillar.id) 
                        ? isPillarCompleted(pillar.id)
                          ? 'bg-green-500 text-white'
                          : `bg-gradient-to-r ${pillar.gradient} text-white shadow-lg scale-110`
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {isPillarCompleted(pillar.id) ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      pillar.emoji
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isPillarSelected(pillar.id) ? 'text-gray-900' : 'text-gray-400'}`}>
                    {pillar.title}
                  </span>
                </div>
                {index < pillars.length - 1 && (
                  <div className={`w-8 h-1 mx-4 rounded-full transition-colors duration-300 ${
                    isPillarSelected(pillars[index + 1].id) ? 'bg-gray-300' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {selectedPillars.length > 0 && (
            <div className="text-center text-sm text-gray-600">
              {selectedPillars.length} pillar{selectedPillars.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Pillar Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pillars.map((pillar) => (
            <Card 
              key={pillar.id}
              className={`
                cursor-pointer transition-all duration-300 transform hover:scale-105 relative overflow-hidden
                ${isPillarSelected(pillar.id) 
                  ? `ring-4 ring-offset-2 shadow-2xl ${pillar.ringColor}` 
                  : 'hover:shadow-lg'
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
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="text-6xl mb-4 transform transition-transform duration-300 hover:scale-110">
                  {pillar.emoji}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {pillar.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="text-center relative z-10">
                <p className="text-gray-600 mb-6">
                  {pillar.description}
                </p>
                
                <div className={`
                  w-8 h-8 mx-auto rounded-full border-2 transition-all duration-300 flex items-center justify-center
                  ${isPillarSelected(pillar.id) 
                    ? 'border-white bg-gradient-to-r ' + pillar.gradient + ' text-white' 
                    : 'border-gray-300'
                  }
                `}>
                  {isPillarSelected(pillar.id) && (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={startLogging}
            disabled={selectedPillars.length === 0}
            size="lg"
            className={`
              px-12 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 transform
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
            <p className="text-sm text-gray-500 mt-4">
              You can always come back and edit your selections
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
