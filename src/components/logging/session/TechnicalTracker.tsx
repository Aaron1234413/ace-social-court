
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AIPromptHelper from './AIPromptHelper';

interface TechnicalData {
  selectedStrokes: {
    [stroke: string]: string[];
  };
  notes: string;
  drillSuggestions: string[];
}

interface TechnicalTrackerProps {
  onDataChange: (data: TechnicalData) => void;
  initialData?: Partial<TechnicalData>;
  onBack?: () => void;
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

export default function TechnicalTracker({ onDataChange, initialData = {}, onBack }: TechnicalTrackerProps) {
  const [data, setData] = useState<TechnicalData>({
    selectedStrokes: initialData.selectedStrokes || {},
    notes: initialData.notes || '',
    drillSuggestions: initialData.drillSuggestions || []
  });

  const [selectedStroke, setSelectedStroke] = useState<string | null>(null);
  const [showDrillSuggestions, setShowDrillSuggestions] = useState(false);

  // Update parent component whenever data changes
  useEffect(() => {
    onDataChange(data);
  }, [data, onDataChange]);

  const updateData = (updates: Partial<TechnicalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    console.log('Technical data updated:', newData);
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
    // Add to drill suggestions array
    const newDrillSuggestions = [...data.drillSuggestions, drill];
    
    // Also add to notes
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes}\n• ${drill}` : `• ${drill}`;
    
    updateData({ 
      notes: newNotes,
      drillSuggestions: newDrillSuggestions
    });
    
    console.log('Added drill suggestion:', drill);
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
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* Header with Back Button */}
      <div className="text-center mb-6 md:mb-8">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="absolute left-4 top-4 h-12 w-12 rounded-full shadow-md bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-spin-slow">🎾</div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Technical Tracker</h2>
        <p className="text-sm md:text-base text-gray-600">Which strokes did you work on today?</p>
      </div>

      {/* Stroke Selection - Mobile Optimized */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-teal-50/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Stroke Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            {Object.entries(strokeOptions).map(([stroke, config]) => (
              <Button
                key={stroke}
                variant={selectedStroke === stroke ? "default" : "outline"}
                className={`h-20 md:h-24 flex flex-col space-y-1 md:space-y-2 transition-all duration-300 touch-manipulation relative ${
                  isStrokeSelected(stroke)
                    ? 'ring-2 ring-green-500 bg-green-50 shadow-lg'
                    : selectedStroke === stroke 
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white scale-105 shadow-lg' 
                      : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                }`}
                onClick={() => handleStrokeSelect(stroke)}
              >
                <span className="text-2xl md:text-3xl">{config.emoji}</span>
                <span className="text-xs md:text-sm font-medium leading-tight">{config.label}</span>
                {isStrokeSelected(stroke) && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="secondary" className="text-xs bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      {data.selectedStrokes[stroke].length}
                    </Badge>
                  </div>
                )}
              </Button>
            ))}
          </div>

          {/* Second Level Options */}
          {selectedStroke && (
            <div className="space-y-3 p-4 bg-white/60 rounded-lg shadow-inner animate-fade-in">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <span className="text-lg">{strokeOptions[selectedStroke as keyof typeof strokeOptions].emoji}</span>
                {strokeOptions[selectedStroke as keyof typeof strokeOptions].label} Options:
              </h4>
              <div className="flex flex-wrap gap-2">
                {strokeOptions[selectedStroke as keyof typeof strokeOptions].options.map((option) => (
                  <Button
                    key={option}
                    variant={data.selectedStrokes[selectedStroke]?.includes(option) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStrokeOptionSelect(selectedStroke, option)}
                    className={`transition-all duration-200 touch-manipulation text-xs md:text-sm h-10 md:h-12 ${
                      data.selectedStrokes[selectedStroke]?.includes(option)
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-md scale-105'
                        : 'hover:bg-green-50 border-2'
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
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-fade-in">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span className="text-lg">✅</span>
              Selected Strokes:
            </h4>
            <div className="space-y-2">
              {selectedStrokeNames.map((stroke) => (
                <div key={stroke} className="flex items-center space-x-2 flex-wrap">
                  <span className="font-medium capitalize text-sm md:text-base">{stroke}:</span>
                  <div className="flex flex-wrap gap-1">
                    {data.selectedStrokes[stroke].map((option) => (
                      <Badge key={option} variant="secondary" className="text-xs">
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

      {/* Progress Indicator */}
      {selectedStrokeNames.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              {selectedStrokeNames.length} stroke{selectedStrokeNames.length !== 1 ? 's' : ''} selected!
            </span>
          </div>
        </div>
      )}

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="technical"
        context={getStrokesContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Drill Suggestions */}
      {selectedStrokeNames.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full justify-center space-x-2 mb-4 h-12 md:h-14 text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
              onClick={() => setShowDrillSuggestions(!showDrillSuggestions)}
            >
              <Sparkles className="h-4 w-4" />
              <span>Get drill suggestions for {selectedStrokeNames.join(', ')}?</span>
            </Button>

            {showDrillSuggestions && (
              <div className="space-y-4 animate-fade-in">
                {selectedStrokeNames.map((stroke) => (
                  <div key={stroke} className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 capitalize flex items-center gap-2">
                      <span className="text-lg">{strokeOptions[stroke as keyof typeof strokeOptions].emoji}</span>
                      {stroke} drills:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {drillSuggestions[stroke as keyof typeof drillSuggestions].map((drill, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDrillSuggestionSelect(drill)}
                          disabled={data.drillSuggestions.includes(drill)}
                          className="text-xs h-10 md:h-12 touch-manipulation shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {drill}
                          {data.drillSuggestions.includes(drill) && ' ✓'}
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

      {/* Notes Section - Enhanced */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Additional Details
            {data.drillSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {data.drillSuggestions.length} drill{data.drillSuggestions.length !== 1 ? 's' : ''} added
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any technical notes about your strokes, technique improvements, or session insights..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[100px] md:min-h-[120px] text-sm md:text-base touch-manipulation resize-none shadow-sm border-2 focus:border-green-300 transition-colors"
          />
        </CardContent>
      </Card>
    </div>
  );
}
