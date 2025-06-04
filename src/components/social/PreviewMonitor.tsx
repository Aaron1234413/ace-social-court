
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreviewService } from '@/services/PreviewService';
import { Activity, RefreshCw, Trash2, TrendingUp, Clock, Target } from 'lucide-react';

export function PreviewMonitor() {
  const { getStats, clearCache } = usePreviewService();
  const [stats, setStats] = useState(getStats());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [getStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
    setStats(getStats());
    setIsRefreshing(false);
  };

  const handleClearCache = () => {
    clearCache();
    setStats(getStats());
  };

  const getPerformanceStatus = () => {
    if (stats.avgResponseTime < 100) return { label: 'Excellent', color: 'bg-green-500' };
    if (stats.avgResponseTime < 300) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Needs Attention', color: 'bg-red-500' };
  };

  const getCacheStatus = () => {
    if (stats.hitRate > 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (stats.hitRate > 60) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  const performanceStatus = getPerformanceStatus();
  const cacheStatus = getCacheStatus();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Preview Service Monitor
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Cache
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Response Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {stats.avgResponseTime.toFixed(0)}ms
              </span>
              <Badge className={`${performanceStatus.color} text-white`}>
                {performanceStatus.label}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache Hit Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {stats.hitRate.toFixed(1)}%
              </span>
              <Badge className={`${cacheStatus.color} text-white`}>
                {cacheStatus.label}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Requests</span>
            </div>
            <span className="text-2xl font-bold">{stats.totalRequests}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cache Hits</span>
            </div>
            <span className="text-2xl font-bold text-green-600">{stats.hits}</span>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Cache Misses</span>
            <span className="block text-lg font-semibold text-red-600">{stats.misses}</span>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Last Cleanup</span>
            <span className="block text-lg font-semibold">
              {new Date(stats.lastCleanup).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Badge variant={stats.avgResponseTime < 300 ? "default" : "destructive"}>
            {stats.avgResponseTime < 300 ? "✅" : "⚠️"} Response Time Goal: &lt;300ms
          </Badge>
          <Badge variant={stats.hitRate > 80 ? "default" : "destructive"}>
            {stats.hitRate > 80 ? "✅" : "⚠️"} Cache Hit Rate Goal: &gt;80%
          </Badge>
          <Badge variant="default">
            ✅ No Stale Data (TTL: 5min)
          </Badge>
        </div>

        {/* Performance Tips */}
        {(stats.avgResponseTime > 300 || stats.hitRate < 80) && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-1">Performance Tips</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {stats.avgResponseTime > 300 && (
                <li>• Consider optimizing preview generation logic</li>
              )}
              {stats.hitRate < 80 && (
                <li>• Cache hit rate is low - consider increasing TTL or optimizing cache keys</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
