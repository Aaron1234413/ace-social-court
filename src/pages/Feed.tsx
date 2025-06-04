import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { CreatePostForm } from '@/components/social/CreatePostForm';
import { PostComposer } from '@/components/social/PostComposer';
import { VirtualizedList } from '@/components/social/VirtualizedList';
import { usePostsPaginated } from '@/hooks/use-posts-paginated';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { usePerformanceMonitoring } from '@/utils/performanceMonitor';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MessageSquare, Heart, Clock, Activity } from 'lucide-react';
import { initializeStorage } from '@/integrations/supabase/storage';
import { Loading } from '@/components/ui/loading';
import { useLocation } from 'react-router-dom';
import { PreviewMonitor } from '@/components/social/PreviewMonitor';

type SortOption = 'recent' | 'popular' | 'commented';

const Feed = () => {
  const location = useLocation();
  const { user, profile, isProfileComplete } = useAuth();
  const [personalized, setPersonalized] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [useSimpleComposer, setUseSimpleComposer] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  
  const { report: reportPerformance, getSummary } = usePerformanceMonitoring();
  
  // Initialize paginated posts hook
  const { fetchPostPage, userFollowings } = usePostsPaginated({
    personalize: personalized,
    sortBy: sortOption,
    respectPrivacy: true,
    pageSize: 10
  });
  
  // Initialize infinite scroll
  const {
    posts,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    totalPosts
  } = useInfiniteScroll({
    pageSize: 10,
    onLoadMore: fetchPostPage,
    maxPages: 50
  });
  
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

  useEffect(() => {
    // Log the user's profile status for debugging
    if (user) {
      console.log('Feed: User profile status', { 
        profileExists: !!profile,
        isProfileComplete,
        userId: user.id,
        followingCount: userFollowings?.length || 0
      });
    }
  }, [user, profile, isProfileComplete, userFollowings]);

  // Load initial posts when options change
  useEffect(() => {
    console.log('Feed options changed, refreshing...', { personalized, sortOption });
    refresh();
  }, [personalized, sortOption, refresh]);

  const togglePersonalization = () => {
    setPersonalized(!personalized);
  };

  const handleSortChange = (value: string) => {
    if (value) {
      setSortOption(value as SortOption);
    }
  };

  const handlePostUpdated = () => {
    console.log("Feed: Post updated, refreshing posts");
    refresh();
  };

  // Performance monitoring toggle
  const togglePerformanceMonitoring = () => {
    setShowPerformance(!showPerformance);
    if (!showPerformance) {
      reportPerformance();
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Social Feed</h1>
        
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="simple-composer" 
                checked={useSimpleComposer}
                onCheckedChange={setUseSimpleComposer}
              />
              <Label htmlFor="simple-composer" className="text-sm">Simple</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="personalized" 
                checked={personalized}
                onCheckedChange={togglePersonalization}
              />
              <Label htmlFor="personalized">Personalized</Label>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="performance" 
                  checked={showPerformance}
                  onCheckedChange={togglePerformanceMonitoring}
                />
                <Label htmlFor="performance" className="text-sm flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Perf
                </Label>
              </div>
            )}
          </div>
        )}
      </div>
      
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

      {/* Performance metrics display */}
      {showPerformance && process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4" />
            <span className="font-medium">Performance Metrics</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>Posts: {totalPosts}</div>
            <div>Memory: {getSummary()?.currentMemory?.toFixed(1) || 'N/A'}MB</div>
            <div>Render: {getSummary()?.avgRenderTime?.toFixed(1) || 'N/A'}ms</div>
            <div>Status: {getSummary() ? '✅' : '⏳'}</div>
          </div>
        </div>
      )}

      {/* Preview Service Monitor - only in development */}
      {showPerformance && process.env.NODE_ENV === 'development' && (
        <div className="mb-6">
          <PreviewMonitor />
        </div>
      )}
      
      {user ? (
        <>
          <div className="mb-6">
            {useSimpleComposer ? (
              <PostComposer onSuccess={refresh} />
            ) : (
              <CreatePostForm onSuccess={refresh} />
            )}
          </div>
          
          {posts.length === 0 && !isLoading ? (
            <div className="bg-gradient-to-b from-muted/50 to-muted/30 rounded-lg p-8 text-center border border-muted shadow-inner mb-6">
              <div className="max-w-md mx-auto">
                <div className="bg-muted/50 p-4 rounded-full inline-block mb-3">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Welcome to your feed!</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  {userFollowings?.length === 0 
                    ? "Start following other players to see their posts, or create your first post to get started!"
                    : "Your followed users haven't posted recently. Check back later or explore public content!"
                  }
                </p>
                {userFollowings?.length === 0 && (
                  <Button onClick={() => window.location.href = '/search'} variant="outline">
                    Find People to Follow
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[600px] md:h-[800px]">
              <VirtualizedList
                posts={posts}
                currentUserId={user.id}
                onPostUpdated={handlePostUpdated}
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
                className="h-full"
              />
            </div>
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
