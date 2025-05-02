
import React from 'react';
import { TechniqueDetection } from '@/services/VideoAnalysisService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface TechniqueDetailsProps {
  detection: TechniqueDetection | null;
}

const TechniqueDetails: React.FC<TechniqueDetailsProps> = ({ detection }) => {
  if (!detection) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Technique Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Select a detected technique to see analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Convert technique type to a more readable format
  const formatTechniqueType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get color based on confidence score
  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{formatTechniqueType(detection.techniqueType)}</CardTitle>
          <Badge variant={detection.confidence > 0.7 ? "default" : "outline"}>
            {Math.round(detection.confidence * 100)}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-gray-500">Technique Quality</span>
              <span className={`font-medium ${getConfidenceColor(detection.confidence)}`}>
                {detection.confidence >= 0.8 ? 'Excellent' : 
                 detection.confidence >= 0.6 ? 'Good' : 
                 detection.confidence >= 0.4 ? 'Fair' : 'Needs Improvement'}
              </span>
            </div>
            <Progress value={detection.confidence * 100} className="h-2" />
          </div>

          {detection.notes && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Technique Feedback:</h4>
              <p className="text-sm">{detection.notes}</p>
            </div>
          )}
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Coach Tips:</h4>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {detection.techniqueType === 'forehand' && (
                <>
                  <li>Keep your wrist firm through contact</li>
                  <li>Follow through towards your target</li>
                  <li>Rotate your shoulders for power</li>
                </>
              )}
              {detection.techniqueType === 'backhand' && (
                <>
                  <li>Use both hands for stability</li>
                  <li>Shift your weight forward during the swing</li>
                  <li>Keep your front shoulder down</li>
                </>
              )}
              {detection.techniqueType === 'serve' && (
                <>
                  <li>Toss the ball consistently</li>
                  <li>Bend your knees for power</li>
                  <li>Fully extend your arm at contact</li>
                </>
              )}
              {detection.techniqueType === 'volley' && (
                <>
                  <li>Step forward with opposite foot</li>
                  <li>Keep a firm wrist</li>
                  <li>Short backswing for control</li>
                </>
              )}
              {detection.techniqueType === 'smash' && (
                <>
                  <li>Track the ball with your non-racquet hand</li>
                  <li>Position yourself underneath the ball</li>
                  <li>Use a similar motion to your serve</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TechniqueDetails;
