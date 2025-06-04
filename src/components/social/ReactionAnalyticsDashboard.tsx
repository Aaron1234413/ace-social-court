
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Flame, Lightbulb, Trophy, TrendingUp } from 'lucide-react';
import { useReactionAnalytics } from '@/hooks/useReactionAnalytics';
import { Loading } from '@/components/ui/loading';

const REACTION_ICONS = {
  love: Heart,
  fire: Flame,
  tip: Lightbulb,
  achievement: Trophy
};

const REACTION_COLORS = {
  love: 'text-red-500',
  fire: 'text-orange-500',
  tip: 'text-yellow-500',
  achievement: 'text-purple-500'
};

interface ReactionAnalyticsDashboardProps {
  timeframe?: 'day' | 'week' | 'month';
  className?: string;
}

export function ReactionAnalyticsDashboard({ 
  timeframe = 'week', 
  className = '' 
}: ReactionAnalyticsDashboardProps) {
  const { analytics, isLoading, error } = useReactionAnalytics(timeframe);

  if (isLoading) {
    return <Loading variant="skeleton" count={1} text="Loading analytics..." />;
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-muted-foreground">Failed to load reaction analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reactions</p>
                <p className="text-2xl font-bold">{analytics.totalReactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Ambassador Engagement</p>
              <p className="text-2xl font-bold">
                {Math.round(analytics.ambassadorEngagement.ambassadorReactionRate * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.ambassadorEngagement.totalAmbassadorReactions} reactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Reactions by Type</p>
            <div className="flex gap-3">
              {Object.entries(analytics.reactionsByType).map(([type, count]) => {
                const Icon = REACTION_ICONS[type as keyof typeof REACTION_ICONS];
                const color = REACTION_COLORS[type as keyof typeof REACTION_COLORS];
                
                return (
                  <div key={type} className="flex items-center gap-1">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Reacted Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Reacted Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topReactedPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No reactions in this timeframe</p>
            ) : (
              analytics.topReactedPosts.map((post, index) => (
                <div key={post.post_id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">#{index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content_preview}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {post.total_reactions} reactions
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
