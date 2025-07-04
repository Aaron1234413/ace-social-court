import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { FeedBubble } from '@/components/social/FeedBubble';
import { useFeedCascade } from '@/hooks/useFeedCascade';
import { useFeedPerformance } from '@/hooks/useFeedPerformance';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MessageSquare, Heart, Clock, Activity, Zap, Bug, PlusCircle, TrendingUp, Users, Crown } from 'lucide-react';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Loading } from '@/components/ui/loading';
import { useLocation } from 'react-router-dom';
import { AmbassadorSeedingService } from '@/services/AmbassadorSeedingService';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent } from '@/components/ui/card';
import { PreviewService } from '@/services/PreviewService';
import { FeedAnalyticsService } from '@/services/FeedAnalyticsService';
import { useUserFollows } from '@/hooks/useUserFollows';
import { FeedDebugPanel } from '@/components/feed/FeedDebugPanel';
import { Post } from '@/types/post';
import { Virtuoso } from 'react-virtuoso';

const Feed = () => {
  // console.log('🎬 Feed component rendering...');
  
  
  const location = useLocation();
  const { user, profile, isProfileComplete } = useAuth();


  const { followingCount, following } = useUserFollows();
  const [ambassadorSeeded, setAmbassadorSeeded] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showCacheStats, setShowCacheStats] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  
  const userIdArray = React.useMemo(() => [user.id], [user.id]);
  const followingUserIds = React.useMemo(() => {
    return following.map(f => f.following_id);
  }, [following]);

  const { 
    posts, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    metrics,
    ambassadorPercentage,
    debugData,
    loadMore, 
    refresh,
    addNewPost
  } = useFeedCascade(userIdArray);
  
  const { 
    metrics: performanceMetrics, 
    recordLoadTime 
  } = useFeedPerformance();

  // Only show debug tools in development mode
  const isDevelopment = import.meta.env.DEV;

  // Calculate feed composition stats
  const feedStats = React.useMemo(() => {
    if (!posts.length) return null;
    
    const ambassadorCount = posts.filter(p => p.is_ambassador_content || p.author?.user_type === 'ambassador').length;
    const followedCount = posts.filter(p => {
      const followingIds = following.map(f => f.following_id);
      return followingIds.includes(p.user_id) && !p.is_ambassador_content;
    }).length;
    const publicCount = posts.length - ambassadorCount - followedCount;
    
    return {
      ambassador: Math.round((ambassadorCount / posts.length) * 100),
      followed: Math.round((followedCount / posts.length) * 100),
      public: Math.round((publicCount / posts.length) * 100),
      total: posts.length
    };
  }, [posts, following]);
    useEffect(() => {
      console.log('📌 following updated:', following.map(f => f.following_id));
    }, [following]);
    useEffect(() => {
      console.log('🔂 Feed mounted or updated');
    }, []);

  useEffect(() => {


    return () => {
      console.log('Feed component unmounting', {
        pathname: location.pathname
      });
    };
  }, [location.pathname, user, profile]);


  useEffect(() => {
  (async () => {
    try {
      await AmbassadorSeedingService.checkAndSeedAmbassadors();
    } catch (e) {
      console.warn("Ambassador seeding failed:", e);
    }
  })();
}, []);


  useEffect(() => {
    const setupStorage = async () => {
      try {
        if (user) {
          // console.log('Feed: Initializing storage in background...');
          const result = await initializeStorage();
          // console.log('Feed: Storage initialization completed:', result);
        }
      } catch (err) {
        // console.warn('Storage initialization failed, but continuing:', err);
      }
    };
    
    setupStorage();
  }, [user]);

  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      recordLoadTime();
    }
  }, [isLoading, posts.length, recordLoadTime]);

  const handlePostUpdated = () => {
    // console.log("Feed: Post updated, refreshing posts");
    refresh();
  };

  const handlePostCreated = (newPost: Post) => {
    // console.log("Feed: New post created, adding optimistically:", newPost.id);
    addNewPost(newPost);
    setShowComposer(false);
  };

  const previewService = PreviewService.getInstance();
  const cacheStats = previewService.getCacheStats();

  // Fixed analytics service - use direct import instead of require
  const analyticsService = React.useMemo(() => {
    return FeedAnalyticsService.getInstance();
  }, []);

  const feedAnalytics = React.useMemo(() => {
    if (posts.length === 0) return null;
    // const followingUserIds = following.map((follow: any) => follow.following_id);
    // const followingUserIds = React.useMemo(() => following.map(f => f.following_id), [following]);
    return analyticsService.analyzeFeedQuality(posts, followingUserIds);
  }, [posts, analyticsService, following]);

  // console.log('🖼️ About to render Feed UI');

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 md:py-8">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Feed</h1>
            <p className="text-muted-foreground text-sm">
              Stay connected with your tennis community
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowComposer(!showComposer)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Post
            </Button>
            
            {/* Only show debug buttons in development mode */}
            {user && isDevelopment && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCacheStats(!showCacheStats)}
                  className="text-xs"
                >
                  Cache
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="text-xs"
                >
                  <Bug className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  Debug Panel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Feed Quality Indicator */}
        {/* {user && feedStats && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Feed Quality</h3>
                  <p className="text-sm text-gray-600">Personalized content mix</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">{feedStats.ambassador}% Ambassador</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{feedStats.followed}% Following</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{feedStats.public}% Discover</span>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Show post count and following info */}
        {/* {user && (
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
            <span>{posts.length} posts</span>
            {followingCount > 0 && (
              <>
                <span>•</span>
                <span>Following {followingCount}</span>
              </>
            )}
          </div>
        )} */}
      </div>

      {/* Enhanced Debug Panel - Only show in development */}
      {isDevelopment && (
        <FeedDebugPanel
          feedAnalytics={feedAnalytics}
          followedUsersDebug={debugData?.followedUsers}
          cascadeMetrics={metrics}
          isVisible={showDebugPanel}
          onToggle={() => setShowDebugPanel(!showDebugPanel)}
        />
      )}

      {/* Debug info panels - Only show in development */}
      {isDevelopment && showDebugInfo && debugData && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-medium text-blue-900 mb-2">🔍 Feed Debug Information</div>
                
                {debugData.followedUsers && (
                  <div className="mb-3">
                    <div className="font-medium">Following: {debugData.followedUsers.totalFollowing} users</div>
                    <div className="text-muted-foreground">Total posts from followed users: {debugData.followedUsers.totalPosts}</div>
                    {debugData.followedUsers.followedUsers.map((user: any, index: number) => (
                      <div key={index} className="ml-4 text-xs">
                        • {user.profile?.full_name || user.userId}: {user.totalPosts} posts 
                        {user.latestPost && <span className="text-muted-foreground"> (latest: {new Date(user.latestPost).toLocaleDateString()})</span>}
                      </div>
                    ))}
                  </div>
                )}

                {debugData.primaryQuery && (
                  <div className="mb-3 p-2 bg-white rounded border">
                    <div className="font-medium">Primary Query Results:</div>
                    <div className="text-xs">
                      • Raw posts found: {debugData.primaryQuery.rawPostCount}
                      • Formatted posts: {debugData.primaryQuery.formattedPostCount}
                      • Following count: {debugData.primaryQuery.followingCount}
                    </div>
                    {debugData.primaryQuery.postsByUser && (
                      <div className="mt-2">
                        <div className="font-medium text-xs">Posts by user:</div>
                        {Object.entries(debugData.primaryQuery.postsByUser).map(([userId, stats]: [string, any]) => (
                          <div key={userId} className="ml-2 text-xs">
                            • {userId}: {stats.count} posts (Privacy: {JSON.stringify(stats.privacyLevels)})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {debugData.ambassadorQuery && (
                  <div className="mb-3 p-2 bg-purple-50 rounded border">
                    <div className="font-medium">Ambassador Query Results:</div>
                    <div className="text-xs">
                      • Following ambassadors: {debugData.ambassadorQuery.followingAmbassadors.length}
                      • Posts from followed ambassadors: {debugData.ambassadorQuery.followedAmbassadorPosts}
                      • Posts from other ambassadors: {debugData.ambassadorQuery.otherAmbassadorPosts}
                      • Total ambassador posts available: {debugData.ambassadorQuery.allAmbassadorPosts}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isDevelopment && showPerformanceMetrics && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Load Time</div>
                <div className="text-muted-foreground">{performanceMetrics.loadTime}ms</div>
              </div>
              <div>
                <div className="font-medium">Frame Rate</div>
                <div className="text-muted-foreground">{performanceMetrics.frameRate} FPS</div>
              </div>
              <div>
                <div className="font-medium">Memory</div>
                <div className="text-muted-foreground">{performanceMetrics.memoryUsage}MB</div>
              </div>
              <div>
                <div className="font-medium">Ambassador %</div>
                <div className="text-muted-foreground">{Math.round(ambassadorPercentage * 100)}%</div>
              </div>
            </div>
            {metrics.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs font-medium mb-2">Query Cascade</div>
                <div className="flex gap-2 text-xs">
                  {metrics.map((metric, index) => (
                    <span key={index} className="bg-muted px-2 py-1 rounded">
                      {metric.level}: {metric.postCount} posts
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isDevelopment && showCacheStats && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Cache Entries</div>
                <div className="text-muted-foreground">{cacheStats.totalEntries}</div>
              </div>
              <div>
                <div className="font-medium">Memory Usage</div>
                <div className="text-muted-foreground">{cacheStats.memoryUsage}KB</div>
              </div>
              <div>
                <div className="font-medium">Cache Fill</div>
                <div className="text-muted-foreground">{cacheStats.fillPercentage}%</div>
              </div>
              <div>
                <div className="font-medium">Max Size</div>
                <div className="text-muted-foreground">{cacheStats.maxSize}</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewService.clearCache()}
                className="text-xs"
              >
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {user ? (
        <>
          {/* Post Composer - Show/Hide based on state */}
          {showComposer && (
            <div className="mb-6 animate-fade-in">
              <PostComposer onSuccess={(post) => {
                if (post) {
                  console.log('✅ PostComposer success callback:', post);
                  handlePostCreated(post);
                  // Still refresh after a delay to ensure consistency
                  setTimeout(() => refresh(), 2000);
                }
              }} />
            </div>
          )}
          
          {isLoading ? (
            <Loading variant="skeleton" count={3} text="Loading posts..." />
          ) : (
            <>
              {posts.length === 0 && (
                <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-8 text-center border border-muted shadow-inner mb-6">
                  <div className="max-w-md mx-auto">
                    <div className="bg-muted/50 p-4 rounded-full inline-block mb-3">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Building your feed...</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      We're setting up inspiring content from our Rally Ambassadors while you build your network.
                    </p>
                    <Button onClick={() => window.location.href = '/search'} variant="outline">
                      Find People to Follow
                    </Button>
                  </div>
                </div>
              )}
              
              {posts.length > 0 && (
                <>
                  {/* Enhanced Feed Quality Indicator */}
                  {/* {feedAnalytics && (
                    <Card className="mb-6 border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-900">Feed Quality Score</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {feedAnalytics.qualityMetrics.diversityScore}/100
                            </Badge>
                          </div>
                          <div className="text-sm text-green-700">
                            {feedAnalytics.contentDiversity.followedUsersRepresented}/{debugData?.followedUsers?.totalFollowing || 0} followed users represented
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )} */}

                  {/* <VirtualizedList
                    items={posts}
                    renderItem={(post, index) => (
                      <div className="mb-6">
                        <FeedBubble
                          post={post}
                          currentUserId={user.id}
                          contentType={
                            post.author?.user_type === 'ambassador' || post.is_ambassador_content
                              ? 'ambassador'
                              : 'user'
                          }
                          onPostUpdated={handlePostUpdated}
                        />
                      </div>
                    )}
                    itemHeight={300}
                    // containerHeight={600}
                    onLoadMore={() => {console.log("👀 Feed: onLoadMore triggered");
                                            loadMore}}
                    hasMore={hasMore}
                    isLoading={isLoadingMore}
                    threshold={3}
                    className="min-h-[600px]"
                  /> */}

                    <div className="space-y-4">
                      {posts.map((post) => (
                        <FeedBubble
                          key={post.id}
                          post={post}
                          currentUserId={user.id}
                          contentType={
                            post.author?.user_type === 'ambassador' || post.is_ambassador_content
                              ? 'ambassador'
                              : 'user'
                          }
                          onPostUpdated={handlePostUpdated}
                        />
                      ))}
                    </div>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 md:p-8 text-center">
          
          <p className="text-base md:text-lg mb-4">Please log in to view the social feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
