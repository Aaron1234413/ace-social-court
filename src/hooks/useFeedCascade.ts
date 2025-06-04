
import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/post';
import { FeedQueryCascade } from '@/services/FeedQueryCascade';
import { useAuth } from '@/components/AuthProvider';
import { useUserFollows } from '@/hooks/useUserFollows';
import { supabase } from '@/integrations/supabase/client';

interface FeedCascadeState {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  metrics: any[];
  ambassadorPercentage: number;
}

export const useFeedCascade = () => {
  const { user } = useAuth();
  const { followingCount, followings } = useUserFollows();
  
  const [state, setState] = useState<FeedCascadeState>({
    posts: [],
    isLoading: true,
    isLoadingMore: false,
    hasMore: true,
    page: 0,
    metrics: [],
    ambassadorPercentage: 0
  });

  const loadPosts = useCallback(async (page: number = 0, existingPosts: Post[] = []) => {
    if (!user) return;

    console.log('🔄 Loading posts with cascade', { page, existingCount: existingPosts.length });

    try {
      const result = await FeedQueryCascade.executeQueryCascade(
        user.id,
        followings,
        page,
        existingPosts
      );

      // Fetch author profiles for new posts
      const newPosts = result.posts.slice(existingPosts.length);
      if (newPosts.length > 0) {
        const userIds = [...new Set(newPosts.map(post => post.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, user_type, avatar_url')
          .in('id', userIds);

        if (profilesData) {
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
        }

        // Get engagement counts
        for (const post of newPosts) {
          try {
            const [{ data: likesData }, { data: commentsData }] = await Promise.all([
              supabase.rpc('get_likes_count', { post_id: post.id }),
              supabase.rpc('get_comments_count', { post_id: post.id })
            ]);
            
            post.likes_count = likesData || 0;
            post.comments_count = commentsData || 0;
          } catch (error) {
            console.warn('Failed to get engagement counts for post:', post.id);
            post.likes_count = 0;
            post.comments_count = 0;
          }
        }
      }

      setState(prev => ({
        ...prev,
        posts: result.posts,
        hasMore: result.posts.length >= 8 && page < 5, // Limit to 5 pages max
        metrics: result.metrics,
        ambassadorPercentage: result.ambassadorPercentage
      }));

    } catch (error) {
      console.error('❌ Failed to load posts:', error);
    }
  }, [user, followings]);

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
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      posts: [], 
      page: 0, 
      hasMore: true 
    }));
    
    await loadPosts(0, []);
    
    setState(prev => ({ ...prev, isLoading: false }));
  }, [loadPosts]);

  // Initial load
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, followingCount]); // Reload when follow count changes

  return {
    posts: state.posts,
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    hasMore: state.hasMore,
    metrics: state.metrics,
    ambassadorPercentage: state.ambassadorPercentage,
    loadMore,
    refresh
  };
};
