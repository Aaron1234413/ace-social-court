import { supabase } from '@/integrations/supabase/client';
import { Post } from "@/types/post";

export type FeedFilter = 'all' | 'following' | 'discover';

interface CascadeMetrics {
  level: 'primary' | 'ambassador' | 'fallback1' | 'fallback2';
  postCount: number;
  queryTime: number;
  source: string;
  cacheHit?: boolean;
  errorCount?: number;
  debugInfo?: any;
}

interface CascadeResult {
  posts: Post[];
  metrics: CascadeMetrics[];
  totalPosts: number;
  ambassadorPercentage: number;
  totalQueryTime: number;
  cacheHitRate: number;
  debugData?: any;
  hasErrors?: boolean;
  errorDetails?: string[];
}

export class FeedQueryCascade {
  private static readonly MIN_POSTS = 8;
  private static readonly AMBASSADOR_TARGET_PERCENTAGE = 0.4;
  private static readonly MIN_AMBASSADOR_POSTS = 3;
  private static readonly POSTS_PER_PAGE = 12;
  private static readonly QUERY_TIMEOUT = 5000;

  static async executeQueryCascade(
    userId: string,
    userFollowings: string[],
    page: number = 0,
    existingPosts: Post[] = [],
    filter: FeedFilter = 'all'
  ): Promise<CascadeResult> {
    console.log('🚀 STARTING FEED QUERY CASCADE WITH FILTERING', { 
      userId, 
      followingCount: userFollowings.length,
      page,
      existingPostCount: existingPosts.length,
      filter,
      timestamp: new Date().toISOString()
    });

    const startTime = performance.now();
    const metrics: CascadeMetrics[] = [];
    let allPosts: Post[] = [...existingPosts];
    const offset = page * this.POSTS_PER_PAGE;
    let totalCacheHits = 0;
    let totalQueries = 0;
    const debugData: any = { 
      steps: [],
      errors: [],
      queries: [],
      filter
    };
    const errorDetails: string[] = [];

    try {
      // STEP 1: Get Ambassador Content (always included for quality)
      console.log('🌟 STEP 1: Fetching ambassador content for filter:', filter);
      debugData.steps.push(`Starting ambassador query for filter: ${filter}`);
      
      const ambassadorStart = performance.now();
      const ambassadorResult = await this.queryAmbassadorContentRobust(filter, userFollowings);
      totalQueries++;
      
      const ambassadorMetric = {
        level: 'ambassador' as const,
        postCount: ambassadorResult.posts.length,
        queryTime: performance.now() - ambassadorStart,
        source: `${filter}_ambassadors`,
        cacheHit: false,
        errorCount: ambassadorResult.errors.length,
        debugInfo: ambassadorResult.debugInfo
      };
      
      metrics.push(ambassadorMetric);
      allPosts.push(...ambassadorResult.posts);
      debugData.queries.push(ambassadorResult.debugInfo);
      
      if (ambassadorResult.errors.length > 0) {
        errorDetails.push(...ambassadorResult.errors);
        debugData.errors.push(...ambassadorResult.errors);
      }

      console.log('🌟 Ambassador content result:', {
        filter,
        posts: ambassadorResult.posts.length,
        errors: ambassadorResult.errors.length,
        time: Math.round(ambassadorMetric.queryTime) + 'ms'
      });

      // STEP 2: Get Filtered Content Based on Selection
      if (filter === 'following' && userFollowings.length > 0) {
        console.log('👥 STEP 2: Fetching content from followed users only');
        debugData.steps.push('Starting followed users only query');
        
        const followingStart = performance.now();
        const followingResult = await this.queryFollowingContentRobust(userId, userFollowings, offset);
        totalQueries++;
        
        const followingMetric = {
          level: 'primary' as const,
          postCount: followingResult.posts.length,
          queryTime: performance.now() - followingStart,
          source: 'following_only',
          cacheHit: false,
          errorCount: followingResult.errors.length,
          debugInfo: followingResult.debugInfo
        };
        
        metrics.push(followingMetric);
        allPosts.push(...followingResult.posts);
        debugData.queries.push(followingResult.debugInfo);
        
        if (followingResult.errors.length > 0) {
          errorDetails.push(...followingResult.errors);
          debugData.errors.push(...followingResult.errors);
        }

        console.log('👥 Following content result:', {
          posts: followingResult.posts.length,
          errors: followingResult.errors.length,
          time: Math.round(followingMetric.queryTime) + 'ms'
        });

      } else if (filter === 'discover') {
        console.log('🔍 STEP 2: Fetching discover content (excluding followed users)');
        debugData.steps.push('Starting discover content query');
        
        const discoverStart = performance.now();
        const discoverResult = await this.queryDiscoverContentRobust(userFollowings, offset);
        totalQueries++;
        
        const discoverMetric = {
          level: 'primary' as const,
          postCount: discoverResult.posts.length,
          queryTime: performance.now() - discoverStart,
          source: 'discover_content',
          cacheHit: false,
          errorCount: discoverResult.errors.length,
          debugInfo: discoverResult.debugInfo
        };
        
        metrics.push(discoverMetric);
        allPosts.push(...discoverResult.posts);
        debugData.queries.push(discoverResult.debugInfo);
        
        if (discoverResult.errors.length > 0) {
          errorDetails.push(...discoverResult.errors);
          debugData.errors.push(...discoverResult.errors);
        }

        console.log('🔍 Discover content result:', {
          posts: discoverResult.posts.length,
          errors: discoverResult.errors.length,
          time: Math.round(discoverMetric.queryTime) + 'ms'
        });

      } else if (filter === 'all') {
        console.log('🌐 STEP 2: Fetching all content (current mixed behavior)');
        debugData.steps.push('Starting mixed content query');
        
        const mixedStart = performance.now();
        const mixedResult = await this.queryPersonalizedContentRobust(userId, userFollowings, offset);
        totalQueries++;
        
        const mixedMetric = {
          level: 'primary' as const,
          postCount: mixedResult.posts.length,
          queryTime: performance.now() - mixedStart,
          source: 'mixed_content',
          cacheHit: false,
          errorCount: mixedResult.errors.length,
          debugInfo: mixedResult.debugInfo
        };
        
        metrics.push(mixedMetric);
        allPosts.push(...mixedResult.posts);
        debugData.queries.push(mixedResult.debugInfo);
        
        if (mixedResult.errors.length > 0) {
          errorDetails.push(...mixedResult.errors);
          debugData.errors.push(...mixedResult.errors);
        }

        console.log('🌐 Mixed content result:', {
          posts: mixedResult.posts.length,
          errors: mixedResult.errors.length,
          time: Math.round(mixedMetric.queryTime) + 'ms'
        });
      }

      // STEP 3: Emergency Public Content if Still Low
      if (allPosts.length < this.MIN_POSTS) {
        console.log('🔄 STEP 3: Adding emergency public content');
        debugData.steps.push('Adding emergency public content');
        
        const fallbackStart = performance.now();
        const publicResult = await this.queryPublicContentRobust(offset);
        totalQueries++;
        
        const fallbackMetric = {
          level: 'fallback1' as const,
          postCount: publicResult.posts.length,
          queryTime: performance.now() - fallbackStart,
          source: 'emergency_public',
          cacheHit: false,
          errorCount: publicResult.errors.length,
          debugInfo: publicResult.debugInfo
        };
        
        metrics.push(fallbackMetric);
        allPosts.push(...publicResult.posts);
        debugData.queries.push(publicResult.debugInfo);
        
        if (publicResult.errors.length > 0) {
          errorDetails.push(...publicResult.errors);
          debugData.errors.push(...publicResult.errors);
        }

        console.log('🔄 Emergency public content result:', {
          posts: publicResult.posts.length,
          errors: publicResult.errors.length,
          time: Math.round(fallbackMetric.queryTime) + 'ms'
        });
      }

      // Remove duplicates but preserve order
      const uniquePosts = this.removeDuplicatesPreserveOrder(allPosts);
      console.log('🔧 Removed duplicates:', {
        before: allPosts.length,
        after: uniquePosts.length,
        removed: allPosts.length - uniquePosts.length
      });

      // Smart mix content - but ensure we don't lose posts
      let finalPosts = uniquePosts;
      if (uniquePosts.length > 0) {
        try {
          const mixedPosts = await this.smartMixContent(uniquePosts, userFollowings, userId);
          if (mixedPosts.length > 0) {
            finalPosts = mixedPosts;
            console.log('🎭 Smart mixing applied successfully');
          } else {
            console.warn('⚠️ Smart mixing returned empty - using original posts');
            debugData.errors.push('Smart mixing returned empty array');
          }
        } catch (mixError) {
          console.error('❌ Smart mixing failed:', mixError);
          debugData.errors.push(`Smart mixing error: ${mixError.message}`);
          errorDetails.push(`Smart mixing failed: ${mixError.message}`);
          // Continue with unmixed posts
        }
      }

      // ABSOLUTE LAST RESORT - Hardcoded content
      if (finalPosts.length === 0) {
        console.log('🚨 ABSOLUTE EMERGENCY: Creating hardcoded fallback content');
        debugData.steps.push('Using hardcoded fallback content');
        
        finalPosts = this.createHardcodedFallbackContent();
        
        const hardcodedMetric = {
          level: 'fallback2' as const,
          postCount: finalPosts.length,
          queryTime: 0,
          source: 'hardcoded_fallback',
          cacheHit: false,
          errorCount: 0,
          debugInfo: { source: 'hardcoded', reason: 'all_queries_failed', filter }
        };
        metrics.push(hardcodedMetric);
      }

      // Final analysis
      const ambassadorCount = finalPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const ambassadorPercentage = finalPosts.length > 0 
        ? ambassadorCount / finalPosts.length 
        : 0;

      const totalQueryTime = performance.now() - startTime;
      const cacheHitRate = totalQueries > 0 ? totalCacheHits / totalQueries : 0;

      console.log('✅ FEED QUERY CASCADE COMPLETE WITH FILTERING:', {
        filter,
        totalPosts: finalPosts.length,
        ambassadorCount,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(totalQueryTime) + 'ms',
        cascadeLevels: metrics.length,
        totalErrors: errorDetails.length,
        stepsCompleted: debugData.steps.length
      });

      return {
        posts: finalPosts,
        metrics,
        totalPosts: finalPosts.length,
        ambassadorPercentage,
        totalQueryTime,
        cacheHitRate,
        debugData,
        hasErrors: errorDetails.length > 0,
        errorDetails
      };

    } catch (error) {
      console.error('💥 CRITICAL FEED CASCADE FAILURE:', error);
      errorDetails.push(`Critical cascade failure: ${error.message}`);
      
      // EMERGENCY PROTOCOL - Always return something
      const emergencyPosts = this.createHardcodedFallbackContent();
      
      return {
        posts: emergencyPosts,
        metrics: metrics.map(m => ({ ...m, errorCount: (m.errorCount || 0) + 1 })),
        totalPosts: emergencyPosts.length,
        ambassadorPercentage: 0.5, // Hardcoded content has 50% ambassadors
        totalQueryTime: performance.now() - startTime,
        cacheHitRate: 0,
        debugData: { 
          ...debugData, 
          criticalError: error.message,
          emergencyFallback: true,
          filter
        },
        hasErrors: true,
        errorDetails
      };
    }
  }

  private static async queryAmbassadorContentRobust(
    filter: FeedFilter, 
    userFollowings: string[]
  ): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = { source: 'filtered_ambassadors', filter, steps: [] };
    const errors: string[] = [];

    try {
      console.log('🔍 Robust ambassador query starting with filter:', filter);
      debugInfo.steps.push(`Starting ambassador profile query for ${filter}`);
      
      // Get ambassador profiles
      const { data: ambassadors, error: ambassadorsError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, avatar_url')
        .eq('user_type', 'ambassador')
        .limit(20);

      if (ambassadorsError) {
        const errorMsg = `Ambassador profiles query failed: ${ambassadorsError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.ambassadorError = ambassadorsError.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.totalAmbassadors = ambassadors?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.totalAmbassadors} ambassadors`);

      if (!ambassadors || ambassadors.length === 0) {
        const errorMsg = 'No ambassadors found in system';
        console.warn('⚠️', errorMsg);
        errors.push(errorMsg);
        return { posts: [], errors, debugInfo };
      }

      const ambassadorIds = ambassadors.map(amb => amb.id);
      
      // Filter ambassador posts based on the feed filter
      let ambassadorPostsQuery = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score,
          is_ambassador_content
        `)
        .in('user_id', ambassadorIds)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false });

      // For following filter, only show ambassadors that the user follows
      if (filter === 'following' && userFollowings.length > 0) {
        const followedAmbassadors = ambassadorIds.filter(id => userFollowings.includes(id));
        if (followedAmbassadors.length > 0) {
          ambassadorPostsQuery = ambassadorPostsQuery.in('user_id', followedAmbassadors);
          debugInfo.followedAmbassadors = followedAmbassadors.length;
        } else {
          // No followed ambassadors, but include some for quality
          ambassadorPostsQuery = ambassadorPostsQuery.limit(3);
          debugInfo.noFollowedAmbassadors = true;
        }
      }

      ambassadorPostsQuery = ambassadorPostsQuery.limit(filter === 'following' ? 8 : 15);

      const { data: ambassadorPosts, error: postsError } = await ambassadorPostsQuery;

      if (postsError) {
        const errorMsg = `Ambassador posts query failed: ${postsError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.postsError = postsError.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = ambassadorPosts?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} ambassador posts for ${filter}`);
      
      // Format posts with ambassador flag
      const posts = this.formatPosts(ambassadorPosts || [], ambassadors);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts`);

      console.log('✅ Ambassador content query complete:', {
        filter,
        ambassadors: debugInfo.totalAmbassadors,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected ambassador query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static async queryFollowingContentRobust(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = {
      followingCount: userFollowings.length,
      queryUsers: [userId, ...userFollowings],
      steps: []
    };
    const errors: string[] = [];

    try {
      console.log('🔍 Robust following-only content query starting...');
      debugInfo.steps.push('Starting following-only content query');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends'])
        .order('created_at', { ascending: false })
        .range(offset, offset + this.POSTS_PER_PAGE - 1);

      if (error) {
        const errorMsg = `Following content query failed: ${error.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.queryError = error.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} following posts`);
      
      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts`);

      console.log('✅ Following content query complete:', {
        followingCount: debugInfo.followingCount,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected following query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static async queryDiscoverContentRobust(
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = { source: 'discover_content', excludedUsers: userFollowings.length, steps: [] };
    const errors: string[] = [];

    try {
      console.log('🔍 Robust discover content query starting...');
      debugInfo.steps.push('Starting discover content query');
      
      let query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .eq('privacy_level', 'public')
        .order('engagement_score', { ascending: false })
        .order('created_at', { ascending: false });

      // Exclude posts from users we're already following
      if (userFollowings.length > 0) {
        query = query.not('user_id', 'in', `(${userFollowings.join(',')})`);
        debugInfo.excludedFollowingUsers = userFollowings.length;
      }

      const { data, error } = await query.range(offset, offset + 10 - 1);

      if (error) {
        const errorMsg = `Discover content query failed: ${error.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.queryError = error.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} discover posts`);
      
      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts`);

      console.log('✅ Discover content query complete:', {
        excludedUsers: debugInfo.excludedUsers,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected discover query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static async queryPersonalizedContentRobust(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = {
      followingCount: userFollowings.length,
      queryUsers: [userId, ...userFollowings],
      steps: []
    };
    const errors: string[] = [];

    try {
      console.log('🔍 Robust personalized content query starting...');
      debugInfo.steps.push('Starting personalized content query');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends'])
        .order('created_at', { ascending: false })
        .range(offset, offset + this.POSTS_PER_PAGE - 1);

      if (error) {
        const errorMsg = `Personalized content query failed: ${error.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.queryError = error.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} personalized posts`);
      
      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts`);

      console.log('✅ Personalized content query complete:', {
        followingCount: debugInfo.followingCount,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected personalized query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static async queryPublicContentRobust(offset: number): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = { source: 'public_content', steps: [] };
    const errors: string[] = [];

    try {
      console.log('🔍 Robust public content query starting...');
      debugInfo.steps.push('Starting public content query');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .eq('privacy_level', 'public')
        .order('engagement_score', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + 10 - 1);

      if (error) {
        const errorMsg = `Public content query failed: ${error.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.queryError = error.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} public posts`);
      
      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts`);

      console.log('✅ Public content query complete:', {
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected public query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static formatPosts(rawPosts: any[], ambassadorProfiles?: any[]): Post[] {
    return rawPosts.map(post => {
      // Find ambassador profile if available
      const ambassadorProfile = ambassadorProfiles?.find(profile => profile.id === post.user_id);
      
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
        is_ambassador_content: ambassadorProfile ? true : (post.is_ambassador_content || false),
        author: ambassadorProfile ? {
          full_name: ambassadorProfile.full_name,
          user_type: ambassadorProfile.user_type,
          avatar_url: ambassadorProfile.avatar_url
        } : null,
        likes_count: 0,
        comments_count: 0
      };
    });
  }

  private static removeDuplicatesPreserveOrder(posts: Post[]): Post[] {
    const seen = new Set<string>();
    return posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }

  private static async smartMixContent(posts: Post[], userFollowings: string[], currentUserId?: string): Promise<Post[]> {
    console.log('🎭 Applying smart content mixing for balanced feed');
    
    try {
      const { createSmartFeedMix } = await import('@/utils/smartFeedMixing');
      
      const mixedPosts = createSmartFeedMix(posts, {
        followingCount: userFollowings.length,
        userFollowings,
        currentUserId
      });

      console.log('✅ Smart mixing complete:', {
        originalCount: posts.length,
        mixedCount: mixedPosts.length,
        ambassadorCount: mixedPosts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length
      });

      return mixedPosts;
    } catch (error) {
      console.error('❌ Smart mixing failed:', error);
      return posts; // Return original posts if mixing fails
    }
  }

  private static createHardcodedFallbackContent(): Post[] {
    console.log('🚨 Creating hardcoded fallback content as last resort');
    
    const fallbackPosts: Post[] = [
      {
        id: 'fallback-1',
        content: "Welcome to Rally! 🎾 Start your tennis journey by connecting with players and coaches in your area.",
        created_at: new Date().toISOString(),
        user_id: 'system-ambassador-1',
        media_url: null,
        media_type: null,
        privacy_level: 'public',
        template_id: null,
        is_auto_generated: true,
        engagement_score: 100,
        is_ambassador_content: true,
        author: {
          full_name: 'Rally Ambassador',
          user_type: 'ambassador',
          avatar_url: null
        },
        likes_count: 25,
        comments_count: 5
      },
      {
        id: 'fallback-2',
        content: "🏆 Pro tip: Consistency beats perfection! Focus on getting 80% of your serves in rather than trying for aces every time.",
        created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        user_id: 'system-ambassador-2',
        media_url: null,
        media_type: null,
        privacy_level: 'public',
        template_id: null,
        is_auto_generated: true,
        engagement_score: 85,
        is_ambassador_content: true,
        author: {
          full_name: 'Coach Sarah',
          user_type: 'ambassador',
          avatar_url: null
        },
        likes_count: 18,
        comments_count: 3
      },
      {
        id: 'fallback-3',
        content: "Just finished an amazing practice session! Remember: every champion was once a beginner. Keep pushing forward! 💪",
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        user_id: 'system-user-1',
        media_url: null,
        media_type: null,
        privacy_level: 'public',
        template_id: null,
        is_auto_generated: true,
        engagement_score: 70,
        is_ambassador_content: false,
        author: {
          full_name: 'Tennis Enthusiast',
          user_type: 'player',
          avatar_url: null
        },
        likes_count: 12,
        comments_count: 2
      }
    ];

    return fallbackPosts;
  }
}
