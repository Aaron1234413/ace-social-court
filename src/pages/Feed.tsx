import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { VirtualizedList } from '@/components/ui/virtualized-list';
import { FeedBubble } from '@/components/social/FeedBubble';
import { useFeedCascade } from '@/hooks/useFeedCascade';
import { useFeedPerformance } from '@/hooks/useFeedPerformance';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MessageSquare, Heart, Clock, Activity, Zap, Crown } from 'lucide-react';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Loading } from '@/components/ui/loading';
import { useLocation } from 'react-router-dom';
import { AmbassadorSeedingService } from '@/services/AmbassadorSeedingService';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent } from '@/components/ui/card';
import { PreviewService } from '@/services/PreviewService';
import { Badge } from '@/components/ui/badge';

type SortOption = 'recent' | 'popular' | 'commented';

const Feed = () => {
  const location = useLocation();
  const { user, profile, isProfileComplete } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [ambassadorSeeded, setAmbassadorSeeded] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showCacheStats, setShowCacheStats] = useState(false);
  
  const { 
    posts, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    metrics,
    ambassadorPercentage,
    loadMore, 
    refresh 
  } = useFeedCascade();
  
  const { 
    metrics: performanceMetrics, 
    recordLoadTime 
  } = useFeedPerformance();

  useEffect(() => {
    console.log('Feed component mounted', {
      pathname: location.pathname,
      userId: user?.id,
      hasProfile: !!profile
    });

    return () => {
      console.log('Feed component unmounting', {
        pathname: location.pathname
      });
    };
  }, [location.pathname, user, profile]);

  useEffect(() => {
    const initializeAmbassadors = async () => {
      if (!ambassadorSeeded) {
        console.log('🌱 Initializing ambassador safety net...');
        await AmbassadorSeedingService.checkAndSeedAmbassadors();
        setAmbassadorSeeded(true);
      }
    };
    
    initializeAmbassadors();
  }, [ambassadorSeeded]);

  useEffect(() => {
    const setupStorage = async () => {
      try {
        if (user) {
          console.log('Feed: Initializing storage in background...');
          const result = await initializeStorage();
          console.log('Feed: Storage initialization completed:', result);
        }
      } catch (err) {
        console.warn('Storage initialization failed, but continuing:', err);
      }
    };
    
    setupStorage();
  }, [user]);

  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      recordLoadTime();
    }
  }, [isLoading, posts.length, recordLoadTime]);

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOption(value as SortOption);
    }
  };

  const handlePostUpdated = () => {
    console.log("Feed: Post updated, refreshing posts");
    refresh();
  };

  const previewService = PreviewService.getInstance();
  const cacheStats = previewService.getCacheStats();

  // Calculate ambassador content percentage for showcase
  const ambassadorPosts = posts.filter(post => 
    post.author?.user_type === 'ambassador' || post.is_ambassador_content
  );
  const ambassadorPercentageDisplay = posts.length > 0 ? 
    Math.round((ambassadorPosts.length / posts.length) * 100) : 0;

  return (
    <div className="max-w-3xl w-full mx-auto py-3 md:py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold">Social Feed</h1>
          
          {/* Ambassador Content Indicator */}
          {ambassadorPosts.length > 0 && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
              <Crown className="h-3 w-3 mr-1" />
              {ambassadorPercentageDisplay}% Expert
            </Badge>
          )}
        </div>
        
        {user && (
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
          </div>
        )}
      </div>

      {/* Performance metrics - keep existing code */}
      {showPerformanceMetrics && (
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-medium text-xs">Load Time</div>
                <div className="text-muted-foreground text-xs">{performanceMetrics.loadTime}ms</div>
              </div>
              <div>
                <div className="font-medium text-xs">Frame Rate</div>
                <div className="text-muted-foreground text-xs">{performanceMetrics.frameRate} FPS</div>
              </div>
              <div>
                <div className="font-medium text-xs">Memory</div>
                <div className="text-muted-foreground text-xs">{performanceMetrics.memoryUsage}MB</div>
              </div>
              <div>
                <div className="font-medium text-xs">Ambassador %</div>
                <div className="text-muted-foreground text-xs">{Math.round(ambassadorPercentage * 100)}%</div>
              </div>
            </div>
            {metrics.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs font-medium mb-1">Query Cascade</div>
                <div className="flex gap-1 text-xs flex-wrap">
                  {metrics.map((metric, index) => (
                    <span key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs">
                      {metric.level}: {metric.postCount}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cache stats - keep existing code */}
      {showCacheStats && (
        <Card className="mb-3">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="font-medium text-xs">Cache Entries</div>
                <div className="text-muted-foreground text-xs">{cacheStats.totalEntries}</div>
              </div>
              <div>
                <div className="font-medium text-xs">Memory Usage</div>
                <div className="text-muted-foreground text-xs">{cacheStats.memoryUsage}KB</div>
              </div>
              <div>
                <div className="font-medium text-xs">Cache Fill</div>
                <div className="text-muted-foreground text-xs">{cacheStats.fillPercentage}%</div>
              </div>
              <div>
                <div className="font-medium text-xs">Max Size</div>
                <div className="text-muted-foreground text-xs">{cacheStats.maxSize}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewService.clearCache()}
                className="text-xs h-7"
              >
                Clear Cache
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {user && (
        <div className="mb-3 overflow-x-auto pb-1">
          <ToggleGroup 
            type="single" 
            value={sortOption}
            onValueChange={handleSortChange}
            className="justify-start whitespace-nowrap"
          >
            <ToggleGroupItem value="recent" aria-label="Sort by recent" className="text-xs">
              <Clock className="h-3 w-3 mr-1" /> Recent
            </ToggleGroupItem>
            <ToggleGroupItem value="popular" aria-label="Sort by likes" className="text-xs">
              <Heart className="h-3 w-3 mr-1" /> Popular
            </ToggleGroupItem>
            <ToggleGroupItem value="commented" aria-label="Sort by comments" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" /> Discussed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      {user ? (
        <>
          <div className="mb-3">
            <PostComposer onSuccess={refresh} />
          </div>
          
          {isLoading ? (
            <Loading variant="skeleton" count={3} text="Loading posts..." />
          ) : (
            <>
              {posts.length === 0 && (
                <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-6 text-center border border-muted shadow-inner mb-4">
                  <div className="max-w-md mx-auto">
                    <div className="bg-muted/50 p-3 rounded-full inline-block mb-3">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Building your feed...</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We're setting up inspiring content from our Rally Ambassadors while you build your network.
                    </p>
                    <Button onClick={() => window.location.href = '/search'} variant="outline" size="sm">
                      Find People to Follow
                    </Button>
                  </div>
                </div>
              )}
              
              {posts.length > 0 && (
                <VirtualizedList
                  items={posts}
                  renderItem={(post, index) => (
                    <div className="mb-2">
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
                  itemHeight={180}
                  containerHeight={600}
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                  threshold={3}
                  className="min-h-[600px]"
                />
              )}
            </>
          )}
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-6 text-center">
          <p className="text-base mb-4">Please log in to view the social feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
