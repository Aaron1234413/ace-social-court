
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface PhysicalData {
  energyLevel: string;
  courtCoverage: number;
  endurance: number;
  strengthFeeling: number;
  notes: string;
}

interface MentalData {
  emotionEmoji: string;
  confidence: number;
  motivation: number;
  anxiety: number;
  focus: number;
  reflection: string;
}

interface TechnicalData {
  selectedStrokes: Record<string, any>;
  notes: string;
  drillSuggestions: string[];
}

interface PillarData {
  physical?: PhysicalData;
  mental?: MentalData;
  technical?: TechnicalData;
}

interface SessionValidationProps {
  pillarData: PillarData;
  selectedPillars: string[];
  completedPillars: string[];
  aiSuggestionsUsed: boolean;
}

export default function SessionValidation({ 
  pillarData, 
  selectedPillars, 
  completedPillars,
  aiSuggestionsUsed 
}: SessionValidationProps) {
  const validatePillar = (pillar: string) => {
    const data = pillarData[pillar as keyof PillarData];
    
    if (!data) return { valid: false, message: 'No data provided' };
    
    switch (pillar) {
      case 'physical':
        const physicalData = data as PhysicalData;
        if (!physicalData.energyLevel) return { valid: false, message: 'Energy level required' };
        if (!physicalData.courtCoverage) return { valid: false, message: 'Court coverage required' };
        return { valid: true, message: 'Complete' };
        
      case 'mental':
        const mentalData = data as MentalData;
        if (!mentalData.emotionEmoji) return { valid: false, message: 'Emotion state required' };
        if (!mentalData.confidence) return { valid: false, message: 'Confidence rating required' };
        return { valid: true, message: 'Complete' };
        
      case 'technical':
        const technicalData = data as TechnicalData;
        if (!technicalData.selectedStrokes || Object.keys(technicalData.selectedStrokes).length === 0) {
          return { valid: false, message: 'At least one stroke required' };
        }
        return { valid: true, message: 'Complete' };
        
      default:
        return { valid: false, message: 'Unknown pillar' };
    }
  };

  const allPillarsValid = selectedPillars.every(pillar => validatePillar(pillar).valid);
  const progressPercentage = (completedPillars.length / selectedPillars.length) * 100;

  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-blue-600" />
          Session Validation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {completedPillars.length}/{selectedPillars.length} pillars
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Pillar Validation Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Pillar Status:</h4>
          {selectedPillars.map((pillar) => {
            const validation = validatePillar(pillar);
            const isCompleted = completedPillars.includes(pillar);
            
            return (
              <div key={pillar} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {validation.valid ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                  <span className="capitalize text-sm">{pillar}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={validation.valid ? "default" : "secondary"}
                    className={`text-xs ${validation.valid ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                  >
                    {validation.message}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Usage */}
        {aiSuggestionsUsed && (
          <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-purple-800">AI suggestions were used</span>
          </div>
        )}

        {/* Data Structure Preview */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Data Structure:</h4>
          <div className="bg-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">
            <pre>{JSON.stringify({ pillarData, selectedPillars, aiSuggestionsUsed }, null, 2)}</pre>
          </div>
        </div>

        {/* Submission Readiness */}
        <div className={`p-3 rounded-lg ${allPillarsValid ? 'bg-green-100' : 'bg-orange-100'}`}>
          <div className="flex items-center gap-2">
            {allPillarsValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
            <span className={`font-medium ${allPillarsValid ? 'text-green-800' : 'text-orange-800'}`}>
              {allPillarsValid ? 'Ready for submission' : 'Complete all pillars before submitting'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
