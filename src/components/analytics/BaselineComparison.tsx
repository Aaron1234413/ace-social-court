
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Target, Activity } from 'lucide-react';
import { EngagementMetrics } from '@/services/EngagementMetrics';
import { useAuth } from '@/components/AuthProvider';

interface BaselineComparisonProps {
  className?: string;
}

export function BaselineComparison({ className = '' }: BaselineComparisonProps) {
  const { user } = useAuth();
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComparisonData = async () => {
      if (!user?.id) return;

      try {
        const [baselines, userStats] = await Promise.all([
          EngagementMetrics.getBaselineData(),
          EngagementMetrics.getUserEngagementStats(user.id)
        ]);

        // Create comparison data for charts
        const chartData = [
          {
            metric: 'Post Reactions',
            ambassador: baselines.ambassador_posts_reactions_per_day,
            user: userStats.post_reactions,
            target: Math.round(baselines.ambassador_posts_reactions_per_day * 0.7)
          },
          {
            metric: 'Dashboard Usage',
            ambassador: baselines.coach_engagement_per_day,
            user: userStats.dashboard_usage,
            target: Math.round(baselines.coach_engagement_per_day * 0.8)
          },
          {
            metric: 'Prompt Clicks',
            ambassador: Math.round(baselines.prompt_click_through_rate * 100),
            user: userStats.prompt_clicks,
            target: Math.round(baselines.prompt_click_through_rate * 70)
          }
        ];

        setComparisonData({
          baselines,
          userStats,
          chartData
        });
      } catch (error) {
        console.error('Error fetching comparison data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComparisonData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Loading Engagement Comparison...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) {
    return null;
  }

  const { baselines, userStats, chartData } = comparisonData;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Ambassador vs Your Engagement
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Compare your activity with community baselines
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {baselines.ambassador_posts_reactions_per_day}
            </div>
            <div className="text-xs text-purple-600">Ambassador Daily Reactions</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {baselines.ambassador_fire_reactions_per_24h}
            </div>
            <div className="text-xs text-orange-600">🔥 Reactions per 24h</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {baselines.coach_engagement_per_day}
            </div>
            <div className="text-xs text-blue-600">Coach Interactions/Day</div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="ambassador" fill="#8b5cf6" name="Ambassador Baseline" />
              <Bar dataKey="user" fill="#3b82f6" name="Your Activity" />
              <Bar dataKey="target" fill="#10b981" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Badges */}
        <div className="flex flex-wrap gap-2">
          {userStats.post_reactions >= chartData[0]?.target && (
            <Badge className="bg-green-100 text-green-700">
              <Target className="h-3 w-3 mr-1" />
              Reaction Goal Met
            </Badge>
          )}
          {userStats.dashboard_usage >= chartData[1]?.target && (
            <Badge className="bg-blue-100 text-blue-700">
              <Users className="h-3 w-3 mr-1" />
              Dashboard Power User
            </Badge>
          )}
          {userStats.total_interactions > 0 && (
            <Badge className="bg-purple-100 text-purple-700">
              <Activity className="h-3 w-3 mr-1" />
              Active Community Member
            </Badge>
          )}
        </div>

        {/* Insights */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">💡 Insights</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>• Ambassador content typically gets {baselines.ambassador_posts_reactions_per_day} reactions daily</div>
            <div>• Quality tip comments average {baselines.average_tip_quality_score}/5 rating</div>
            <div>• Coaches engage with dashboard features {baselines.coach_engagement_per_day} times per day</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
