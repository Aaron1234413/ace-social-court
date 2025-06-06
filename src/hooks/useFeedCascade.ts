
import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/post';
import { useAuth } from '@/components/AuthProvider';
import { useUserFollows } from '@/hooks/useUserFollows';
import { supabase } from '@/integrations/supabase/client';
import { useOptimisticPosts } from './useOptimisticPosts';

interface FeedCascadeState {
  posts: Post[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
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

  // Combine optimistic posts with regular posts
  const allPosts = [...optimisticPosts, ...state.posts];

  const loadPosts = useCallback(async (page: number = 0, existingPosts: Post[] = []) => {
    if (!user) {
      console.log('❌ No user found - cannot load posts');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    console.log('🔄 LOADING SIMPLIFIED FEED', { 
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
      } else {
        setState(prev => ({ ...prev, isLoadingMore: true }));
      }

      const POSTS_PER_PAGE = 12;
      const offset = page * POSTS_PER_PAGE;
      
      // Step 1: Get posts from followed users + user's own posts
      let followedPosts: Post[] = [];
      const queryUserIds = [user.id, ...followingUserIds];
      
      if (queryUserIds.length > 0) {
        console.log('👥 Fetching posts from followed users and own posts...');
        
        const { data: followedData, error: followedError } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .in('user_id', queryUserIds)
          .order('created_at', { ascending: false })
          .range(offset, offset + POSTS_PER_PAGE - 1);

        if (followedError) {
          console.error('❌ Error fetching followed posts:', followedError);
          throw followedError;
        }

        followedPosts = followedData || [];
        console.log('✅ Followed posts loaded:', followedPosts.length);
      }

      // Step 2: Fill remaining slots with high-quality public posts (only if needed)
      let publicPosts: Post[] = [];
      const remainingSlots = POSTS_PER_PAGE - followedPosts.length;
      
      if (remainingSlots > 0) {
        console.log('🌐 Filling remaining slots with public posts...');
        
        // Get user IDs we already have posts from to avoid duplicates
        const existingUserIds = [...new Set([...existingPosts.map(p => p.user_id), ...followedPosts.map(p => p.user_id)])];
        
        let publicQuery = supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .eq('privacy_level', 'public')
          .order('engagement_score', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(remainingSlots);

        // Exclude posts from users we already have posts from (if any)
        if (existingUserIds.length > 0) {
          publicQuery = publicQuery.not('user_id', 'in', `(${existingUserIds.join(',')})`);
        }

        const { data: publicData, error: publicError } = await publicQuery;

        if (publicError) {
          console.warn('⚠️ Error fetching public posts (non-critical):', publicError);
        } else {
          publicPosts = publicData || [];
          console.log('✅ Public posts loaded:', publicPosts.length);
        }
      }

      // Step 3: Combine and deduplicate posts
      const allNewPosts = [...followedPosts, ...publicPosts];
      const combinedPosts = [...existingPosts, ...allNewPosts];
      
      // Remove duplicates by ID
      const uniquePosts = combinedPosts.filter((post, index, array) => 
        array.findIndex(p => p.id === post.id) === index
      );

      console.log('🔧 Posts after deduplication:', {
        before: combinedPosts.length,
        after: uniquePosts.length,
        removed: combinedPosts.length - uniquePosts.length
      });

      // Step 4: Fetch author profiles for new posts
      const newPosts = allNewPosts;
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
            uniquePosts.forEach(post => {
              if (!post.author) {
                post.author = profileMap.get(post.user_id) || null;
              }
            });

            console.log('✅ Author profiles loaded:', {
              profilesFound: profilesData.length,
              userIds: userIds.length,
              postsUpdated: uniquePosts.filter(p => p.author).length
            });
          }
        } catch (profileError) {
          console.error('❌ Profile fetching failed:', profileError);
          // Continue without profiles rather than failing completely
        }

        // Step 5: Get engagement counts
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

        try {
          await Promise.all(engagementPromises);
          const engagementTime = performance.now() - engagementStart;
          console.log('✅ Engagement counts loaded in', Math.round(engagementTime) + 'ms');
        } catch (engagementError) {
          console.error('❌ Engagement loading failed:', engagementError);
          // Continue without engagement counts
        }
      }

      setState(prev => ({
        ...prev,
        posts: uniquePosts,
        hasMore: allNewPosts.length >= POSTS_PER_PAGE && page < 5, // Limit to 5 pages max
        isLoading: false,
        isLoadingMore: false,
        hasErrors: false,
        errorDetails: []
      }));

      console.log('✅ SIMPLIFIED FEED LOAD COMPLETE:', {
        finalPostCount: uniquePosts.length,
        followedPosts: followedPosts.length,
        publicPosts: publicPosts.length,
        page
      });

    } catch (error) {
      console.error('💥 CRITICAL FEED LOAD FAILURE:', {
        error: error.message,
        stack: error.stack,
        context: { page, existingCount: existingPosts.length, followingCount: followingUserIds.length }
      });
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        isLoadingMore: false,
        hasErrors: true,
        errorDetails: [error.message]
      }));
    }
  }, [user, followingUserIds]);

  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    const nextPage = state.page + 1;
    await loadPosts(nextPage, state.posts);
    
    setState(prev => ({ 
      ...prev, 
      page: nextPage
    }));
  }, [state.isLoadingMore, state.hasMore, state.page, state.posts, loadPosts]);

  const refresh = useCallback(async () => {
    console.log('🔄 REFRESHING SIMPLIFIED FEED');
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

  // Initial load
  useEffect(() => {
    if (user) {
      console.log('🎬 INITIAL SIMPLIFIED FEED LOAD TRIGGERED', {
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
    hasErrors: state.hasErrors,
    errorDetails: state.errorDetails,
    loadMore,
    refresh,
    addNewPost
  };
};
