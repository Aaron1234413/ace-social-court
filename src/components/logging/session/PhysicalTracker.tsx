
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import AIPromptHelper from './AIPromptHelper';

interface PhysicalData {
  energyLevel: string;
  courtCoverage: number;
  endurance: number;
  strengthFeeling: number;
  notes: string;
}

interface PhysicalTrackerProps {
  onDataChange: (data: PhysicalData) => void;
  initialData?: Partial<PhysicalData>;
  onBack?: () => void;
}

const energyOptions = [
  { emoji: '💪', label: 'Strong', value: 'strong' },
  { emoji: '🔥', label: 'Intense', value: 'intense' },
  { emoji: '😫', label: 'Drained', value: 'drained' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' }
];

export default function PhysicalTracker({ onDataChange, initialData = {}, onBack }: PhysicalTrackerProps) {
  const [data, setData] = useState<PhysicalData>({
    energyLevel: initialData.energyLevel || '',
    courtCoverage: initialData.courtCoverage || 5,
    endurance: initialData.endurance || 5,
    strengthFeeling: initialData.strengthFeeling || 5,
    notes: initialData.notes || ''
  });

  const [showSliders, setShowSliders] = useState(false);

  const updateData = (updates: Partial<PhysicalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onDataChange(newData);
  };

  const handleEnergySelect = (value: string) => {
    updateData({ energyLevel: value });
  };

  const handleSliderChange = (field: keyof PhysicalData, value: number[]) => {
    updateData({ [field]: value[0] });
  };

  const handleAISuggestion = (suggestion: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes} ${suggestion}` : suggestion;
    updateData({ notes: newNotes });
  };

  const getEnergyContext = () => {
    const selectedEnergy = energyOptions.find(opt => opt.value === data.energyLevel);
    return selectedEnergy ? `Player felt ${selectedEnergy.label.toLowerCase()} during the session` : 'Tennis training session';
  };

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
        <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-bounce">💪</div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Physical Tracker</h2>
        <p className="text-sm md:text-base text-gray-600">How did your body feel during the session?</p>
      </div>

      {/* Energy Level Selection - Mobile Optimized */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Energy Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {energyOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.energyLevel === option.value ? "default" : "outline"}
                className={`h-16 md:h-20 flex flex-col space-y-1 md:space-y-2 transition-all duration-300 touch-manipulation ${
                  data.energyLevel === option.value 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white scale-105 shadow-lg transform' 
                    : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                }`}
                onClick={() => handleEnergySelect(option.value)}
              >
                <span className="text-2xl md:text-3xl">{option.emoji}</span>
                <span className="text-xs md:text-sm font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {data.energyLevel && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Energy level selected!</span>
          </div>
        </div>
      )}

      {/* Collapsible Sliders - Enhanced Mobile */}
      <Collapsible open={showSliders} onOpenChange={setShowSliders}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 md:h-14 text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              Detailed Metrics
            </span>
            {showSliders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-6">
              {/* Court Coverage */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">🎾</span>
                    Court Coverage
                  </label>
                  <span className="text-lg md:text-xl font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    {data.courtCoverage}/10
                  </span>
                </div>
                <Slider
                  value={[data.courtCoverage]}
                  onValueChange={(value) => handleSliderChange('courtCoverage', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>

              {/* Endurance */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">🏃</span>
                    Endurance
                  </label>
                  <span className="text-lg md:text-xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {data.endurance}/10
                  </span>
                </div>
                <Slider
                  value={[data.endurance]}
                  onValueChange={(value) => handleSliderChange('endurance', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>

              {/* Strength Feeling */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">💪</span>
                    Strength Feeling
                  </label>
                  <span className="text-lg md:text-xl font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {data.strengthFeeling}/10
                  </span>
                </div>
                <Slider
                  value={[data.strengthFeeling]}
                  onValueChange={(value) => handleSliderChange('strengthFeeling', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="physical"
        context={getEnergyContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Notes Section - Enhanced */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes about your physical performance..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[100px] md:min-h-[120px] text-sm md:text-base touch-manipulation resize-none shadow-sm border-2 focus:border-orange-300 transition-colors"
          />
        </CardContent>
      </Card>
    </div>
  );
}
