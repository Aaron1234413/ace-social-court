
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Users, Clock, Filter, BarChart3, Zap } from 'lucide-react';
import { FeedAnalyticsService } from '@/services/FeedAnalyticsService';

interface FeedDebugPanelProps {
  feedAnalytics: any;
  followedUsersDebug: any;
  cascadeMetrics: any[];
  isVisible: boolean;
  onToggle: () => void;
}

export const FeedDebugPanel = ({
  feedAnalytics,
  followedUsersDebug,
  cascadeMetrics,
  isVisible,
  onToggle
}: FeedDebugPanelProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const analyticsService = FeedAnalyticsService.getInstance();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredContentReport = analyticsService.getFilteredContentReport();
  const performanceHistory = analyticsService.getPerformanceHistory();

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <BarChart3 className="h-4 w-4 mr-1" />
        Debug Feed
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] z-50 shadow-lg border-blue-200">
      <CardHeader className="pb-3 bg-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Feed Debug Panel
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ×
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <div className="p-4 space-y-4">
            
            {/* Performance Overview */}
            <Collapsible open={expandedSections.performance}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full p-2 bg-green-50 rounded hover:bg-green-100"
                onClick={() => toggleSection('performance')}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Performance Metrics</span>
                </div>
                {expandedSections.performance ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-green-50/50 rounded">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="font-medium">Query Time</div>
                    <div className="text-muted-foreground">{feedAnalytics?.performanceMetrics?.totalQueryTime || 0}ms</div>
                  </div>
                  <div>
                    <div className="font-medium">Cache Hit Rate</div>
                    <div className="text-muted-foreground">{Math.round((feedAnalytics?.performanceMetrics?.cacheHitRate || 0) * 100)}%</div>
                  </div>
                  <div>
                    <div className="font-medium">Cascade Levels</div>
                    <div className="text-muted-foreground">{cascadeMetrics?.length || 0}</div>
                  </div>
                  <div>
                    <div className="font-medium">Filtered Out</div>
                    <div className="text-muted-foreground">{feedAnalytics?.performanceMetrics?.filteredOutCount || 0}</div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Content Diversity */}
            <Collapsible open={expandedSections.diversity}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full p-2 bg-purple-50 rounded hover:bg-purple-100"
                onClick={() => toggleSection('diversity')}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Content Diversity</span>
                  <Badge variant="secondary" className="ml-2">
                    Score: {feedAnalytics?.qualityMetrics?.diversityScore || 0}
                  </Badge>
                </div>
                {expandedSections.diversity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-purple-50/50 rounded">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Followed Users Represented</span>
                      <span>{feedAnalytics?.contentDiversity?.followedUsersRepresented || 0}/{followedUsersDebug?.totalFollowing || 0}</span>
                    </div>
                    <Progress 
                      value={((feedAnalytics?.contentDiversity?.followedUsersRepresented || 0) / Math.max(followedUsersDebug?.totalFollowing || 1, 1)) * 100}
                      className="h-2"
                    />
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-2">User Distribution:</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {Object.entries(feedAnalytics?.contentDiversity?.userDistribution || {}).map(([userId, count]) => (
                        <div key={userId} className="flex justify-between">
                          <span className="truncate">{userId.substring(0, 8)}...</span>
                          <Badge variant="outline" className="text-xs">{String(count)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Followed Users Analysis */}
            <Collapsible open={expandedSections.users}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full p-2 bg-blue-50 rounded hover:bg-blue-100"
                onClick={() => toggleSection('users')}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Followed Users ({followedUsersDebug?.totalFollowing || 0})</span>
                </div>
                {expandedSections.users ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-blue-50/50 rounded">
                <div className="text-sm">
                  <div className="mb-2">
                    <span className="font-medium">Total Posts from Followed Users: </span>
                    <Badge variant="secondary">{followedUsersDebug?.totalPosts || 0}</Badge>
                  </div>
                  
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {followedUsersDebug?.followedUsers?.map((user: any, index: number) => (
                      <div key={index} className="p-2 bg-white rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{user.profile?.full_name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">{user.userId.substring(0, 8)}...</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{user.totalPosts} posts</Badge>
                            {user.latestPost && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Latest: {new Date(user.latestPost).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {user.privacyLevels && (
                          <div className="mt-2 flex gap-1">
                            {Object.entries(user.privacyLevels).map(([level, count]) => (
                              <Badge key={level} variant="secondary" className="text-xs">
                                {level}: {String(count)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )) || <div className="text-muted-foreground">No followed users data available</div>}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Filtered Content */}
            <Collapsible open={expandedSections.filtered}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full p-2 bg-orange-50 rounded hover:bg-orange-100"
                onClick={() => toggleSection('filtered')}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Filtered Content</span>
                  <Badge variant="destructive" className="ml-2">
                    {filteredContentReport.reduce((sum, f) => sum + f.count, 0)}
                  </Badge>
                </div>
                {expandedSections.filtered ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-orange-50/50 rounded">
                <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                  {filteredContentReport.map((filter, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{filter.reason}</span>
                        <Badge variant="outline">{filter.count}</Badge>
                      </div>
                      {filter.examples.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <div>Examples:</div>
                          {filter.examples.map((example, i) => (
                            <div key={i} className="truncate">
                              • {example.content}...
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredContentReport.length === 0 && (
                    <div className="text-muted-foreground">No content filtered</div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Cascade Metrics */}
            <Collapsible open={expandedSections.cascade}>
              <CollapsibleTrigger
                className="flex items-center justify-between w-full p-2 bg-gray-50 rounded hover:bg-gray-100"
                onClick={() => toggleSection('cascade')}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">Cascade Performance</span>
                </div>
                {expandedSections.cascade ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-3 bg-gray-50/50 rounded">
                <div className="space-y-2 text-sm">
                  {cascadeMetrics.map((metric, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{metric.level}</span>
                        <div className="text-right">
                          <Badge variant="outline">{metric.postCount} posts</Badge>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(metric.queryTime)}ms
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Source: {metric.source}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => analyticsService.clearAnalytics()}
                className="w-full text-xs"
              >
                Clear Analytics Data
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
