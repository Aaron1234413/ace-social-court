
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface MentalData {
  emotionEmoji: string;
  confidence: number;
  motivation: number;
  anxiety: number;
  focus: number;
  reflection: string;
}

interface MentalTrackerProps {
  onDataChange: (data: MentalData) => void;
  initialData?: Partial<MentalData>;
}

const emotionOptions = [
  { emoji: '🎯', label: 'Focused', value: 'focused' },
  { emoji: '😤', label: 'Determined', value: 'determined' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '🔥', label: 'Fired Up', value: 'fired_up' }
];

const aiSuggestions = [
  "Frustrated with backhand",
  "Felt sharp on pressure points",
  "Lost focus mid-session",
  "Great mental clarity today",
  "Struggled with match pressure",
  "Confident on big points"
];

export default function MentalTracker({ onDataChange, initialData = {} }: MentalTrackerProps) {
  const [data, setData] = useState<MentalData>({
    emotionEmoji: initialData.emotionEmoji || '',
    confidence: initialData.confidence || 5,
    motivation: initialData.motivation || 5,
    anxiety: initialData.anxiety || 5,
    focus: initialData.focus || 5,
    reflection: initialData.reflection || ''
  });

  const [showSliders, setShowSliders] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const updateData = (updates: Partial<MentalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
    onDataChange(newData);
  };

  const handleEmotionSelect = (value: string) => {
    updateData({ emotionEmoji: value });
  };

  const handleSliderChange = (field: keyof MentalData, value: number[]) => {
    updateData({ [field]: value[0] });
  };

  const handleSuggestionSelect = (suggestion: string) => {
    const currentReflection = data.reflection;
    const newReflection = currentReflection ? `${currentReflection} ${suggestion}` : suggestion;
    updateData({ reflection: newReflection });
    setShowAISuggestions(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-bold mb-2">Mental Tracker</h2>
        <p className="text-gray-600">How did your mind feel during the session?</p>
      </div>

      {/* Emotion Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mental State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {emotionOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.emotionEmoji === option.value ? "default" : "outline"}
                className={`h-20 flex flex-col space-y-2 transition-all duration-300 ${
                  data.emotionEmoji === option.value 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105 shadow-lg' 
                    : 'hover:scale-105'
                }`}
                onClick={() => handleEmotionSelect(option.value)}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full justify-center space-x-2 mb-4"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Need help describing how you felt?</span>
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

      {/* Collapsible Sliders */}
      <Collapsible open={showSliders} onOpenChange={setShowSliders}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            Detailed Mental Metrics
            {showSliders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {/* Confidence */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Confidence</label>
                  <span className="text-sm text-gray-500">{data.confidence}/10</span>
                </div>
                <Slider
                  value={[data.confidence]}
                  onValueChange={(value) => handleSliderChange('confidence', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Motivation */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Motivation</label>
                  <span className="text-sm text-gray-500">{data.motivation}/10</span>
                </div>
                <Slider
                  value={[data.motivation]}
                  onValueChange={(value) => handleSliderChange('motivation', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Anxiety */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Anxiety Level</label>
                  <span className="text-sm text-gray-500">{data.anxiety}/10</span>
                </div>
                <Slider
                  value={[data.anxiety]}
                  onValueChange={(value) => handleSliderChange('anxiety', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Focus */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Focus</label>
                  <span className="text-sm text-gray-500">{data.focus}/10</span>
                </div>
                <Slider
                  value={[data.focus]}
                  onValueChange={(value) => handleSliderChange('focus', value)}
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

      {/* Reflection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reflection</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share any insights, breakthroughs, or mental observations from your session..."
            value={data.reflection}
            onChange={(e) => updateData({ reflection: e.target.value })}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
