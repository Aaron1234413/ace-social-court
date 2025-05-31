
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit2, CheckCircle2, Upload, Eye, EyeOff } from 'lucide-react';
import { useSessionSubmit } from '@/hooks/use-session-submit';
import { SessionFormValues } from './sessionSchema';

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

  const renderPhysicalSummary = (data: PillarData['physical']) => {
    if (!data) return null;
    
    const energy = energyOptions[data.energyLevel as keyof typeof energyOptions];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{energy?.emoji}</span>
          <div>
            <p className="font-medium">{energy?.label} Energy</p>
            <p className="text-sm text-gray-600">Court Coverage: {data.courtCoverage}/10</p>
          </div>
        </div>
        
        {expandedSections.physical && (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Endurance: {data.endurance}/10</div>
              <div>Strength: {data.strengthFeeling}/10</div>
            </div>
            {data.notes && (
              <div className="text-sm">
                <span className="font-medium">Notes: </span>
                <span>{data.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMentalSummary = (data: PillarData['mental']) => {
    if (!data) return null;
    
    const emotion = emotionOptions[data.emotionEmoji as keyof typeof emotionOptions];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emotion?.emoji}</span>
          <div>
            <p className="font-medium">{emotion?.label} State</p>
            <p className="text-sm text-gray-600">Confidence: {data.confidence}/10</p>
          </div>
        </div>
        
        {expandedSections.mental && (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Motivation: {data.motivation}/10</div>
              <div>Focus: {data.focus}/10</div>
              <div>Anxiety: {data.anxiety}/10</div>
            </div>
            {data.reflection && (
              <div className="text-sm">
                <span className="font-medium">Reflection: </span>
                <span>{data.reflection}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTechnicalSummary = (data: PillarData['technical']) => {
    if (!data) return null;
    
    const strokes = Object.keys(data.selectedStrokes || {});
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎾</span>
          <div>
            <p className="font-medium">Strokes Practiced</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {strokes.slice(0, 3).map((stroke) => (
                <Badge key={stroke} variant="secondary" className="text-xs">
                  {stroke}
                </Badge>
              ))}
              {strokes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{strokes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {expandedSections.technical && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm">
              <span className="font-medium">All Strokes: </span>
              <span>{strokes.join(', ')}</span>
            </div>
            {data.drillSuggestions?.length > 0 && (
              <div className="text-sm">
                <span className="font-medium">Drill Suggestions: </span>
                <span>{data.drillSuggestions.join(', ')}</span>
              </div>
            )}
            {data.notes && (
              <div className="text-sm">
                <span className="font-medium">Notes: </span>
                <span>{data.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Session Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Pillars Tracked</p>
              <div className="flex gap-2 mt-1">
                {selectedPillars.map((pillar) => {
                  const config = pillarsConfig[pillar as keyof typeof pillarsConfig];
                  return (
                    <Badge key={pillar} className={`bg-gradient-to-r ${config.gradient} text-white`}>
                      {config.emoji} {config.title}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          {aiSuggestionsUsed && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
              <span>🤖</span>
              <span>AI suggestions were used during this session</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pillar Details */}
      {selectedPillars.map((pillar) => {
        const config = pillarsConfig[pillar as keyof typeof pillarsConfig];
        const data = pillarData[pillar as keyof PillarData];
        
        return (
          <Card key={pillar} className={`bg-gradient-to-r ${config.bgGradient} border-l-4 border-l-orange-500`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{config.emoji}</span>
                  {config.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection(pillar)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedSections[pillar] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(pillar)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pillar === 'physical' && renderPhysicalSummary(data as PillarData['physical'])}
              {pillar === 'mental' && renderMentalSummary(data as PillarData['mental'])}
              {pillar === 'technical' && renderTechnicalSummary(data as PillarData['technical'])}
            </CardContent>
          </Card>
        );
      })}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Pillars
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center gap-2 px-8"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Submit Session
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
