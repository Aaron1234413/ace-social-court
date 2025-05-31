
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchData } from '../MatchLogger';

interface MatchPerformanceStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const ENERGY_OPTIONS = [
  { value: 'low', emoji: '😫', label: 'Low Energy' },
  { value: 'moderate', emoji: '😐', label: 'Moderate' },
  { value: 'high', emoji: '💪', label: 'High Energy' }
];

const FOCUS_OPTIONS = [
  { value: 'distracted', emoji: '😰', label: 'Distracted' },
  { value: 'normal', emoji: '😊', label: 'Normal Focus' },
  { value: 'locked_in', emoji: '🔥', label: 'Locked In' }
];

const EMOTION_OPTIONS = [
  { value: 'determined', emoji: '🎯', label: 'Determined' },
  { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { value: 'disappointed', emoji: '😞', label: 'Disappointed' },
  { value: 'confident', emoji: '😎', label: 'Confident' }
];

const SUGGESTED_TAGS = [
  'Confident on serve',
  'Backhand slipped',
  'Handled pressure well',
  'Lost momentum mid-set',
  'Solid returns',
  'Great net play',
  'Powerful forehand',
  'Mental toughness',
  'Quick feet',
  'Strategic play'
];

export default function MatchPerformanceStep({ data, onDataChange, onValidationChange }: MatchPerformanceStepProps) {
  
  // Validation effect
  useEffect(() => {
    const isValid = Boolean(data.energy_emoji && data.focus_emoji && data.emotion_emoji);
    onValidationChange(isValid);
  }, [data.energy_emoji, data.focus_emoji, data.emotion_emoji, onValidationChange]);

  const handleEmojiSelect = (type: 'energy_emoji' | 'focus_emoji' | 'emotion_emoji', value: string) => {
    onDataChange({ [type]: value });
  };

  const handleTagSelect = (tag: string) => {
    const currentTags = data.tags || [];
    if (currentTags.includes(tag)) {
      // Remove tag
      onDataChange({ tags: currentTags.filter(t => t !== tag) });
    } else if (currentTags.length < 3) {
      // Add tag (max 3)
      onDataChange({ tags: [...currentTags, tag] });
    }
  };

  const renderEmojiSection = (
    title: string,
    type: 'energy_emoji' | 'focus_emoji' | 'emotion_emoji',
    options: typeof ENERGY_OPTIONS,
    selectedValue?: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} *</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 justify-center">
          {options.map((option) => (
            <Button
              key={option.value}
              variant={selectedValue === option.value ? "default" : "outline"}
              onClick={() => handleEmojiSelect(type, option.value)}
              className={`flex flex-col gap-2 h-auto py-4 px-6 transition-all ${
                selectedValue === option.value
                  ? 'ring-2 ring-primary ring-offset-2 scale-105'
                  : 'hover:scale-105'
              }`}
            >
              <span className="text-3xl">{option.emoji}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Performance Reflection</h3>
        <p className="text-muted-foreground">
          How did you feel during the match?
        </p>
      </div>

      {/* Energy Level */}
      {renderEmojiSection(
        "Energy Level",
        "energy_emoji",
        ENERGY_OPTIONS,
        data.energy_emoji
      )}

      {/* Focus Level */}
      {renderEmojiSection(
        "Focus Level",
        "focus_emoji",
        FOCUS_OPTIONS,
        data.focus_emoji
      )}

      {/* Emotional State */}
      {renderEmojiSection(
        "Emotional State",
        "emotion_emoji",
        EMOTION_OPTIONS,
        data.emotion_emoji
      )}

      {/* Match Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Match Tags (max 3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => {
              const isSelected = data.tags?.includes(tag);
              const isDisabled = !isSelected && (data.tags?.length || 0) >= 3;
              
              return (
                <Button
                  key={tag}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTagSelect(tag)}
                  disabled={isDisabled}
                  className={`transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}
                >
                  {tag}
                </Button>
              );
            })}
          </div>
          
          {data.tags && data.tags.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Selected tags: {data.tags.join(', ')} ({data.tags.length}/3)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coach Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coach Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notify my coach?</p>
              <p className="text-sm text-muted-foreground">
                Your coach will see this match in their dashboard
              </p>
            </div>
            <Button
              variant={data.notify_coach ? "default" : "outline"}
              onClick={() => onDataChange({ notify_coach: !data.notify_coach })}
              className="min-w-[80px]"
            >
              {data.notify_coach ? "ON" : "OFF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Reflection Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be honest about your mental state - it helps track patterns</li>
          <li>• Tags help you remember specific moments later</li>
          <li>• Coach notifications help them provide better guidance</li>
        </ul>
      </div>
    </div>
  );
}
