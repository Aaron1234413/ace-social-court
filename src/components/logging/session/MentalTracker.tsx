
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import AIPromptHelper from './AIPromptHelper';

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

  const [showSliders, setShowSliders] = useState(false);

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

  const handleAISuggestion = (suggestion: string) => {
    const currentReflection = data.reflection;
    const newReflection = currentReflection ? `${currentReflection} ${suggestion}` : suggestion;
    updateData({ reflection: newReflection });
  };

  const getEmotionContext = () => {
    const selectedEmotion = emotionOptions.find(opt => opt.value === data.emotionEmoji);
    return selectedEmotion ? `Player felt ${selectedEmotion.label.toLowerCase()} during the session` : 'Tennis training session mental state';
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
        <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-pulse">🧠</div>
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-900">Mental Tracker</h2>
        <p className="text-sm md:text-base text-gray-600">How did your mind feel during the session?</p>
      </div>

      {/* Emotion Selection - Mobile Optimized */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">🎭</span>
            Mental State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {emotionOptions.map((option) => (
              <Button
                key={option.value}
                variant={data.emotionEmoji === option.value ? "default" : "outline"}
                className={`h-16 md:h-20 flex flex-col space-y-1 transition-all duration-300 touch-manipulation ${
                  data.emotionEmoji === option.value 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white scale-105 shadow-lg transform' 
                    : 'hover:scale-105 bg-white shadow-md hover:shadow-lg border-2'
                }`}
                onClick={() => handleEmotionSelect(option.value)}
              >
                <span className="text-2xl md:text-3xl">{option.emoji}</span>
                <span className="text-xs font-medium leading-tight">{option.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {data.emotionEmoji && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Mental state selected!</span>
          </div>
        </div>
      )}

      {/* AI Prompt Helper */}
      <AIPromptHelper
        pillar="mental"
        context={getEmotionContext()}
        onSuggestionSelect={handleAISuggestion}
      />

      {/* Collapsible Sliders - Enhanced Mobile */}
      <Collapsible open={showSliders} onOpenChange={setShowSliders}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 md:h-14 text-sm md:text-base shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              Detailed Mental Metrics
            </span>
            {showSliders ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="pt-6 space-y-6">
              {/* Confidence */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">💪</span>
                    Confidence
                  </label>
                  <span className="text-lg md:text-xl font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                    {data.confidence}/10
                  </span>
                </div>
                <Slider
                  value={[data.confidence]}
                  onValueChange={(value) => handleSliderChange('confidence', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>

              {/* Motivation */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    Motivation
                  </label>
                  <span className="text-lg md:text-xl font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {data.motivation}/10
                  </span>
                </div>
                <Slider
                  value={[data.motivation]}
                  onValueChange={(value) => handleSliderChange('motivation', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>

              {/* Anxiety */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">😰</span>
                    Anxiety Level
                  </label>
                  <span className="text-lg md:text-xl font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                    {data.anxiety}/10
                  </span>
                </div>
                <Slider
                  value={[data.anxiety]}
                  onValueChange={(value) => handleSliderChange('anxiety', value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full touch-manipulation"
                />
              </div>

              {/* Focus */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm md:text-base font-medium flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    Focus
                  </label>
                  <span className="text-lg md:text-xl font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                    {data.focus}/10
                  </span>
                </div>
                <Slider
                  value={[data.focus]}
                  onValueChange={(value) => handleSliderChange('focus', value)}
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

      {/* Reflection Section - Enhanced */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <span className="text-xl">💭</span>
            Reflection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Share any insights, breakthroughs, or mental observations from your session..."
            value={data.reflection}
            onChange={(e) => updateData({ reflection: e.target.value })}
            className="min-h-[100px] md:min-h-[120px] text-sm md:text-base touch-manipulation resize-none shadow-sm border-2 focus:border-purple-300 transition-colors"
          />
        </CardContent>
      </Card>
    </div>
  );
}
