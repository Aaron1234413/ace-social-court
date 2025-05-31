
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchData } from '../MatchLogger';
import { useIsMobile } from '@/hooks/use-mobile';

interface MatchMentalStateStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const ENERGY_OPTIONS = [
  { value: 'low', emoji: '😴', label: 'Low Energy', description: 'Felt tired and sluggish' },
  { value: 'moderate', emoji: '😐', label: 'Moderate', description: 'Normal energy levels' },
  { value: 'high', emoji: '💪', label: 'High Energy', description: 'Felt strong and energetic' },
  { value: 'peak', emoji: '🔥', label: 'Peak Energy', description: 'At my absolute best' }
];

const FOCUS_OPTIONS = [
  { value: 'distracted', emoji: '😵‍💫', label: 'Distracted', description: 'Mind was elsewhere' },
  { value: 'scattered', emoji: '😕', label: 'Scattered', description: 'Struggled to concentrate' },
  { value: 'focused', emoji: '😤', label: 'Focused', description: 'Good concentration' },
  { value: 'locked_in', emoji: '🎯', label: 'Locked In', description: 'Complete focus and flow' }
];

const EMOTION_OPTIONS = [
  { value: 'frustrated', emoji: '😤', label: 'Frustrated', description: 'Felt annoyed or angry' },
  { value: 'nervous', emoji: '😰', label: 'Nervous', description: 'Felt anxious or tense' },
  { value: 'calm', emoji: '😌', label: 'Calm', description: 'Relaxed and composed' },
  { value: 'confident', emoji: '😎', label: 'Confident', description: 'Felt self-assured' },
  { value: 'excited', emoji: '😄', label: 'Excited', description: 'Enthusiastic and pumped' },
  { value: 'determined', emoji: '😤', label: 'Determined', description: 'Focused and driven' }
];

export default function MatchMentalStateStep({ data, onDataChange, onValidationChange }: MatchMentalStateStepProps) {
  const isMobile = useIsMobile();
  
  // Validation effect
  useEffect(() => {
    const isValid = data.energy_emoji && data.focus_emoji && data.emotion_emoji;
    onValidationChange(!!isValid);
  }, [data.energy_emoji, data.focus_emoji, data.emotion_emoji, onValidationChange]);

  const handleSelectionChange = (type: 'energy_emoji' | 'focus_emoji' | 'emotion_emoji', value: string) => {
    onDataChange({ [type]: value });
  };

  const renderOptionSection = (
    title: string,
    type: 'energy_emoji' | 'focus_emoji' | 'emotion_emoji',
    options: typeof ENERGY_OPTIONS,
    selectedValue?: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">{title} *</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selectedValue === option.value ? "default" : "outline"}
              onClick={() => handleSelectionChange(type, option.value)}
              className={`${isMobile ? 'h-20 py-6' : 'h-auto py-4'} flex flex-col gap-2 transition-all touch-manipulation ${
                selectedValue === option.value
                  ? 'ring-2 ring-primary ring-offset-2 scale-105 bg-primary text-primary-foreground'
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              <span className={`${isMobile ? 'text-3xl' : 'text-2xl'}`}>{option.emoji}</span>
              <div className="text-center">
                <div className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{option.label}</div>
                {!isMobile && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>
        {isMobile && selectedValue && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground text-center">
              {options.find(o => o.value === selectedValue)?.description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg md:text-xl font-semibold mb-2">How Did You Feel?</h3>
        <p className="text-muted-foreground text-sm md:text-base">
          Record your mental and emotional state during the match
        </p>
      </div>

      {renderOptionSection(
        "Energy Level",
        "energy_emoji",
        ENERGY_OPTIONS,
        data.energy_emoji
      )}

      {renderOptionSection(
        "Focus & Concentration",
        "focus_emoji",
        FOCUS_OPTIONS,
        data.focus_emoji
      )}

      {renderOptionSection(
        "Emotional State",
        "emotion_emoji",
        EMOTION_OPTIONS,
        data.emotion_emoji
      )}

      {/* Summary */}
      {data.energy_emoji && data.focus_emoji && data.emotion_emoji && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-3 text-center">Your Mental State Summary:</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span>Energy:</span>
                <span className="text-xl">
                  {ENERGY_OPTIONS.find(o => o.value === data.energy_emoji)?.emoji}
                </span>
                <span className="font-medium">
                  {ENERGY_OPTIONS.find(o => o.value === data.energy_emoji)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Focus:</span>
                <span className="text-xl">
                  {FOCUS_OPTIONS.find(o => o.value === data.focus_emoji)?.emoji}
                </span>
                <span className="font-medium">
                  {FOCUS_OPTIONS.find(o => o.value === data.focus_emoji)?.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>Emotion:</span>
                <span className="text-xl">
                  {EMOTION_OPTIONS.find(o => o.value === data.emotion_emoji)?.emoji}
                </span>
                <span className="font-medium">
                  {EMOTION_OPTIONS.find(o => o.value === data.emotion_emoji)?.label}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
          <span className="text-lg">🧠</span>
          Mental Game Tips
        </h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Your mental state significantly impacts performance</li>
          <li>• Track patterns to identify what affects your mindset</li>
          <li>• Consider pre-match routines to optimize your mental state</li>
        </ul>
      </div>
    </div>
  );
}
