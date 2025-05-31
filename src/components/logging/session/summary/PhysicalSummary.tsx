
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PhysicalData {
  energyLevel: string;
  courtCoverage: number;
  endurance: number;
  strengthFeeling: number;
  notes: string;
}

interface PhysicalSummaryProps {
  data: PhysicalData;
  isExpanded: boolean;
}

const energyOptions = {
  strong: { emoji: '💪', label: 'Strong' },
  intense: { emoji: '🔥', label: 'Intense' },
  drained: { emoji: '😫', label: 'Drained' },
  neutral: { emoji: '😐', label: 'Neutral' }
};

export default function PhysicalSummary({ data, isExpanded }: PhysicalSummaryProps) {
  const energy = energyOptions[data.energyLevel as keyof typeof energyOptions];
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{energy?.emoji}</span>
        <div>
          <p className="font-medium">{energy?.label} Energy</p>
          <p className="text-sm text-gray-600">Court Coverage: {data.courtCoverage}/10</p>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Endurance: {data.endurance}/10</div>
            <div>Strength: {data.strengthFeeling}/10</div>
          </div>
          {data.notes && (
            <div className="text-sm">
              <span className="font-medium">Notes: </span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
