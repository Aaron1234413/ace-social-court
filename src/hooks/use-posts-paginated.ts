
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { personalizePostFeed, PersonalizationContext } from '@/utils/feedPersonalization';
import { sanitizePostsForUser, PrivacyContext } from '@/utils/privacySanitization';
import { ensureMinimumContent } from '@/utils/smartFeedMixing';
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
      console.log('🔧 Post Pagination: Initializing user context...');
      
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
      
      console.log('✅ Post Pagination: User context initialized:', { 
        followings: followings.length, 
        userType: profile?.user_type,
        userId: userId.substring(0, 8) + '...'
      });
      
      return { followings, profile };
    } catch (error) {
      console.error('❌ Post Pagination: Error initializing user context:', error);
      return { followings: [], profile: null };
    }
  }, [isInitialized, userFollowings, userProfile]);

  // Fetch a single page of posts with comprehensive logging
  const fetchPostPage = useCallback(async (page: number): Promise<Post[]> => {
    return performanceMonitor.measureRender('fetchPostPage', async () => {
      try {
        console.log(`\n📄 === FETCHING PAGE ${page} ===`);
        console.log(`⚙️ Options:`, options);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        // Calculate offset for pagination
        const offset = (page - 1) * (options.pageSize || 10);
        console.log(`📊 Pagination: offset=${offset}, pageSize=${options.pageSize}`);
        
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
          console.error('❌ Database Error:', postsError);
          throw postsError;
        }
        
        if (!postsData || postsData.length === 0) {
          console.log(`📭 No raw posts found for page ${page}`);
          return [];
        }
        
        console.log(`📥 Raw posts fetched: ${postsData.length} posts`);
        
        // Format posts and get engagement data with error handling
        const formattedPosts: Post[] = await Promise.all(postsData.map(async post => {
          try {
            // Get likes and comments counts with fallback
            const [likesResult, commentsResult] = await Promise.allSettled([
              supabase.rpc('get_likes_count', { post_id: post.id }),
              supabase.rpc('get_comments_count', { post_id: post.id })
            ]);
            
            const likesCount = likesResult.status === 'fulfilled' ? (likesResult.value?.data || 0) : 0;
            const commentsCount = commentsResult.status === 'fulfilled' ? (commentsResult.value?.data || 0) : 0;
            
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
              likes_count: likesCount,
              comments_count: commentsCount
            };
          } catch (error) {
            console.warn(`⚠️ Error processing post ${post.id}:`, error);
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
        
        console.log(`✅ Posts formatted: ${formattedPosts.length} posts`);
        
        // Sort by popularity or comments if needed
        let sortedPosts = [...formattedPosts];
        
        if (options.sortBy === 'popular') {
          sortedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
          console.log(`🔥 Sorted by popularity`);
        } else if (options.sortBy === 'commented') {
          sortedPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
          console.log(`💬 Sorted by comments`);
        }
        
        // Fetch author profiles in batch with error handling
        if (sortedPosts.length > 0) {
          try {
            const userIds = [...new Set(sortedPosts.map(post => post.user_id))];
            console.log(`👥 Fetching profiles for ${userIds.length} users`);
            
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
              
              console.log(`✅ Author profiles attached: ${profilesData.length} profiles`);
            } else {
              console.warn('⚠️ Failed to fetch author profiles:', profilesError);
            }
          } catch (error) {
            console.warn('⚠️ Error fetching author profiles:', error);
          }
        }
        
        // Apply smart processing if user is logged in
        let finalPosts = sortedPosts;
        
        if (user) {
          console.log(`\n🔐 === APPLYING USER-SPECIFIC FILTERING ===`);
          const { followings, profile } = await initializeUserContext(user.id);
          
          // Apply privacy filtering if enabled
          if (options.respectPrivacy) {
            console.log(`🛡️ Starting privacy filtering...`);
            const privacyContext: PrivacyContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type,
              isCoach: profile?.user_type === 'coach'
            };
            
            const beforePrivacy = finalPosts.length;
            finalPosts = sanitizePostsForUser(sortedPosts, privacyContext);
            console.log(`🛡️ Privacy filtering: ${beforePrivacy} → ${finalPosts.length} posts`);
          }
          
          // Apply personalization if enabled
          if (options.personalize && finalPosts.length > 0) {
            console.log(`🎯 Starting personalization...`);
            const personalizationContext: PersonalizationContext = {
              currentUserId: user.id,
              userFollowings: followings,
              userType: profile?.user_type
            };
            
            const beforePersonalization = finalPosts.length;
            finalPosts = personalizePostFeed(finalPosts, personalizationContext);
            console.log(`🎯 Personalization: ${beforePersonalization} → ${finalPosts.length} posts`);
          }
          
          // Ensure minimum content with fallback
          if (finalPosts.length < 3) {
            console.log(`🆘 FALLBACK: Only ${finalPosts.length} posts, applying minimum content strategy`);
            finalPosts = ensureMinimumContent(finalPosts, sortedPosts, user.id);
            console.log(`🆘 After fallback: ${finalPosts.length} posts`);
          }
        } else {
          // For unauthenticated users, show only public posts
          console.log(`👤 Unauthenticated user: filtering to public posts only`);
          const beforePublic = finalPosts.length;
          finalPosts = sortedPosts.filter(post => post.privacy_level === 'public');
          console.log(`👤 Public filter: ${beforePublic} → ${finalPosts.length} posts`);
        }
        
        console.log(`\n✨ === PAGE ${page} COMPLETE ===`);
        console.log(`📊 Final result: ${finalPosts.length} posts delivered`);
        console.log(`📋 Posts pipeline: Raw(${postsData.length}) → Formatted(${formattedPosts.length}) → Final(${finalPosts.length})`);
        
        return finalPosts;
        
      } catch (error) {
        console.error(`❌ Critical error fetching page ${page}:`, error);
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
