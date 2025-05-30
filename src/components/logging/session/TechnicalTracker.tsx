
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AIPromptHelper from './AIPromptHelper';

interface TechnicalData {
  selectedStrokes: {
    [stroke: string]: string[];
  };
  notes: string;
}

interface TechnicalTrackerProps {
  onDataChange: (data: TechnicalData) => void;
  initialData?: Partial<TechnicalData>;
}

const strokeOptions = {
  forehand: {
    emoji: '🎾',
    label: 'Forehand',
    options: ['Topspin', 'Slice', 'Drive']
  },
  backhand: {
    emoji: '🏓',
    label: 'Backhand',
    options: ['One-handed', 'Two-handed']
  },
  serve: {
    emoji: '⚡',
    label: 'Serve',
    options: ['First', 'Second', 'Wide', 'T', 'Body']
  },
  volley: {
    emoji: '🏐',
    label: 'Volley',
    options: ['Forehand volley', 'Backhand volley', 'Half volley']
  },
  slice: {
    emoji: '🌀',
    label: 'Slice',
    options: ['Defensive slice', 'Aggressive slice', 'Drop shot']
  }
};

const drillSuggestions = {
  forehand: [
    "Cross-court forehands for consistency",
    "Inside-out forehand practice",
    "Forehand approach shots"
  ],
  backhand: [
    "Down-the-line backhand repetition",
    "Backhand slice consistency",
    "Two-handed backhand power"
  ],
  serve: [
    "Serve placement targets",
    "Second serve consistency drill",
    "Serve and volley practice"
  ],
  volley: [
    "Touch volley at net",
    "Volley-to-volley rallies",
    "Approach and volley sequence"
  ],
  slice: [
    "Slice approach shots",
    "Defensive slice under pressure",
    "Slice and charge drill"
  ]
};

export default function TechnicalTracker({ onDataChange, initialData = {} }: TechnicalTrackerProps) {
  const [data, setData] = useState<TechnicalData>({
    selectedStrokes: initialData.selectedStrokes || {},
    notes: initialData.notes || ''
  });

  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [showDrillSuggestions, setShowDrillSuggestions] = useState(false);

  const updateData = (updates: Partial<TechnicalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onDataChange(newData);
  };

  const handleStrokeSelect = (stroke: string) => {
    if (selectedStroke === stroke) {
      setSelectedStroke(null);
    } else {
      setSelectedStroke(stroke);
    }
  };

  const handleStrokeOptionSelect = (stroke: string, option: string) => {
    const currentOptions = data.selectedStrokes[stroke] || [];
    const newOptions = currentOptions.includes(option)
      ? currentOptions.filter(opt => opt !== option)
      : [...currentOptions, option];
    
    const newSelectedStrokes = {
      ...data.selectedStrokes,
      [stroke]: newOptions
    };

    if (newOptions.length === 0) {
      delete newSelectedStrokes[stroke];
    }

    updateData({ selectedStrokes: newSelectedStrokes });
  };

  const isStrokeSelected = (stroke: string) => {
    return data.selectedStrokes[stroke] && data.selectedStrokes[stroke].length > 0;
  };

  const getSelectedStrokeNames = () => {
    return Object.keys(data.selectedStrokes).filter(stroke => data.selectedStrokes[stroke].length > 0);
  };

  const handleDrillSuggestionSelect = (drill: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes}\n• ${drill}` : `• ${drill}`;
    updateData({ notes: newNotes });
    setShowDrillSuggestions(false);
  };

  const handleAISuggestion = (suggestion: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes} ${suggestion}` : suggestion;
    updateData({ notes: newNotes });
  };

  const getStrokesContext = () => {
    const selectedStrokeNames = getSelectedStrokeNames();
    return selectedStrokeNames.length > 0 
      ? `Working on ${selectedStrokeNames.join(', ')} strokes`
      : 'Tennis technical training session';
  };

  const selectedStrokeNames = getSelectedStrokeNames();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎾</div>
        <h2 className="text-2xl font-bold mb-2">Technical Tracker</h2>
        <p className="text-gray-600">Which strokes did you work on today?</p>
      </div>

      {/* Stroke Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stroke Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(strokeOptions).map(([stroke, config]) => (
              <Button
                key={stroke}
                variant={selectedStroke === stroke ? "default" : "outline"}
                className={`h-24 flex flex-col space-y-2 transition-all duration-300 ${
                  isStrokeSelected(stroke)
                    ? 'ring-2 ring-green-500 bg-green-50'
                    : selectedStroke === stroke 
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white scale-105 shadow-lg' 
                      : 'hover:scale-105'
                }`}
                onClick={() => handleStrokeSelect(stroke)}
              >
                <span className="text-3xl">{config.emoji}</span>
                <span className="text-sm font-medium">{config.label}</span>
                {isStrokeSelected(stroke) && (
                  <Badge variant="secondary" className="text-xs">
                    {data.selectedStrokes[stroke].length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Second Level Options */}
          {selectedStroke && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">
                {strokeOptions[selectedStroke as keyof typeof strokeOptions].label} Options:
              </h4>
              <div className="flex flex-wrap gap-2">
                {strokeOptions[selectedStroke as keyof typeof strokeOptions].options.map((option) => (
                  <Button
                    key={option}
                    variant={data.selectedStrokes[selectedStroke]?.includes(option) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStrokeOptionSelect(selectedStroke, option)}
                    className={`transition-all duration-200 ${
                      data.selectedStrokes[selectedStroke]?.includes(option)
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'hover:bg-green-50'
                    }`}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Strokes Summary */}
      {selectedStrokeNames.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3">Selected Strokes:</h4>
            <div className="space-y-2">
              {selectedStrokeNames.map((stroke) => (
                <div key={stroke} className="flex items-center space-x-2">
                  <span className="font-medium capitalize">{stroke}:</span>
                  <div className="flex flex-wrap gap-1">
                    {data.selectedStrokes[stroke].map((option) => (
                      <Badge key={option} variant="secondary">
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="technical"
        context={getStrokesContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Drill Suggestions */}
      {selectedStrokeNames.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full justify-center space-x-2 mb-4"
              onClick={() => setShowDrillSuggestions(!showDrillSuggestions)}
            >
              <span>Want drill suggestions for {selectedStrokeNames.join(', ')}?</span>
            </Button>

            {showDrillSuggestions && (
              <div className="space-y-4">
                {selectedStrokeNames.map((stroke) => (
                  <div key={stroke} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 capitalize">
                      {stroke} drills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drillSuggestions[stroke as keyof typeof drillSuggestions].map((drill, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDrillSuggestionSelect(drill)}
                          className="text-xs"
                        >
                          {drill}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any technical notes about your strokes, technique improvements, or session insights..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
