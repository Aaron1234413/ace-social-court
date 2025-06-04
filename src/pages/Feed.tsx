
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
import { MessageSquare, Heart, Clock, Activity, Zap } from 'lucide-react';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Loading } from '@/components/ui/loading';
import { useLocation } from 'react-router-dom';
import { AmbassadorSeedingService } from '@/services/AmbassadorSeedingService';
import { PostComposer } from '@/components/social/PostComposer';
import { Card, CardContent } from '@/components/ui/card';

type SortOption = 'recent' | 'popular' | 'commented';

const Feed = () => {
  const location = useLocation();
  const { user, profile, isProfileComplete } = useAuth();
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [ambassadorSeeded, setAmbassadorSeeded] = useState(false);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  
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
  
  // Debug logging for Feed component
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

  // Initialize ambassador seeding on component mount
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
    // Initialize storage in the background without blocking UI
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

  // Record load time when posts are loaded
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      recordLoadTime();
    }
  }, [isLoading, posts.length, recordLoadTime]);

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOption(value as SortOption);
      // Note: For now, we're not implementing sort in cascade
      // The cascade already provides optimized ordering
    }
  };

  const handlePostUpdated = () => {
    console.log("Feed: Post updated, refreshing posts");
    refresh();
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Social Feed</h1>
        
        {user && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
            >
              <Activity className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Performance Metrics Panel */}
      {showPerformanceMetrics && (
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
      
      {user && (
        <div className="mb-5 overflow-x-auto pb-1">
          <ToggleGroup 
            type="single" 
            value={sortOption}
            onValueChange={handleSortChange}
            className="justify-start whitespace-nowrap"
          >
            <ToggleGroupItem value="recent" aria-label="Sort by recent">
              <Clock className="h-4 w-4 mr-1" /> Recent
            </ToggleGroupItem>
            <ToggleGroupItem value="popular" aria-label="Sort by likes">
              <Heart className="h-4 w-4 mr-1" /> Popular
            </ToggleGroupItem>
            <ToggleGroupItem value="commented" aria-label="Sort by comments">
              <MessageSquare className="h-4 w-4 mr-1" /> Discussed
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      {user ? (
        <>
          <div className="mb-6">
            <PostComposer onSuccess={refresh} />
          </div>
          
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
                <VirtualizedList
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
                  itemHeight={250}
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
        <div className="bg-gray-100 rounded-lg p-6 md:p-8 text-center">
          <p className="text-base md:text-lg mb-4">Please log in to view the social feed</p>
          <Button onClick={() => window.location.href = '/auth'}>Sign In</Button>
        </div>
      )}
    </div>
  );
};

export default Feed;
