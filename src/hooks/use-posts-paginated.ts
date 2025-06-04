
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

interface ProcessingStage {
  name: string;
  count: number;
  error?: string;
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

  // Optimized post processing pipeline with error boundaries
  const processPostsPipeline = useCallback(async (
    rawPosts: Post[], 
    userId?: string
  ): Promise<{ posts: Post[], stages: ProcessingStage[] }> => {
    const stages: ProcessingStage[] = [];
    let currentPosts = [...rawPosts];
    
    console.log('\n🔄 === STARTING OPTIMIZED PROCESSING PIPELINE ===');
    
    // Stage 1: Input validation
    stages.push({ name: 'Raw Input', count: currentPosts.length });
    
    if (currentPosts.length === 0) {
      console.log('⚠️ No posts to process, returning empty result');
      return { posts: [], stages };
    }

    // Stage 2: User context (only if user is logged in)
    let userContext = null;
    if (userId) {
      try {
        userContext = await initializeUserContext(userId);
        stages.push({ name: 'User Context', count: currentPosts.length });
      } catch (error) {
        console.warn('⚠️ User context failed, continuing with public-only filtering');
        stages.push({ name: 'User Context', count: currentPosts.length, error: 'Failed to load user context' });
      }
    }

    // Stage 3: Privacy filtering with fallback
    if (options.respectPrivacy && userId) {
      try {
        const privacyContext: PrivacyContext = {
          currentUserId: userId,
          userFollowings: userContext?.followings || [],
          userType: userContext?.profile?.user_type,
          isCoach: userContext?.profile?.user_type === 'coach'
        };
        
        const beforePrivacy = currentPosts.length;
        currentPosts = sanitizePostsForUser(currentPosts, privacyContext);
        
        // Minimum content guarantee for privacy filtering
        if (currentPosts.length < 2 && beforePrivacy > 0) {
          console.log('🆘 Privacy filtering too aggressive, applying fallback');
          const publicPosts = rawPosts.filter(post => post.privacy_level === 'public');
          const userOwnPosts = rawPosts.filter(post => post.user_id === userId);
          currentPosts = [...userOwnPosts, ...publicPosts.slice(0, 5)];
          // Remove duplicates
          currentPosts = currentPosts.filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          );
        }
        
        stages.push({ name: 'Privacy Filter', count: currentPosts.length });
        console.log(`🛡️ Privacy filtering: ${beforePrivacy} → ${currentPosts.length} posts`);
      } catch (error) {
        console.error('❌ Privacy filtering failed:', error);
        stages.push({ name: 'Privacy Filter', count: currentPosts.length, error: 'Privacy filtering failed' });
        // Continue with current posts on error
      }
    } else if (!userId) {
      // For unauthenticated users, show only public posts
      currentPosts = currentPosts.filter(post => post.privacy_level === 'public');
      stages.push({ name: 'Public Filter', count: currentPosts.length });
    }

    // Stage 4: Smart feed mixing (only for authenticated users with personalization)
    if (options.personalize && userId && userContext) {
      try {
        const beforeMixing = currentPosts.length;
        currentPosts = createSmartFeedMix(currentPosts, {
          followingCount: userContext.followings.length,
          userFollowings: userContext.followings,
          currentUserId: userId
        });
        
        stages.push({ name: 'Smart Mixing', count: currentPosts.length });
        console.log(`🎯 Smart mixing: ${beforeMixing} → ${currentPosts.length} posts`);
      } catch (error) {
        console.error('❌ Smart mixing failed:', error);
        stages.push({ name: 'Smart Mixing', count: currentPosts.length, error: 'Smart mixing failed' });
        // Continue with current posts on error
      }
    }

    // Stage 5: Personalization (if enabled and sufficient posts)
    if (options.personalize && userId && userContext && currentPosts.length > 0) {
      try {
        const personalizationContext: PersonalizationContext = {
          currentUserId: userId,
          userFollowings: userContext.followings,
          userType: userContext.profile?.user_type
        };
        
        const beforePersonalization = currentPosts.length;
        currentPosts = personalizePostFeed(currentPosts, personalizationContext);
        
        stages.push({ name: 'Personalization', count: currentPosts.length });
        console.log(`🎯 Personalization: ${beforePersonalization} → ${currentPosts.length} posts`);
      } catch (error) {
        console.error('❌ Personalization failed:', error);
        stages.push({ name: 'Personalization', count: currentPosts.length, error: 'Personalization failed' });
        // Continue with current posts on error
      }
    }

    // Stage 6: Final minimum content guarantee
    const minRequiredPosts = 2;
    if (currentPosts.length < minRequiredPosts) {
      console.log(`🆘 FINAL FALLBACK: Only ${currentPosts.length} posts, ensuring minimum content`);
      
      try {
        // Add public posts as fallback
        const existingIds = new Set(currentPosts.map(p => p.id));
        const fallbackPosts = rawPosts
          .filter(post => !existingIds.has(post.id) && post.privacy_level === 'public')
          .sort((a, b) => {
            const scoreA = (a.engagement_score || 0) + (a.likes_count || 0);
            const scoreB = (b.engagement_score || 0) + (b.likes_count || 0);
            return scoreB - scoreA;
          })
          .slice(0, Math.max(minRequiredPosts - currentPosts.length, 3));
        
        currentPosts = [...currentPosts, ...fallbackPosts];
        stages.push({ name: 'Final Fallback', count: currentPosts.length });
        console.log(`🆘 Added ${fallbackPosts.length} fallback posts`);
      } catch (error) {
        console.error('❌ Final fallback failed:', error);
        stages.push({ name: 'Final Fallback', count: currentPosts.length, error: 'Final fallback failed' });
      }
    }

    console.log('✅ Processing pipeline completed:', {
      input: rawPosts.length,
      output: currentPosts.length,
      stages: stages.length
    });

    return { posts: currentPosts, stages };
  }, [options.personalize, options.respectPrivacy, initializeUserContext]);

  // Optimized fetch with streamlined pipeline
  const fetchPostPage = useCallback(async (page: number): Promise<Post[]> => {
    return performanceMonitor.measureRender('fetchPostPage', async () => {
      try {
        console.log(`\n📄 === FETCHING PAGE ${page} (OPTIMIZED) ===`);
        
        const { data: { user } } = await supabase.auth.getUser();
        const offset = (page - 1) * (options.pageSize || 10);
        
        // Optimized database query with better error handling
        let query = supabase.from('posts').select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score, updated_at
        `);
        
        if (options.sortBy === 'recent') {
          query = query.order('created_at', { ascending: false });
        }
        
        query = query.range(offset, offset + (options.pageSize || 10) - 1);
        
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
        
        // Sort optimization
        if (options.sortBy === 'popular') {
          formattedPosts.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
        } else if (options.sortBy === 'commented') {
          formattedPosts.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
        }
        
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
        
        // Process through optimized pipeline
        const { posts: finalPosts, stages } = await processPostsPipeline(formattedPosts, user?.id);
        
        console.log(`✨ Page ${page} complete: ${finalPosts.length} posts delivered`);
        console.log('📊 Pipeline stages:', stages);
        
        return finalPosts;
        
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
