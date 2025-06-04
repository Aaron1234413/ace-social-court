
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';
import { sanitizePostsForUser, PrivacyContext } from '@/utils/privacySanitization';
import { createSmartFeedMix } from '@/utils/smartFeedMixing';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface UsePostsPaginatedOptions {
  personalize?: boolean;
  sortBy?: 'recent' | 'popular' | 'commented';
  respectPrivacy?: boolean;
  pageSize?: number;
}

export const usePostsPaginated = (options: UsePostsPaginatedOptions = {
  personalize: true,
  sortBy: 'recent',
  respectPrivacy: true,
  pageSize: 10
}) => {
  const [userFollowings, setUserFollowings] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{ user_type: string | null } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user context once with error handling
  const initializeUserContext = useCallback(async (userId: string) => {
    if (isInitialized) return { followings: userFollowings, profile: userProfile };

    try {
      console.log('🔧 Initializing user context...');
      
      // Fetch user data in parallel with timeout protection
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User context initialization timeout')), 5000)
      );

      const dataPromise = Promise.all([
        supabase.from('followers').select('following_id').eq('follower_id', userId),
        supabase.from('profiles').select('user_type').eq('id', userId).single()
      ]);

      const [followingsResult, profileResult] = await Promise.race([dataPromise, timeout]) as any;
      
      const followings = followingsResult.error ? [] : (followingsResult.data || []).map((item: any) => item.following_id);
      const profile = profileResult.error ? null : profileResult.data;
      
      setUserFollowings(followings);
      setUserProfile(profile);
      setIsInitialized(true);
      
      console.log('✅ User context initialized:', { 
        followings: followings.length, 
        userType: profile?.user_type 
      });
      
      return { followings, profile };
    } catch (error) {
      console.error('❌ User context initialization failed:', error);
      // Return safe defaults to prevent pipeline failure
      const safeDefaults = { followings: [], profile: null };
      setUserFollowings([]);
      setUserProfile(null);
      setIsInitialized(true);
      return safeDefaults;
    }
  }, [isInitialized, userFollowings, userProfile]);

  // SIMPLIFIED post processing pipeline - no more multiple stages that can fail
  const processPostsPipeline = useCallback(async (
    rawPosts: Post[], 
    userId?: string
  ): Promise<Post[]> => {
    console.log('\n🔄 === SIMPLIFIED PROCESSING PIPELINE ===');
    console.log('📥 Input posts:', rawPosts.length);
    
    if (rawPosts.length === 0) {
      console.log('⚠️ No raw posts to process');
      return [];
    }

    // For unauthenticated users, just return public posts
    if (!userId) {
      const publicPosts = rawPosts.filter(post => post.privacy_level === 'public');
      console.log('👤 Unauthenticated user - returning public posts:', publicPosts.length);
      return publicPosts;
    }

    // Get user context
    let userContext = null;
    try {
      userContext = await initializeUserContext(userId);
    } catch (error) {
      console.warn('⚠️ User context failed, using defaults');
      userContext = { followings: [], profile: null };
    }

    // SIMPLE filtering: Just apply basic privacy rules
    let processedPosts = rawPosts.filter(post => {
      // Always show user's own posts
      if (post.user_id === userId) return true;
      
      // Always show public posts
      if (post.privacy_level === 'public') return true;
      
      // Show friends posts if user follows the author
      if (post.privacy_level === 'friends' && userContext?.followings.includes(post.user_id)) {
        return true;
      }
      
      // Show coaches posts if user is a coach
      if (post.privacy_level === 'coaches' && userContext?.profile?.user_type === 'coach') {
        return true;
      }
      
      return false;
    });

    console.log('🛡️ After privacy filtering:', processedPosts.length);

    // GUARANTEE: Ensure we always have some posts for authenticated users
    if (processedPosts.length === 0) {
      console.log('🆘 NO POSTS after filtering - applying emergency fallback');
      // Emergency fallback: show all public posts
      processedPosts = rawPosts.filter(post => post.privacy_level === 'public');
      console.log('🆘 Emergency fallback applied:', processedPosts.length);
    }

    // Apply sorting if we have posts
    if (processedPosts.length > 0 && options.sortBy) {
      if (options.sortBy === 'popular') {
        processedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      } else if (options.sortBy === 'commented') {
        processedPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      } else {
        processedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      console.log('📊 Applied sorting:', options.sortBy);
    }

    console.log('✅ Final pipeline result:', processedPosts.length, 'posts');
    return processedPosts;
  }, [options.sortBy, initializeUserContext]);

  // Optimized fetch with streamlined pipeline
  const fetchPostPage = useCallback(async (page: number): Promise<Post[]> => {
    return performanceMonitor.measureRender('fetchPostPage', async () => {
      try {
        console.log(`\n📄 === FETCHING PAGE ${page} ===`);
        
        const { data: { user } } = await supabase.auth.getUser();
        const offset = (page - 1) * (options.pageSize || 10);
        
        // Fetch more posts to account for filtering
        const fetchSize = Math.max((options.pageSize || 10) * 2, 20);
        
        let query = supabase.from('posts').select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score, updated_at
        `);
        
        if (options.sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        }
        
        query = query.range(offset, offset + fetchSize - 1);
        
        const { data: postsData, error: postsError } = await query;
        
        if (postsError) {
          console.error('❌ Database query failed:', postsError);
          throw new Error(`Database query failed: ${postsError.message}`);
        }
        
        if (!postsData || postsData.length === 0) {
          console.log(`📭 No raw posts found for page ${page}`);
          return [];
        }
        
        console.log(`📥 Raw posts fetched: ${postsData.length}`);
        
        // Batch process engagement data with error tolerance
        const formattedPosts: Post[] = await Promise.all(postsData.map(async post => {
          try {
            const [likesResult, commentsResult] = await Promise.allSettled([
              supabase.rpc('get_likes_count', { post_id: post.id }),
              supabase.rpc('get_comments_count', { post_id: post.id })
            ]);
            
            return {
              ...post,
              author: null,
              likes_count: likesResult.status === 'fulfilled' ? (likesResult.value?.data || 0) : 0,
              comments_count: commentsResult.status === 'fulfilled' ? (commentsResult.value?.data || 0) : 0
            };
          } catch (error) {
            console.warn(`⚠️ Error processing post ${post.id}, using defaults:`, error);
            return { ...post, author: null, likes_count: 0, comments_count: 0 };
          }
        }));
        
        // Batch fetch author profiles with error tolerance
        try {
          const userIds = [...new Set(formattedPosts.map(post => post.user_id))];
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
            
            formattedPosts.forEach(post => {
              post.author = profileMap.get(post.user_id) || null;
            });
          }
        } catch (error) {
          console.warn('⚠️ Author profiles fetch failed, continuing without:', error);
        }
        
        // Process through SIMPLIFIED pipeline
        const finalPosts = await processPostsPipeline(formattedPosts, user?.id);
        
        // Take only what we need for this page
        const pagePosts = finalPosts.slice(0, options.pageSize || 10);
        
        console.log(`✨ Page ${page} complete: ${pagePosts.length} posts delivered`);
        
        return pagePosts;
        
      } catch (error) {
        console.error(`❌ Critical error fetching page ${page}:`, error);
        toast.error(`Failed to load page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return [];
      }
    });
  }, [options, processPostsPipeline]);

  return {
    fetchPostPage,
    userFollowings,
    userProfile
  };
};
