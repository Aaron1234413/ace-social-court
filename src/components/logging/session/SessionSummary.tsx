
import React, { useState } from 'react';
import { useSessionSubmit } from '@/hooks/use-session-submit';
import { SessionFormValues } from './sessionSchema';
import SessionOverview from './summary/SessionOverview';
import PillarSummaryCard from './summary/PillarSummaryCard';
import PhysicalSummary from './summary/PhysicalSummary';
import MentalSummary from './summary/MentalSummary';
import TechnicalSummary from './summary/TechnicalSummary';
import SessionActions from './summary/SessionActions';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PillarData, 
  PhysicalData,
  MentalData,
  TechnicalData,
  ENERGY_OPTIONS, 
  EMOTION_OPTIONS, 
  PILLARS_CONFIG,
  type EnergyType,
  type EmotionType
} from '@/types/logging';

interface SessionSummaryProps {
  pillarData: PillarData;
  selectedPillars: string[];
  aiSuggestionsUsed: boolean;
  onBack: () => void;
  onEdit: (pillar: string) => void;
  onSuccess: () => void;
}

export function SessionSummary({ 
  pillarData, 
  selectedPillars, 
  aiSuggestionsUsed,
  onBack, 
  onEdit,
  onSuccess 
}: SessionSummaryProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const { submitSession, isSubmitting } = useSessionSubmit();

  const toggleSection = (pillar: string) => {
    setExpandedSections(prev => ({ ...prev, [pillar]: !prev[pillar] }));
  };

  const validatePillarData = () => {
    console.log('Validating pillar data:', { pillarData, selectedPillars });
    
    const validationErrors: string[] = [];
    
    for (const pillar of selectedPillars) {
      if (pillar === 'physical') {
        const data = pillarData.physical;
        if (!data) {
          validationErrors.push('Missing data for physical pillar');
          continue;
        }
        if (!data.energyLevel) {
          validationErrors.push('Physical pillar requires energy level selection');
        }
        if (!data.courtCoverage) {
          validationErrors.push('Physical pillar requires court coverage rating');
        }
      }
      
      if (pillar === 'mental') {
        const data = pillarData.mental;
        if (!data) {
          validationErrors.push('Missing data for mental pillar');
          continue;
        }
        if (!data.emotionEmoji) {
          validationErrors.push('Mental pillar requires emotion selection');
        }
        if (!data.confidence) {
          validationErrors.push('Mental pillar requires confidence rating');
        }
      }
      
      if (pillar === 'technical') {
        const data = pillarData.technical;
        if (!data) {
          validationErrors.push('Missing data for technical pillar');
          continue;
        }
        if (!data.selectedStrokes || Object.keys(data.selectedStrokes).length === 0) {
          validationErrors.push('Technical pillar requires at least one stroke selection');
        }
      }
    }
    
    return validationErrors;
  };

  const handleSubmit = async () => {
    try {
      console.log('Starting session submission...');
      
      const validationErrors = validatePillarData();
      if (validationErrors.length > 0) {
        console.error('Validation failed:', validationErrors);
        return;
      }

      const sessionData: SessionFormValues = {
        session_date: new Date(),
        focus_areas: selectedPillars,
        drills: [],
        next_steps: [],
        session_note: generateSessionNote(),
        participants: [],
        reminder_date: undefined,
        coach_id: undefined,
        physical_data: pillarData.physical || undefined,
        mental_data: pillarData.mental || undefined,
        technical_data: pillarData.technical || undefined,
        ai_suggestions_used: aiSuggestionsUsed
      };

      if (pillarData.technical?.drillSuggestions?.length) {
        sessionData.drills = pillarData.technical.drillSuggestions.map(drill => ({
          name: drill,
          notes: 'AI suggested drill'
        }));
      }

      console.log('Submitting session data:', sessionData);
      await submitSession(sessionData);
      console.log('Session submitted successfully');
      onSuccess();
    } catch (error) {
      console.error('Error submitting session:', error);
    }
  };

  const generateSessionNote = () => {
    let note = `Session logged with ${selectedPillars.join(', ')} tracking.\n\n`;
    
    if (pillarData.physical) {
      const energy = ENERGY_OPTIONS[pillarData.physical.energyLevel as EnergyType];
      note += `Physical: Felt ${energy?.label || 'N/A'} with ${pillarData.physical.courtCoverage}/10 court coverage.\n`;
      if (pillarData.physical.notes) note += `Physical notes: ${pillarData.physical.notes}\n\n`;
    }
    
    if (pillarData.mental) {
      const emotion = EMOTION_OPTIONS[pillarData.mental.emotionEmoji as EmotionType];
      note += `Mental: ${emotion?.label || 'N/A'} state with ${pillarData.mental.confidence}/10 confidence.\n`;
      if (pillarData.mental.reflection) note += `Mental reflection: ${pillarData.mental.reflection}\n\n`;
    }
    
    if (pillarData.technical) {
      const strokes = Object.keys(pillarData.technical.selectedStrokes || {});
      note += `Technical: Worked on ${strokes.join(', ')}.\n`;
      if (pillarData.technical.notes) note += `Technical notes: ${pillarData.technical.notes}\n\n`;
    }
    
    if (aiSuggestionsUsed) {
      note += `AI suggestions were used during this session.`;
    }
    
    return note;
  };

  const validationErrors = validatePillarData();
  const canSubmit = validationErrors.length === 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Session Summary</h2>
        <p className="text-gray-600">Review your session before submitting</p>
        
        {/* Validation Status */}
        {canSubmit ? (
          <div className="flex items-center justify-center gap-2 mt-4 px-4 py-2 bg-green-100 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Ready to submit</span>
          </div>
        ) : (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Please complete all required fields before submitting
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Session Overview */}
      <SessionOverview
        selectedPillars={selectedPillars}
        aiSuggestionsUsed={aiSuggestionsUsed}
        pillarsConfig={PILLARS_CONFIG}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Pillar Details */}
      {selectedPillars.map((pillar) => {
        const config = PILLARS_CONFIG[pillar as keyof typeof PILLARS_CONFIG];
        
        if (pillar === 'physical' && pillarData.physical) {
          return (
            <PillarSummaryCard
              key={pillar}
              pillar={pillar}
              config={config}
              isExpanded={expandedSections[pillar]}
              onToggleExpand={() => toggleSection(pillar)}
              onEdit={() => onEdit(pillar)}
            >
              <PhysicalSummary 
                data={pillarData.physical} 
                isExpanded={expandedSections[pillar]} 
              />
            </PillarSummaryCard>
          );
        }
        
        if (pillar === 'mental' && pillarData.mental) {
          return (
            <PillarSummaryCard
              key={pillar}
              pillar={pillar}
              config={config}
              isExpanded={expandedSections[pillar]}
              onToggleExpand={() => toggleSection(pillar)}
              onEdit={() => onEdit(pillar)}
            >
              <MentalSummary 
                data={pillarData.mental} 
                isExpanded={expandedSections[pillar]} 
              />
            </PillarSummaryCard>
          );
        }
        
        if (pillar === 'technical' && pillarData.technical) {
          return (
            <PillarSummaryCard
              key={pillar}
              pillar={pillar}
              config={config}
              isExpanded={expandedSections[pillar]}
              onToggleExpand={() => toggleSection(pillar)}
              onEdit={() => onEdit(pillar)}
            >
              <TechnicalSummary 
                data={pillarData.technical} 
                isExpanded={expandedSections[pillar]} 
              />
            </PillarSummaryCard>
          );
        }
        
        console.warn(`No data found for pillar: ${pillar}`);
        return null;
      })}

      {/* Action Buttons */}
      <SessionActions
        onBack={onBack}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />
    </div>
  );
}
