import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/post';
import { FeedQueryCascade } from '@/services/FeedQueryCascade';
import { useAuth } from '@/components/AuthProvider';
import { useUserFollows } from '@/hooks/useUserFollows';
import { supabase } from '@/integrations/supabase/client';
import { FeedAnalyticsService } from '@/services/FeedAnalyticsService';
import { useOptimisticPosts } from './useOptimisticPosts';
import { SimpleFeedService } from '@/services/SimpleFeedService';

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
}

export const useFeedCascade = () => {
  console.log('🎣 useFeedCascade hook initializing...');
  
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
    errorDetails: []
  });

  console.log('📊 useFeedCascade state:', {
    postsCount: state.posts.length,
    optimisticCount: optimisticPosts.length,
    isLoading: state.isLoading,
    hasUser: !!user
  });

  // Extract user IDs from following relationships
  const followingUserIds = following.map(follow => follow.following_id);

  // Combine optimistic posts with regular posts, preserving ambassador priority
  const allPosts = [...optimisticPosts, ...state.posts];

  const loadPosts = useCallback(async (page: number = 0, existingPosts: Post[] = []) => {
    if (!user) {
      console.log('❌ No user found - cannot load posts');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    console.log('🔄 ENHANCED FEED LOAD WITH AMBASSADOR PRIORITY', { 
      page, 
      existingCount: existingPosts.length,
      followingCount: followingUserIds.length,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    try {
      // Always show loading for page 0
      if (page === 0) {
        setState(prev => ({ ...prev, isLoading: true }));
      }

      // Use SimpleFeedService for better ambassador post handling
      const simpleFeedService = SimpleFeedService.getInstance();
      const result = await simpleFeedService.generateFeed(
        user.id,
        followingUserIds,
        page,
        8 // pageSize
      );

      console.log('📊 SIMPLIFIED FEED RESULT WITH AMBASSADOR PRIORITY:', {
        postCount: result.posts.length,
        ambassadorCount: result.posts.filter(p => 
          p.is_ambassador_content || p.ambassador_priority
        ).length,
        metrics: result.metrics
      });

      setState(prev => ({
        ...prev,
        posts: page === 0 ? result.posts : [...existingPosts, ...result.posts],
        hasMore: result.hasMore,
        metrics: [result.metrics],
        ambassadorPercentage: result.metrics.ambassadorPercentage,
        debugData: { simplifiedFeed: true },
        hasErrors: false,
        errorDetails: [],
        isLoading: false
      }));

      console.log('✅ FEED LOAD COMPLETE WITH AMBASSADOR PRIORITY');

    } catch (error) {
      console.error('💥 CRITICAL FEED LOAD FAILURE:', error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        hasErrors: true,
        errorDetails: [error.message]
      }));
    }
  }, [user, followingUserIds]);

  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true }));
    
    const nextPage = state.page + 1;
    await loadPosts(nextPage, state.posts);
    
    setState(prev => ({ 
      ...prev, 
      page: nextPage,
      isLoadingMore: false 
    }));
  }, [state.isLoadingMore, state.hasMore, state.page, state.posts, loadPosts]);

  const refresh = useCallback(async () => {
    console.log('🔄 REFRESHING FEED - RESET TO LOADING STATE');
    // Clear optimistic posts on refresh
    clearAllOptimistic();
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      posts: [], 
      page: 0, 
      hasMore: true,
      hasErrors: false,
      errorDetails: []
    }));
    
    await loadPosts(0, []);
  }, [loadPosts, clearAllOptimistic]);

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
        followingCount: followingUserIds.length
      });
      refresh();
    } else {
      console.log('⏳ Waiting for user authentication...');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, followingCount]); // Reload when follow count changes

  console.log('📤 useFeedCascade returning:', {
    postsCount: allPosts.length,
    isLoading: state.isLoading,
    hasErrors: state.hasErrors
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
    loadMore,
    refresh,
    addNewPost
  };
};
