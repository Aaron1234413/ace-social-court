
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFeedCascade } from '@/hooks/useFeedCascade';
import { useUserFollows } from '@/hooks/useUserFollows';
import { useAuth } from '@/components/AuthProvider';
import { FeedFilter } from '@/services/FeedQueryCascade';
import { Users, Globe, Compass, TestTube, RefreshCw } from 'lucide-react';

export function FeedFilterTester() {
  const { user } = useAuth();
  const { following, followingCount } = useUserFollows();
  const [selectedFilter, setSelectedFilter] = useState<FeedFilter>('all');
  
  const { 
    posts, 
    isLoading, 
    metrics, 
    debugData, 
    currentFilter,
    refresh 
  } = useFeedCascade({ filter: selectedFilter });

  const testFilters = [
    { 
      value: 'all' as FeedFilter, 
      label: 'All Posts', 
      icon: Globe,
      description: 'Mixed content from followed users + ambassadors + public posts'
    },
    { 
      value: 'following' as FeedFilter, 
      label: 'Following', 
      icon: Users,
      description: 'Posts from followed users + followed ambassadors + some quality ambassadors'
    },
    { 
      value: 'discover' as FeedFilter, 
      label: 'Discover', 
      icon: Compass,
      description: 'Public posts excluding followed users + ambassador content for quality'
    }
  ];

  const analyzePostSources = () => {
    if (!posts.length) return null;

    const followingUserIds = following.map(f => f.following_id);
    const analysis = {
      total: posts.length,
      fromFollowed: posts.filter(p => followingUserIds.includes(p.user_id)).length,
      fromAmbassadors: posts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length,
      fromOthers: posts.filter(p => 
        !followingUserIds.includes(p.user_id) && 
        !(p.author?.user_type === 'ambassador' || p.is_ambassador_content)
      ).length,
      ownPosts: posts.filter(p => p.user_id === user?.id).length
    };

    return analysis;
  };

  const analysis = analyzePostSources();

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <TestTube className="h-5 w-5" />
          Feed Filter Testing Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Test Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            Current Filter: 
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {currentFilter}
            </Badge>
            {followingCount > 0 && (
              <Badge variant="outline">
                Following: {followingCount}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {testFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.value}
                  variant={selectedFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.value)}
                  className="flex items-center justify-start gap-2 h-auto p-3"
                  disabled={isLoading}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{filter.label}</div>
                    <div className="text-xs opacity-75">{filter.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh(selectedFilter)}
            disabled={isLoading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </Button>
        </div>

        {/* Results Analysis */}
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-3">
            {analysis && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium">Total Posts</div>
                  <div className="text-lg font-bold text-blue-600">{analysis.total}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium">From Followed</div>
                  <div className="text-lg font-bold text-green-600">{analysis.fromFollowed}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium">Ambassadors</div>
                  <div className="text-lg font-bold text-purple-600">{analysis.fromAmbassadors}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium">Other Users</div>
                  <div className="text-lg font-bold text-gray-600">{analysis.fromOthers}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="font-medium">Your Posts</div>
                  <div className="text-lg font-bold text-blue-600">{analysis.ownPosts}</div>
                </div>
              </div>
            )}

            {/* Filter Validation */}
            <div className="bg-white p-3 rounded border">
              <div className="font-medium mb-2">Filter Validation</div>
              <div className="space-y-1 text-sm">
                {selectedFilter === 'following' && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      analysis && analysis.fromFollowed > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    Following filter should show posts from followed users
                    {analysis && (
                      <Badge variant="secondary" className="text-xs">
                        {analysis.fromFollowed}/{analysis.total}
                      </Badge>
                    )}
                  </div>
                )}
                
                {selectedFilter === 'discover' && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      analysis && analysis.fromFollowed === 0 ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    Discover filter should exclude followed users
                    {analysis && analysis.fromFollowed > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        Found {analysis.fromFollowed} from followed users!
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    analysis && analysis.fromAmbassadors >= 3 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  Should have quality ambassador content (min 3)
                  {analysis && (
                    <Badge variant="secondary" className="text-xs">
                      {analysis.fromAmbassadors} ambassadors
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-3">
            {metrics.length > 0 && (
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <div key={index} className="bg-white p-3 rounded border flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{metric.level}</div>
                      <div className="text-muted-foreground">{metric.source}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{metric.postCount} posts</div>
                      <div className="text-muted-foreground">{Math.round(metric.queryTime)}ms</div>
                      {metric.errorCount && metric.errorCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {metric.errorCount} errors
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="debug" className="space-y-3">
            {debugData && (
              <div className="bg-white p-3 rounded border text-xs">
                <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
