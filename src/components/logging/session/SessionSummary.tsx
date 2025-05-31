
import React, { useState } from 'react';
import { useSessionSubmit } from '@/hooks/use-session-submit';
import { SessionFormValues } from './sessionSchema';
import SessionOverview from './summary/SessionOverview';
import PillarSummaryCard from './summary/PillarSummaryCard';
import PhysicalSummary from './summary/PhysicalSummary';
import MentalSummary from './summary/MentalSummary';
import TechnicalSummary from './summary/TechnicalSummary';
import SessionActions from './summary/SessionActions';

interface PillarData {
  physical?: {
    energyLevel: string;
    courtCoverage: number;
    endurance: number;
    strengthFeeling: number;
    notes: string;
  };
  mental?: {
    emotionEmoji: string;
    confidence: number;
    motivation: number;
    anxiety: number;
    focus: number;
    reflection: string;
  };
  technical?: {
    selectedStrokes: Record<string, any>;
    notes: string;
    drillSuggestions: string[];
  };
}

interface SessionSummaryProps {
  pillarData: PillarData;
  selectedPillars: string[];
  aiSuggestionsUsed: boolean;
  onBack: () => void;
  onEdit: (pillar: string) => void;
  onSuccess: () => void;
}

const pillarsConfig = {
  physical: {
    title: 'PHYSICAL',
    emoji: '💪',
    gradient: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50'
  },
  mental: {
    title: 'MENTAL', 
    emoji: '🧠',
    gradient: 'from-blue-500 to-purple-500',
    bgGradient: 'from-blue-50 to-purple-50'
  },
  technical: {
    title: 'TECHNICAL',
    emoji: '🎾', 
    gradient: 'from-green-500 to-teal-500',
    bgGradient: 'from-green-50 to-teal-50'
  }
};

const energyOptions = {
  strong: { emoji: '💪', label: 'Strong' },
  intense: { emoji: '🔥', label: 'Intense' },
  drained: { emoji: '😫', label: 'Drained' },
  neutral: { emoji: '😐', label: 'Neutral' }
};

const emotionOptions = {
  focused: { emoji: '🎯', label: 'Focused' },
  determined: { emoji: '😤', label: 'Determined' },
  anxious: { emoji: '😰', label: 'Anxious' },
  happy: { emoji: '😊', label: 'Happy' },
  fired_up: { emoji: '🔥', label: 'Fired Up' }
};

export default function SessionSummary({ 
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

  const handleSubmit = async () => {
    try {
      // Convert pillar data to session format with proper structure
      const sessionData: SessionFormValues = {
        session_date: new Date(),
        focus_areas: selectedPillars,
        drills: [],
        next_steps: [],
        session_note: generateSessionNote(),
        participants: [],
        reminder_date: undefined,
        coach_id: undefined,
        // Pass the structured pillar data to be stored in JSONB columns
        physical_data: pillarData.physical || undefined,
        mental_data: pillarData.mental || undefined,
        technical_data: pillarData.technical || undefined,
        ai_suggestions_used: aiSuggestionsUsed
      };

      // Add technical drills if available
      if (pillarData.technical?.drillSuggestions?.length) {
        sessionData.drills = pillarData.technical.drillSuggestions.map(drill => ({
          name: drill,
          notes: 'AI suggested drill'
        }));
      }

      await submitSession(sessionData);
      onSuccess();
    } catch (error) {
      console.error('Error submitting session:', error);
    }
  };

  const generateSessionNote = () => {
    let note = `Session logged with ${selectedPillars.join(', ')} tracking.\n\n`;
    
    if (pillarData.physical) {
      const energy = energyOptions[pillarData.physical.energyLevel as keyof typeof energyOptions];
      note += `Physical: Felt ${energy?.label || 'N/A'} with ${pillarData.physical.courtCoverage}/10 court coverage.\n`;
      if (pillarData.physical.notes) note += `Physical notes: ${pillarData.physical.notes}\n\n`;
    }
    
    if (pillarData.mental) {
      const emotion = emotionOptions[pillarData.mental.emotionEmoji as keyof typeof emotionOptions];
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Session Summary</h2>
        <p className="text-gray-600">Review your session before submitting</p>
      </div>

      {/* Session Overview */}
      <SessionOverview
        selectedPillars={selectedPillars}
        aiSuggestionsUsed={aiSuggestionsUsed}
        pillarsConfig={pillarsConfig}
      />

      {/* Pillar Details */}
      {selectedPillars.map((pillar) => {
        const config = pillarsConfig[pillar as keyof typeof pillarsConfig];
        const data = pillarData[pillar as keyof PillarData];
        
        return (
          <PillarSummaryCard
            key={pillar}
            pillar={pillar}
            config={config}
            isExpanded={expandedSections[pillar]}
            onToggleExpand={() => toggleSection(pillar)}
            onEdit={() => onEdit(pillar)}
          >
            {pillar === 'physical' && data && (
              <PhysicalSummary data={data as PillarData['physical']!} isExpanded={expandedSections[pillar]} />
            )}
            {pillar === 'mental' && data && (
              <MentalSummary data={data as PillarData['mental']!} isExpanded={expandedSections[pillar]} />
            )}
            {pillar === 'technical' && data && (
              <TechnicalSummary data={data as PillarData['technical']!} isExpanded={expandedSections[pillar]} />
            )}
          </PillarSummaryCard>
        );
      })}

      {/* Action Buttons */}
      <SessionActions
        onBack={onBack}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
