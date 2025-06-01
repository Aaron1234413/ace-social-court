import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { MentalData } from '@/types/logging';
import AIPromptHelper from './AIPromptHelper';

interface MentalTrackerProps {
  onDataChange: (data: MentalData) => void;
  initialData?: Partial<MentalData>;
  onBack?: () => void;
}

const emotionOptions = [
  { emoji: '🎯', label: 'Focused', value: 'focused' },
  { emoji: '😤', label: 'Determined', value: 'determined' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '🔥', label: 'Fired Up', value: 'fired_up' }
];

export default function MentalTracker({ onDataChange, initialData = {}, onBack }: MentalTrackerProps) {
  const [data, setData] = useState<MentalData>({
    emotionEmoji: initialData.emotionEmoji || '',
    confidence: initialData.confidence || 5,
    motivation: initialData.motivation || 5,
    anxiety: initialData.anxiety || 5,
    focus: initialData.focus || 5,
    reflection: initialData.reflection || ''
  });

  const updateData = (updates: Partial<MentalData>) => {
    const newData = { ...data, ...updates };
    setData(newData);
  };

  const handleEmotionSelect = (value: string) => {
    updateData({ emotionEmoji: value });
  };

  const handleSliderChange = (field: keyof MentalData, value: number[]) => {
    updateData({ [field]: value[0] });
  };

  const handleComplete = () => {
    onDataChange(data);
  };

  const handleAISuggestion = (suggestion: string) => {
    const currentReflection = data.reflection;
    const newReflection = currentReflection ? `${currentReflection} ${suggestion}` : suggestion;
    updateData({ reflection: newReflection });
  };

  const getEmotionContext = () => {
    const selectedEmotion = emotionOptions.find(opt => opt.value === data.emotionEmoji);
    return selectedEmotion ? `Player felt ${selectedEmotion.label.toLowerCase()} during the session` : 'Tennis training session';
  };

  const isValid = data.emotionEmoji && data.confidence;

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
        <div className="text-6xl mb-4 animate-bounce">🧠</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Mental Tracker</h2>
        <p className="text-base text-gray-600">How did you feel mentally during the session?</p>
      </div>

      {/* Emotion Selection */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">💭</span>
            Emotional State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {emotionOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.emotionEmoji === option.value ? "default" : "outline"}
                className={`h-20 flex flex-col space-y-2 transition-all duration-300 ${
                  data.emotionEmoji === option.value 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105 shadow-lg transform' 
                    : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                }`}
                onClick={() => handleEmotionSelect(option.value)}
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mental Metrics */}
      <Card className="shadow-lg border-0 bg-white/80">
        <CardContent className="pt-6 space-y-6">
          {/* Confidence */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">💪</span>
                Confidence
              </label>
              <span className="text-xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                {data.confidence}/10
              </span>
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">🚀</span>
                Motivation
              </label>
              <span className="text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                {data.motivation}/10
              </span>
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

          {/* Focus */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">🎯</span>
                Focus
              </label>
              <span className="text-xl font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                {data.focus}/10
              </span>
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

          {/* Anxiety */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-base font-medium flex items-center gap-2">
                <span className="text-lg">😰</span>
                Anxiety Level
              </label>
              <span className="text-xl font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                {data.anxiety}/10
              </span>
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
        </CardContent>
      </Card>

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="mental"
        context={getEmotionContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Reflection */}
      <Card className="shadow-lg border-0 bg-white/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📝</span>
            Mental Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How did you feel mentally during this session? What went well? What was challenging?"
            value={data.reflection}
            onChange={(e) => updateData({ reflection: e.target.value })}
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
          className="w-full max-w-md bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg"
        >
          Complete Mental Tracking
        </Button>
      </div>
    </div>
  );
}
