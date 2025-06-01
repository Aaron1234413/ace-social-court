
import React from 'react';
import { MentalData } from '@/types/logging';

interface MentalSummaryProps {
  data: MentalData;
  isExpanded: boolean;
}

const emotionOptions = {
  focused: { emoji: '🎯', label: 'Focused' },
  determined: { emoji: '😤', label: 'Determined' },
  anxious: { emoji: '😰', label: 'Anxious' },
  happy: { emoji: '😊', label: 'Happy' },
  fired_up: { emoji: '🔥', label: 'Fired Up' }
};

export default function MentalSummary({ data, isExpanded }: MentalSummaryProps) {
  const emotion = emotionOptions[data.emotionEmoji as keyof typeof emotionOptions];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emotion?.emoji}</span>
        <div>
          <p className="font-medium">{emotion?.label} State</p>
          <p className="text-sm text-gray-600">Confidence: {data.confidence}/10</p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Motivation: {data.motivation}/10</div>
            <div>Focus: {data.focus}/10</div>
            <div>Anxiety: {data.anxiety}/10</div>
          </div>
          {data.reflection && (
            <div className="text-sm">
              <span className="font-medium">Reflection: </span>
              <span>{data.reflection}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
