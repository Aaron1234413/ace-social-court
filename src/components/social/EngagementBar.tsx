
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Fire, Users, Lightbulb } from 'lucide-react';
import { EngagementMetrics, BaselineData } from '@/services/EngagementMetrics';

interface EngagementBarProps {
  className?: string;
}

export function EngagementBar({ className = '' }: EngagementBarProps) {
  const [baselines, setBaselines] = useState<BaselineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBaselines = async () => {
      try {
        const data = await EngagementMetrics.getBaselineData();
        setBaselines(data);
      } catch (error) {
        console.error('Error fetching baselines:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBaselines();
  }, []);

  if (isLoading || !baselines) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ${className}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <span className="text-sm text-purple-700">Loading engagement metrics...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 ${className}`}>
      <div className="flex flex-col space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">Community Engagement Baseline</span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Ambassador Post Engagement */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
              <Users className="h-3 w-3 mr-1" />
              Ambassador Posts
            </Badge>
            <span className="text-xs text-purple-600">
              ~{baselines.ambassador_posts_reactions_per_day} reactions/day
            </span>
          </div>

          {/* Fire Reactions */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              <Fire className="h-3 w-3 mr-1" />
              Fire Reactions
            </Badge>
            <span className="text-xs text-orange-600">
              {baselines.ambassador_fire_reactions_per_24h} 🔥 per 24h
            </span>
          </div>

          {/* Coach Engagement */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              <Lightbulb className="h-3 w-3 mr-1" />
              Coach Activity
            </Badge>
            <span className="text-xs text-blue-600">
              {baselines.coach_engagement_per_day} interactions/day
            </span>
          </div>
        </div>

        {/* Additional Context */}
        <div className="text-xs text-purple-600 bg-purple-100/50 rounded-md p-2">
          💡 <strong>Tip:</strong> Ambassador patterns show coaches engage {baselines.coach_engagement_per_day} times per day. 
          Quality tips average {baselines.average_tip_quality_score}/5 rating.
        </div>
      </div>
    </Card>
  );
}
