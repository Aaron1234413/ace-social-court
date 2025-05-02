
import React from 'react';
import { VideoAnalysisResult } from '@/services/VideoAnalysisService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, AlertTriangle, Clock } from 'lucide-react';

interface AnalysisSummaryProps {
  result: VideoAnalysisResult;
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ result }) => {
  // Count occurrences of each technique type
  const techniqueCounts: Record<string, number> = {};
  result.techniques.forEach(technique => {
    const type = technique.techniqueType;
    techniqueCounts[type] = (techniqueCounts[type] || 0) + 1;
  });

  // Calculate average confidence score
  const avgConfidence = result.techniques.length > 0
    ? result.techniques.reduce((sum, t) => sum + t.confidence, 0) / result.techniques.length
    : 0;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const StatusBadge = () => {
    switch (result.status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex gap-1 items-center">
            <CircleCheck className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex gap-1 items-center">
            <Clock className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex gap-1 items-center">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex gap-1 items-center">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Analysis Summary</CardTitle>
          <StatusBadge />
        </div>
        <CardDescription>
          Analyzed on {formatDate(result.createdAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {result.summary && (
            <div>
              <h3 className="text-sm font-medium mb-2">Overall Assessment</h3>
              <p className="text-sm">{result.summary}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium mb-2">Detected Techniques</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(techniqueCounts).map(([technique, count]) => (
                <Badge key={technique} variant="outline" className="flex items-center gap-1">
                  <span className="capitalize">{technique}</span>
                  <span className="text-xs bg-gray-100 rounded-full px-1.5 py-0.5">
                    {count}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Average Technique Quality</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.round(avgConfidence * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Beginner</span>
              <span>Intermediate</span>
              <span>Advanced</span>
            </div>
          </div>
          
          {result.recommendedDrills && result.recommendedDrills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Recommended Drills</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {result.recommendedDrills.map((drill, index) => (
                  <li key={index}>{drill}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalysisSummary;
