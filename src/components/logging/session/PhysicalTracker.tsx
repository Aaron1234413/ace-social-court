
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

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
}

const energyOptions = [
  { emoji: '💪', label: 'Strong', value: 'strong' },
  { emoji: '🔥', label: 'Intense', value: 'intense' },
  { emoji: '😫', label: 'Drained', value: 'drained' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' }
];

const aiSuggestions = [
  "Great cardio workout",
  "Heavy baseline movement today",
  "Felt energized throughout",
  "Good court positioning",
  "Strong finish to the session"
];

export default function PhysicalTracker({ onDataChange, initialData = {} }: PhysicalTrackerProps) {
  const [data, setData] = useState<PhysicalData>({
    energyLevel: initialData.energyLevel || '',
    courtCoverage: initialData.courtCoverage || 5,
    endurance: initialData.endurance || 5,
    strengthFeeling: initialData.strengthFeeling || 5,
    notes: initialData.notes || ''
  });

  const [showSliders, setShowSliders] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

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

  const handleSuggestionSelect = (suggestion: string) => {
    const currentNotes = data.notes;
    const newNotes = currentNotes ? `${currentNotes} ${suggestion}` : suggestion;
    updateData({ notes: newNotes });
    setShowAISuggestions(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">💪</div>
        <h2 className="text-2xl font-bold mb-2">Physical Tracker</h2>
        <p className="text-gray-600">How did your body feel during the session?</p>
      </div>

      {/* Energy Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Energy Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {energyOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.energyLevel === option.value ? "default" : "outline"}
                className={`h-20 flex flex-col space-y-2 transition-all duration-300 ${
                  data.energyLevel === option.value 
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white scale-105 shadow-lg' 
                    : 'hover:scale-105'
                }`}
                onClick={() => handleEnergySelect(option.value)}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Collapsible Sliders */}
      <Collapsible open={showSliders} onOpenChange={setShowSliders}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            Detailed Metrics
            {showSliders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Court Coverage */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Court Coverage</label>
                  <span className="text-sm text-gray-500">{data.courtCoverage}/10</span>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Endurance</label>
                  <span className="text-sm text-gray-500">{data.endurance}/10</span>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Strength Feeling</label>
                  <span className="text-sm text-gray-500">{data.strengthFeeling}/10</span>
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
        </CollapsibleContent>
      </Collapsible>

      {/* AI Suggestions */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2 mb-4"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Need help logging this?</span>
          </Button>

          {showAISuggestions && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">Try these suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes about your physical performance..."
            value={data.notes}
            onChange={(e) => updateData({ notes: e.target.value })}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
