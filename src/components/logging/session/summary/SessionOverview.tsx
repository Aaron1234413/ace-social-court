
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface SessionOverviewProps {
  selectedPillars: string[];
  aiSuggestionsUsed: boolean;
  pillarsConfig: Record<string, {
    title: string;
    emoji: string;
    gradient: string;
    bgGradient: string;
  }>;
}

export default function SessionOverview({
  selectedPillars,
  aiSuggestionsUsed,
  pillarsConfig
}: SessionOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          Session Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600">Pillars Tracked</p>
            <div className="flex gap-2 mt-1">
              {selectedPillars.map((pillar) => {
                const config = pillarsConfig[pillar as keyof typeof pillarsConfig];
                return (
                  <Badge key={pillar} className={`bg-gradient-to-r ${config.gradient} text-white`}>
                    {config.emoji} {config.title}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-medium">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        {aiSuggestionsUsed && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
            <span>🤖</span>
            <span>AI suggestions were used during this session</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
