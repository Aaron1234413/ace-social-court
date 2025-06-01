
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { PhysicalData } from '@/types/logging';
import AIPromptHelper from './AIPromptHelper';

interface PhysicalTrackerProps {
  onDataChange: (data: PhysicalData) => void;
  initialData?: Partial<PhysicalData>;
  onBack?: () => void;
}

const energyOptions = [
  { emoji: '⚡', label: 'High Energy', value: 'high' },
  { emoji: '🔋', label: 'Good Energy', value: 'good' },
  { emoji: '😐', label: 'Average Energy', value: 'average' },
  { emoji: '😴', label: 'Low Energy', value: 'low' },
  { emoji: '🪫', label: 'Exhausted', value: 'exhausted' }
];

export default function PhysicalTracker({ 
  onDataChange, 
  initialData = {}, 
  onBack 
}: PhysicalTrackerProps) {
  const [data, setData] = useState<PhysicalData>({
    energyLevel: initialData.energyLevel || '',
    courtCoverage: initialData.courtCoverage || 5,
    endurance: initialData.endurance || 5,
    strengthFeeling: initialData.strengthFeeling || 5,
    notes: initialData.notes || ''
  });

  const updateData = (updates: Partial<PhysicalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
  };

  const handleEnergySelect = (value: string) => {
    updateData({ energyLevel: value });
  };

  const handleSliderChange = (field: keyof PhysicalData, value: number[]) => {
    updateData({ [field]: value[0] });
  };

  const handleComplete = () => {
    onDataChange(data);
  };

  const handleAISuggestion = (suggestion: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes} ${suggestion}` : suggestion;
    updateData({ notes: newNotes });
  };

  const getPhysicalContext = () => {
    const selectedEnergy = energyOptions.find(opt => opt.value === data.energyLevel);
    return selectedEnergy ? `Player felt ${selectedEnergy.label.toLowerCase()} during tennis practice` : 'Tennis training session';
  };

  const isValid = data.energyLevel && data.courtCoverage;

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
        <div className="text-6xl mb-4 animate-bounce">💪</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Physical Tracker</h2>
        <p className="text-base text-gray-600">How did you feel physically during this session?</p>
      </div>

      {/* Energy Level Selection */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/50 to-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Energy Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {energyOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.energyLevel === option.value ? "default" : "outline"}
                className={`h-20 flex flex-col space-y-2 transition-all duration-300 ${
                  data.energyLevel === option.value 
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white scale-105 shadow-lg transform' 
                    : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                }`}
                onClick={() => handleEnergySelect(option.value)}
              >
                <span className="text-2xl">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Physical Metrics */}
      <Card className="shadow-lg border-0 bg-white/80">
        <CardContent className="pt-6 space-y-6">
          {/* Court Coverage */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">🏃</span>
                Court Coverage
              </label>
              <span className="text-xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                {data.courtCoverage}/10
              </span>
            </div>
            <Slider
              value={[data.courtCoverage]}
              onValueChange={(value) => handleSliderChange('courtCoverage', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Endurance */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">🫁</span>
                Endurance
              </label>
              <span className="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                {data.endurance}/10
              </span>
            </div>
            <Slider
              value={[data.endurance]}
              onValueChange={(value) => handleSliderChange('endurance', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Strength Feeling */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">💪</span>
                Strength Feeling
              </label>
              <span className="text-xl font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {data.strengthFeeling}/10
              </span>
            </div>
            <Slider
              value={[data.strengthFeeling]}
              onValueChange={(value) => handleSliderChange('strengthFeeling', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="physical"
        context={getPhysicalContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Physical Notes */}
      <Card className="shadow-lg border-0 bg-white/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Physical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How did your body feel during this session? Any areas of focus or concern?"
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[120px] text-base resize-none shadow-sm border-2 focus:border-blue-300 transition-colors"
          />
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handleComplete}
          disabled={!isValid}
          size="lg"
          className="w-full max-w-md bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"
        >
          Complete Physical Tracking
        </Button>
      </div>
    </div>
  );
}
