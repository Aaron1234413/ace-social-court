
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TechnicalData } from '@/types/logging';

interface TechnicalSummaryProps {
  data: TechnicalData;
  isExpanded: boolean;
}

export default function TechnicalSummary({ data, isExpanded }: TechnicalSummaryProps) {
  const strokes = Object.keys(data.selectedStrokes || {});
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🎾</span>
        <div>
          <p className="font-medium">Strokes Practiced</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {strokes.slice(0, 3).map((stroke) => (
              <Badge key={stroke} variant="secondary" className="text-xs">
                {stroke}
              </Badge>
            ))}
            {strokes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{strokes.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t">
          <div className="text-sm">
            <span className="font-medium">All Strokes: </span>
            <span>{strokes.join(', ')}</span>
          </div>
          {data.drillSuggestions && data.drillSuggestions.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Drill Suggestions: </span>
              <span>{data.drillSuggestions.join(', ')}</span>
            </div>
          )}
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
