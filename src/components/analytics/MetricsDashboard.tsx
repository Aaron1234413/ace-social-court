
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Target, 
  Clock,
  Eye,
  MousePointer
} from 'lucide-react';
import { EngagementMetrics } from '@/services/EngagementMetrics';
import { IntentTracker } from '@/services/IntentTracker';
import { useAuth } from '@/components/AuthProvider';

export function MetricsDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user?.id) return;

      try {
        const [
          userStats,
          baselines,
          privacyBehavior
        ] = await Promise.all([
          EngagementMetrics.getUserEngagementStats(user.id, 30),
          EngagementMetrics.getBaselineData(),
          IntentTracker.getPrivacyBehaviorAnalytics(user.id)
        ]);

        // Mock time series data
        const timeSeriesData = Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          reactions: Math.floor(Math.random() * 10) + 5,
          prompts: Math.floor(Math.random() * 5) + 2,
          dashboard: Math.floor(Math.random() * 8) + 3
        }));

        const engagementTypes = [
          { name: 'Post Reactions', value: userStats.post_reactions, color: '#8b5cf6' },
          { name: 'Dashboard Usage', value: userStats.dashboard_usage, color: '#3b82f6' },
          { name: 'Prompt Clicks', value: userStats.prompt_clicks, color: '#10b981' },
          { name: 'Privacy Changes', value: userStats.privacy_changes, color: '#f59e0b' }
        ];

        setMetrics({
          userStats,
          baselines,
          privacyBehavior,
          timeSeriesData,
          engagementTypes
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  const { userStats, baselines, privacyBehavior, timeSeriesData, engagementTypes } = metrics;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Interactions</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {userStats.total_interactions}
            </div>
            <div className="text-xs text-muted-foreground">Last 30 days</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Post Reactions</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {userStats.post_reactions}
            </div>
            <div className="text-xs text-muted-foreground">
              vs {baselines.ambassador_posts_reactions_per_day}/day baseline
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Prompt CTR</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {Math.round(baselines.prompt_click_through_rate * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Click-through rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Privacy Intent</span>
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {Math.round(privacyBehavior.conversion_rate * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Intent → Action conversion</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Activity Breakdown</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                7-Day Engagement Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="reactions" stroke="#8b5cf6" strokeWidth={2} />
                    <Line type="monotone" dataKey="prompts" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="dashboard" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Engagement Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementTypes}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {engagementTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {engagementTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-sm">{type.name}</span>
                      </div>
                      <Badge variant="outline">{type.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Privacy Dropdown Behavior
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">Conversion Rate</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(privacyBehavior.conversion_rate * 100)}%
                    </div>
                    <div className="text-xs text-blue-600">Intent matches final action</div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-800">Avg. Hesitation</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {privacyBehavior.average_hesitation_score}/5
                    </div>
                    <div className="text-xs text-orange-600">Time + interactions score</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium">Most Common Flow</div>
                    <Badge className="bg-purple-100 text-purple-700">
                      {privacyBehavior.most_common_flow}
                    </Badge>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Total Changes</div>
                    <div className="text-lg font-semibold">{privacyBehavior.total_privacy_changes}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ambassador Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Ambassador Baseline Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Ambassador Daily Reactions</div>
              <div className="text-2xl font-bold text-purple-800">
                {baselines.ambassador_posts_reactions_per_day}
              </div>
              <div className="text-xs text-purple-600">vs your {userStats.post_reactions} (7d)</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">🔥 Reactions (24h)</div>
              <div className="text-2xl font-bold text-orange-800">
                {baselines.ambassador_fire_reactions_per_24h}
              </div>
              <div className="text-xs text-orange-600">Ambassador baseline</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Coach Interactions</div>
              <div className="text-2xl font-bold text-blue-800">
                {baselines.coach_engagement_per_day}/day
              </div>
              <div className="text-xs text-blue-600">Coach activity baseline</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
