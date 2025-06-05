import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/post';
import { FeedQueryCascade, FeedFilter } from '@/services/FeedQueryCascade';
import { useAuth } from '@/components/AuthProvider';
import { useUserFollows } from '@/hooks/useUserFollows';
import { supabase } from '@/integrations/supabase/client';
import { FeedAnalyticsService } from '@/services/FeedAnalyticsService';
import { useOptimisticPosts } from './useOptimisticPosts';

interface FeedCascadeState {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  metrics: any[];
  ambassadorPercentage: number;
  debugData?: any;
  hasErrors?: boolean;
  errorDetails?: string[];
  currentFilter: FeedFilter;
}

interface UseFeedCascadeOptions {
  filter?: FeedFilter;
}

export const useFeedCascade = (options: UseFeedCascadeOptions = {}) => {
  console.log('🎣 useFeedCascade hook initializing with filter:', options.filter);
  
  const { user } = useAuth();
  const { followingCount, following } = useUserFollows();
  const { optimisticPosts, addOptimisticPost, clearAllOptimistic } = useOptimisticPosts();
  
  const [state, setState] = useState<FeedCascadeState>({
    posts: [],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    page: 0,
    metrics: [],
    ambassadorPercentage: 0,
    debugData: null,
    hasErrors: false,
    errorDetails: [],
    currentFilter: options.filter || 'all'
  });

  console.log('📊 useFeedCascade state:', {
    postsCount: state.posts.length,
    optimisticCount: optimisticPosts.length,
    isLoading: state.isLoading,
    hasUser: !!user,
    currentFilter: state.currentFilter
  });

  // Extract user IDs from following relationships
  const followingUserIds = following.map(follow => follow.following_id);

  // Combine optimistic posts with regular posts
  const allPosts = [...optimisticPosts, ...state.posts];

  const loadPosts = useCallback(async (page: number = 0, existingPosts: Post[] = [], filter: FeedFilter = 'all') => {
    if (!user) {
      console.log('❌ No user found - cannot load posts');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    console.log('🔄 STARTING ENHANCED FEED LOAD WITH FILTERING', { 
      page, 
      existingCount: existingPosts.length,
      followingCount: followingUserIds.length,
      userId: user.id,
      filter,
      timestamp: new Date().toISOString()
    });

    try {
      // Always show loading for page 0
      if (page === 0) {
        setState(prev => ({ ...prev, isLoading: true, currentFilter: filter }));
      }

      const result = await FeedQueryCascade.executeQueryCascade(
        user.id,
        followingUserIds,
        page,
        existingPosts,
        filter
      );

      console.log('📊 ENHANCED CASCADE RESULT WITH FILTERING:', {
        postCount: result.posts.length,
        metrics: result.metrics,
        debugData: result.debugData,
        ambassadorPercentage: Math.round(result.ambassadorPercentage * 100) + '%',
        hasErrors: result.hasErrors,
        errorCount: result.errorDetails?.length || 0,
        filter
      });

      // Log any errors found
      if (result.hasErrors && result.errorDetails) {
        console.warn('⚠️ FEED ERRORS DETECTED:', result.errorDetails);
      }

      // Fetch author profiles for new posts with enhanced error handling
      const newPosts = result.posts.slice(existingPosts.length);
      if (newPosts.length > 0) {
        console.log('👤 Fetching author profiles for', newPosts.length, 'new posts');
        
        try {
          const userIds = [...new Set(newPosts.map(post => post.user_id))];
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, user_type, avatar_url')
            .in('id', userIds);

          if (profilesError) {
            console.error('❌ Failed to fetch profiles:', profilesError);
          } else if (profilesData) {
            const profileMap = new Map();
            profilesData.forEach(profile => {
              profileMap.set(profile.id, {
                full_name: profile.full_name,
                user_type: profile.user_type,
                avatar_url: profile.avatar_url
              });
            });

            // Update posts with author data
            result.posts.forEach(post => {
              if (!post.author) {
                post.author = profileMap.get(post.user_id) || null;
              }
            });

            console.log('✅ Author profiles loaded:', {
              profilesFound: profilesData.length,
              userIds: userIds.length,
              postsUpdated: result.posts.filter(p => p.author).length
            });
          }
        } catch (profileError) {
          console.error('❌ Profile fetching failed:', profileError);
          // Continue without profiles rather than failing completely
        }

        // Get engagement counts with timeout protection
        console.log('📈 Loading engagement counts for new posts...');
        const engagementStart = performance.now();
        
        const engagementPromises = newPosts.map(async (post) => {
          try {
            const [{ data: likesData }, { data: commentsData }] = await Promise.all([
              supabase.rpc('get_likes_count', { post_id: post.id }),
              supabase.rpc('get_comments_count', { post_id: post.id })
            ]);
            
            post.likes_count = likesData || 0;
            post.comments_count = commentsData || 0;
          } catch (error) {
            console.warn('Failed to get engagement counts for post:', post.id, error);
            post.likes_count = 0;
            post.comments_count = 0;
          }
        });

        // Wait for all engagement counts with timeout
        try {
          await Promise.all(engagementPromises);
          const engagementTime = performance.now() - engagementStart;
          console.log('✅ Engagement counts loaded in', Math.round(engagementTime) + 'ms');

          // Record analytics
          const analyticsService = FeedAnalyticsService.getInstance();
          analyticsService.recordPerformanceMetric('engagement_loading', {
            postCount: newPosts.length,
            loadTime: engagementTime
          });
        } catch (engagementError) {
          console.error('❌ Engagement loading failed:', engagementError);
          // Continue without engagement counts
        }
      }

      setState(prev => ({
        ...prev,
        posts: result.posts,
        hasMore: result.posts.length >= 15 && page < 8, // Increased page limit from 5 to 8
        metrics: result.metrics,
        ambassadorPercentage: result.ambassadorPercentage,
        debugData: result.debugData,
        hasErrors: result.hasErrors,
        errorDetails: result.errorDetails,
        currentFilter: filter,
        isLoading: false // Always turn off loading when done
      }));

      console.log('✅ FEED LOAD COMPLETE WITH FILTER:', {
        finalPostCount: result.posts.length,
        loadingTurnedOff: true,
        hasErrors: result.hasErrors,
        filter
      });

    } catch (error) {
      console.error('💥 CRITICAL FEED LOAD FAILURE:', {
        error: error.message,
        stack: error.stack,
        context: { page, existingCount: existingPosts.length, followingCount: followingUserIds.length, filter }
      });
      
      // Always turn off loading even on error
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        hasErrors: true,
        errorDetails: [error.message],
        currentFilter: filter
      }));
    }
  }, [user, followingUserIds]);

  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true }));
    
    const nextPage = state.page + 1;
    await loadPosts(nextPage, state.posts, state.currentFilter);
    
    setState(prev => ({ 
      ...prev, 
      page: nextPage,
      isLoadingMore: false 
    }));
  }, [state.isLoadingMore, state.hasMore, state.page, state.posts, state.currentFilter, loadPosts]);

  const refresh = useCallback(async (filter?: FeedFilter) => {
    const targetFilter = filter || state.currentFilter;
    console.log('🔄 REFRESHING FEED WITH FILTER:', targetFilter);
    
    // Clear optimistic posts on refresh
    clearAllOptimistic();
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      posts: [], 
      page: 0, 
      hasMore: true,
      hasErrors: false,
      errorDetails: [],
      currentFilter: targetFilter
    }));
    
    await loadPosts(0, [], targetFilter);
  }, [loadPosts, clearAllOptimistic, state.currentFilter]);

  // Function to add a new post optimistically
  const addNewPost = useCallback((post: Post) => {
    console.log('✨ Adding optimistic post to feed:', post.id);
    addOptimisticPost(post);
  }, [addOptimisticPost]);

  // Initial load with enhanced logging
  useEffect(() => {
    if (user) {
      console.log('🎬 INITIAL FEED LOAD TRIGGERED', {
        userId: user.id,
        followingCount: followingUserIds.length,
        filter: options.filter || 'all'
      });
      refresh(options.filter || 'all');
    } else {
      console.log('⏳ Waiting for user authentication...');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, followingCount]); // Reload when follow count changes

  // Handle filter changes
  useEffect(() => {
    if (user && options.filter && options.filter !== state.currentFilter) {
      console.log('🔄 FILTER CHANGED - REFRESHING FEED:', {
        from: state.currentFilter,
        to: options.filter
      });
      refresh(options.filter);
    }
  }, [options.filter, state.currentFilter, user, refresh]);

  console.log('📤 useFeedCascade returning:', {
    postsCount: allPosts.length,
    isLoading: state.isLoading,
    hasErrors: state.hasErrors,
    currentFilter: state.currentFilter
  });

  return {
    posts: allPosts,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasMore: state.hasMore,
    metrics: state.metrics,
    ambassadorPercentage: state.ambassadorPercentage,
    debugData: state.debugData,
    hasErrors: state.hasErrors,
    errorDetails: state.errorDetails,
    currentFilter: state.currentFilter,
    loadMore,
    refresh,
    addNewPost
  };
};
