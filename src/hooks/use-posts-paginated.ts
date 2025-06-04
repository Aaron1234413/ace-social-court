
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';
import { sanitizePostsForUser, PrivacyContext } from '@/utils/privacySanitization';
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

  // Initialize user context once
  const initializeUserContext = useCallback(async (userId: string) => {
    if (isInitialized) return { followings: userFollowings, profile: userProfile };

    try {
      console.log('Initializing user context for pagination...');
      
      // Fetch user followings
      const { data: followingsData, error: followingsError } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);
      
      const followings = followingsError ? [] : followingsData.map(item => item.following_id);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();
      
      const profile = profileError ? null : profileData;
      
      setUserFollowings(followings);
      setUserProfile(profile);
      setIsInitialized(true);
      
      console.log('User context initialized:', { followings: followings.length, userType: profile?.user_type });
      
      return { followings, profile };
    } catch (error) {
      console.error('Error initializing user context:', error);
      return { followings: [], profile: null };
    }
  }, [isInitialized, userFollowings, userProfile]);

  // Fetch a single page of posts
  const fetchPostPage = useCallback(async (page: number): Promise<Post[]> => {
    return performanceMonitor.measureRender('fetchPostPage', async () => {
      try {
        console.log(`Fetching page ${page} with ${options.pageSize} posts`);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Calculate offset for pagination
        const offset = (page - 1) * (options.pageSize || 10);
        
        // Build query with pagination
        let query = supabase.from('posts');
        let selectQuery = query.select(`
          id,
          content,
          created_at,
          user_id,
          media_url,
          media_type,
          privacy_level,
          template_id,
          is_auto_generated,
          engagement_score,
          updated_at`);
        
        // Sort based on option
        if (options.sortBy === 'recent') {
          selectQuery = selectQuery.order('created_at', { ascending: false });
        }
        
        // Apply pagination
        selectQuery = selectQuery.range(offset, offset + (options.pageSize || 10) - 1);
        
        const { data: postsData, error: postsError } = await selectQuery;
        
        if (postsError) {
          console.error('Error fetching posts page:', postsError);
          throw postsError;
        }
        
        if (!postsData || postsData.length === 0) {
          console.log(`No posts found for page ${page}`);
          return [];
        }
        
        console.log(`Raw posts fetched for page ${page}:`, postsData.length);
        
        // Format posts and get engagement data
        const formattedPosts: Post[] = await Promise.all(postsData.map(async post => {
          try {
            // Get likes and comments counts
            const [likesData, commentsData] = await Promise.all([
              supabase.rpc('get_likes_count', { post_id: post.id }),
              supabase.rpc('get_comments_count', { post_id: post.id })
            ]);
            
            return {
              id: post.id,
              content: post.content,
              created_at: post.created_at,
              user_id: post.user_id,
              media_url: post.media_url,
              media_type: post.media_type,
              privacy_level: post.privacy_level,
              template_id: post.template_id,
              is_auto_generated: post.is_auto_generated,
              engagement_score: post.engagement_score,
              author: null,
              likes_count: likesData?.data || 0,
              comments_count: commentsData?.data || 0
            };
          } catch (error) {
            console.error('Error processing post:', post.id, error);
            return {
              id: post.id,
              content: post.content,
              created_at: post.created_at,
              user_id: post.user_id,
              media_url: post.media_url,
              media_type: post.media_type,
              privacy_level: post.privacy_level,
              template_id: post.template_id,
              is_auto_generated: post.is_auto_generated,
              engagement_score: post.engagement_score,
              author: null,
              likes_count: 0,
              comments_count: 0
            };
          }
        }));
        
        // Sort by popularity or comments if needed
        let sortedPosts = [...formattedPosts];
        
        if (options.sortBy === 'popular') {
          sortedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        } else if (options.sortBy === 'commented') {
          sortedPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        }
        
        // Fetch author profiles in batch
        if (sortedPosts.length > 0) {
          const userIds = [...new Set(sortedPosts.map(post => post.user_id))];
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, user_type, avatar_url')
            .in('id', userIds);
          
          if (!profilesError && profilesData) {
            const profileMap = new Map();
            profilesData.forEach(profile => {
              profileMap.set(profile.id, {
                full_name: profile.full_name,
                user_type: profile.user_type,
                avatar_url: profile.avatar_url
              });
            });
            
            sortedPosts.forEach(post => {
              post.author = profileMap.get(post.user_id) || null;
            });
          }
        }
        
        // Apply smart processing if user is logged in
        let finalPosts = sortedPosts;
        
        if (user) {
          const { followings, profile } = await initializeUserContext(user.id);
          
          // Apply privacy filtering if enabled
          if (options.respectPrivacy) {
            const privacyContext: PrivacyContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type,
              isCoach: profile?.user_type === 'coach'
            };
            
            finalPosts = sanitizePostsForUser(sortedPosts, privacyContext);
          }
          
          // Apply personalization if enabled
          if (options.personalize && finalPosts.length > 0) {
            const personalizationContext: PersonalizationContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type
            };
            
            finalPosts = personalizePostFeed(finalPosts, personalizationContext);
          }
        } else {
          // For unauthenticated users, show only public posts
          finalPosts = sortedPosts.filter(post => post.privacy_level === 'public');
        }
        
        console.log(`Page ${page} processed: ${finalPosts.length} posts`);
        return finalPosts;
        
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error);
        toast.error(`Failed to load page ${page}`);
        return [];
      }
    });
  }, [options.personalize, options.sortBy, options.respectPrivacy, options.pageSize, initializeUserContext]);

  return {
    fetchPostPage,
    userFollowings,
    userProfile
  };
};
