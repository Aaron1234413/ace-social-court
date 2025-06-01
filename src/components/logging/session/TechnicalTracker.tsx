
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { TechnicalData } from '@/types/logging';
import { AIPromptHelper } from './AIPromptHelper';

interface TechnicalTrackerProps {
  onDataChange: (data: TechnicalData) => void;
  initialData?: Partial<TechnicalData>;
  onBack?: () => void;
  onAISuggestionUsed?: () => void;
}

const strokeOptions = [
  { name: 'Forehand', category: 'Groundstrokes' },
  { name: 'Backhand', category: 'Groundstrokes' },
  { name: 'Serve', category: 'Serve & Return' },
  { name: 'Return', category: 'Serve & Return' },
  { name: 'Volley', category: 'Net Play' },
  { name: 'Overhead', category: 'Net Play' },
  { name: 'Drop Shot', category: 'Specialty' },
  { name: 'Lob', category: 'Specialty' }
];

export default function TechnicalTracker({ 
  onDataChange, 
  initialData = {}, 
  onBack,
  onAISuggestionUsed 
}: TechnicalTrackerProps) {
  const [data, setData] = useState<TechnicalData>({
    selectedStrokes: initialData.selectedStrokes || {},
    notes: initialData.notes || '',
    drillSuggestions: initialData.drillSuggestions || []
  });

  const updateData = (updates: Partial<TechnicalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
  };

  const handleStrokeToggle = (strokeName: string) => {
    const newStrokes = { ...data.selectedStrokes };
    if (newStrokes[strokeName]) {
      delete newStrokes[strokeName];
    } else {
      newStrokes[strokeName] = { practiced: true, notes: '' };
    }
    updateData({ selectedStrokes: newStrokes });
  };

  const handleStrokeNotes = (strokeName: string, notes: string) => {
    const newStrokes = { ...data.selectedStrokes };
    if (newStrokes[strokeName]) {
      newStrokes[strokeName] = { ...newStrokes[strokeName], notes };
    }
    updateData({ selectedStrokes: newStrokes });
  };

  const handleComplete = () => {
    onDataChange(data);
  };

  const handleAISuggestion = (suggestion: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes} ${suggestion}` : suggestion;
    updateData({ notes: newNotes });
    onAISuggestionUsed?.();
  };

  const handleDrillSuggestion = (drill: string) => {
    const currentDrills = data.drillSuggestions || [];
    if (!currentDrills.includes(drill)) {
      updateData({ drillSuggestions: [...currentDrills, drill] });
    }
    onAISuggestionUsed?.();
  };

  const getTechnicalContext = () => {
    const selectedStrokes = Object.keys(data.selectedStrokes);
    return selectedStrokes.length > 0 
      ? `Working on ${selectedStrokes.join(', ')} during tennis practice`
      : 'Tennis technical training session';
  };

  const isValid = Object.keys(data.selectedStrokes).length > 0;
  const groupedStrokes = strokeOptions.reduce((acc, stroke) => {
    if (!acc[stroke.category]) {
      acc[stroke.category] = [];
    }
    acc[stroke.category].push(stroke);
    return acc;
  }, {} as Record<string, typeof strokeOptions>);

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4">
      {/* Header with Back Button */}
      <div className="text-center mb-8">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="absolute left-4 top-4 h-12 w-12 rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="text-6xl mb-4 animate-bounce">🎾</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Technical Tracker</h2>
        <p className="text-base text-gray-600">Which strokes did you work on during this session?</p>
      </div>

      {/* Stroke Selection */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-teal-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">🏸</span>
            Strokes Practiced
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedStrokes).map(([category, strokes]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-700 mb-3">{category}</h4>
              <div className="grid grid-cols-2 gap-3">
                {strokes.map((stroke) => (
                  <Button
                    key={stroke.name}
                    variant={data.selectedStrokes[stroke.name] ? "default" : "outline"}
                    className={`h-16 transition-all duration-300 ${
                      data.selectedStrokes[stroke.name]
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white scale-105 shadow-lg'
                        : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                    }`}
                    onClick={() => handleStrokeToggle(stroke.name)}
                  >
                    {stroke.name}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Selected Strokes Notes */}
      {Object.keys(data.selectedStrokes).length > 0 && (
        <Card className="shadow-lg border-0 bg-white/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">📝</span>
              Stroke Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.selectedStrokes).map(([strokeName, details]) => (
              <div key={strokeName} className="space-y-2">
                <h5 className="font-medium text-gray-800">{strokeName}</h5>
                <Textarea
                  placeholder={`Notes about your ${strokeName}...`}
                  value={details.notes || ''}
                  onChange={(e) => handleStrokeNotes(strokeName, e.target.value)}
                  className="min-h-[80px] text-sm resize-none shadow-sm border-2 focus:border-green-300 transition-colors"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="technical"
        context={getTechnicalContext()}
        onSuggestionSelect={handleAISuggestion}
        onDrillSuggestion={handleDrillSuggestion}
      />

      {/* Drill Suggestions */}
      {data.drillSuggestions && data.drillSuggestions.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/80 to-teal-50/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">🎯</span>
              AI Suggested Drills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.drillSuggestions.map((drill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1 text-sm bg-green-100 hover:bg-green-200">
                  {drill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Notes */}
      <Card className="shadow-lg border-0 bg-white/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Technical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional technical notes about your session..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[120px] text-base resize-none shadow-sm border-2 focus:border-green-300 transition-colors"
          />
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleComplete}
          disabled={!isValid}
          size="lg"
          className="w-full max-w-md bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg"
        >
          Complete Technical Tracking
        </Button>
      </div>
    </div>
  );
}
