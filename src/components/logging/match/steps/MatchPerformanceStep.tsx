
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Zap, Battery } from 'lucide-react';
import { MatchData } from '../MatchLogger';

interface MatchPerformanceStepProps {
  data: MatchData;
  onDataChange: (updates: Partial<MatchData>) => void;
  onValidationChange: (isValid: boolean) => void;
}

const PERFORMANCE_METRICS = [
  {
    key: 'serve_rating' as keyof MatchData,
    title: 'Serve Performance',
    icon: <Zap className="h-5 w-5" />,
    description: 'How well did your serves perform today?',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    key: 'return_rating' as keyof MatchData,
    title: 'Return Game',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'How effective were your returns?',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    key: 'endurance_rating' as keyof MatchData,
    title: 'Endurance & Fitness',
    icon: <Battery className="h-5 w-5" />,
    description: 'How did your stamina hold up?',
    gradient: 'from-orange-500 to-red-500'
  }
];

const RATING_LABELS = {
  1: { label: 'Poor', color: 'text-red-600' },
  2: { label: 'Below Average', color: 'text-orange-600' },
  3: { label: 'Average', color: 'text-yellow-600' },
  4: { label: 'Good', color: 'text-green-600' },
  5: { label: 'Excellent', color: 'text-emerald-600' }
};

export default function MatchPerformanceStep({ data, onDataChange, onValidationChange }: MatchPerformanceStepProps) {
  
  // Validation effect
  useEffect(() => {
    const isValid = data.serve_rating !== undefined && 
                   data.return_rating !== undefined && 
                   data.endurance_rating !== undefined;
    onValidationChange(isValid);
  }, [data.serve_rating, data.return_rating, data.endurance_rating, onValidationChange]);

  const handleRatingChange = (key: keyof MatchData, value: number) => {
    onDataChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold mb-2">Rate Your Performance</h3>
        <p className="text-muted-foreground">
          Evaluate different aspects of your game on a scale of 1-5
        </p>
      </div>

      {PERFORMANCE_METRICS.map((metric) => {
        const currentValue = data[metric.key] as number || 3;
        const ratingInfo = RATING_LABELS[currentValue as keyof typeof RATING_LABELS];

        return (
          <Card key={metric.key} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${metric.gradient} text-white`}>
              <CardTitle className="flex items-center gap-3">
                {metric.icon}
                <div>
                  <h4 className="text-lg">{metric.title}</h4>
                  <p className="text-sm opacity-90 font-normal">{metric.description}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Rating</Label>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{currentValue}</span>
                    <span className={`block text-sm ${ratingInfo.color}`}>
                      {ratingInfo.label}
                    </span>
                  </div>
                </div>
                
                <div className="px-2">
                  <Slider
                    value={[currentValue]}
                    onValueChange={(values) => handleRatingChange(metric.key, values[0])}
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
                
                {/* Visual indicators */}
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div
                      key={rating}
                      className={`h-2 flex-1 rounded ${
                        rating <= currentValue
                          ? 'bg-gradient-to-r ' + metric.gradient
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Performance Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Be honest in your self-assessment to track real progress</li>
          <li>• Consider the conditions and opponent strength when rating</li>
          <li>• Use these ratings to identify areas for improvement</li>
        </ul>
      </div>
    </div>
  );
}
