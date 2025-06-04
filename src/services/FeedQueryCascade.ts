import { supabase } from '@/integrations/supabase/client';
import { Post } from "@/types/post";

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
}

export class FeedQueryCascade {
  private static readonly MIN_POSTS = 8;
  private static readonly AMBASSADOR_TARGET_PERCENTAGE = 0.4; // Increased from 0.3 to 40%
  private static readonly MIN_AMBASSADOR_POSTS = 3; // Minimum ambassador posts regardless of other content
  private static readonly POSTS_PER_PAGE = 12; // Increased to get more variety
  private static readonly QUERY_TIMEOUT = 5000;

  static async executeQueryCascade(
    userId: string,
    userFollowings: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🎯 Starting RESTRUCTURED feed cascade - Ambassadors as CORE content', { 
      userId, 
      followingCount: userFollowings.length,
      page,
      existingPostCount: existingPosts.length
    });

    const startTime = performance.now();
    const metrics: CascadeMetrics[] = [];
    let allPosts: Post[] = [...existingPosts];
    const offset = page * this.POSTS_PER_PAGE;
    let totalCacheHits = 0;
    let totalQueries = 0;
    const debugData: any = {};

    try {
      // Enhanced debug info collection
      debugData.followedUsers = await this.getFollowedUsersDebugInfo(userFollowings);
      console.log('👥 Following debug info:', debugData.followedUsers);

      // STEP 1: Get personalized content from followed users (with visibility validation)
      const primaryStart = performance.now();
      const primaryResult = await this.queryPersonalizedFeedWithValidation(userId, userFollowings, offset);
      totalQueries++;
      
      const primaryMetric = {
        level: 'primary' as const,
        postCount: primaryResult.posts.length,
        queryTime: performance.now() - primaryStart,
        source: 'personalized_validated',
        cacheHit: false,
        errorCount: 0,
        debugInfo: primaryResult.debugInfo
      };
      
      metrics.push(primaryMetric);
      allPosts.push(...primaryResult.posts);
      debugData.primaryQuery = primaryResult.debugInfo;

      console.log('📊 Primary query (followed users) complete:', {
        posts: primaryResult.posts.length,
        time: Math.round(primaryMetric.queryTime) + 'ms',
        validated: primaryResult.debugInfo?.validatedPosts || 0
      });

      // STEP 2: CORE AMBASSADOR CONTENT (not fallback anymore!)
      const ambassadorStart = performance.now();
      const targetAmbassadorPosts = Math.max(
        this.MIN_AMBASSADOR_POSTS,
        Math.floor((this.POSTS_PER_PAGE + allPosts.length) * this.AMBASSADOR_TARGET_PERCENTAGE)
      );
      
      console.log('🌟 Fetching CORE ambassador content (target:', targetAmbassadorPosts, ')');
      const ambassadorResult = await this.queryCoreAmbassadorContent(userFollowings, offset, targetAmbassadorPosts);
      totalQueries++;
      
      const ambassadorMetric = {
        level: 'ambassador' as const,
        postCount: ambassadorResult.posts.length,
        queryTime: performance.now() - ambassadorStart,
        source: 'core_ambassadors',
        cacheHit: false,
        errorCount: 0,
        debugInfo: ambassadorResult.debugInfo
      };
      
      metrics.push(ambassadorMetric);
      allPosts.push(...ambassadorResult.posts);
      debugData.ambassadorQuery = ambassadorResult.debugInfo;

      console.log('🌟 Core ambassador content complete:', {
        posts: ambassadorResult.posts.length,
        time: Math.round(ambassadorMetric.queryTime) + 'ms',
        target: targetAmbassadorPosts
      });

      // STEP 3: Fallback 1 - Additional network content if needed
      if (allPosts.length < this.MIN_POSTS) {
        console.log('🔄 Need more content, adding network highlights');
        const fallback1Start = performance.now();
        const networkHighlights = await this.queryNetworkHighlights(userFollowings, offset);
        totalQueries++;
        
        const fallback1Metric = {
          level: 'fallback1' as const,
          postCount: networkHighlights.length,
          queryTime: performance.now() - fallback1Start,
          source: 'network_highlights',
          cacheHit: false,
          errorCount: 0
        };
        
        metrics.push(fallback1Metric);
        allPosts.push(...networkHighlights);
      }

      // STEP 4: Fallback 2 - Public content if still needed
      if (allPosts.length < this.MIN_POSTS) {
        console.log('🔄 Still need content, adding public highlights');
        const fallback2Start = performance.now();
        const publicHighlights = await this.queryPublicHighlights(offset);
        totalQueries++;
        
        const fallback2Metric = {
          level: 'fallback2' as const,
          postCount: publicHighlights.length,
          queryTime: performance.now() - fallback2Start,
          source: 'public_highlights',
          cacheHit: false,
          errorCount: 0
        };
        
        metrics.push(fallback2Metric);
        allPosts.push(...publicHighlights);
      }

      // Enhanced duplicate removal and smart mixing
      const uniquePosts = this.removeDuplicates(allPosts);
      const finalPosts = await this.smartMixContent(uniquePosts, userFollowings, userId);

      // Enhanced final analysis
      const ambassadorCount = finalPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const ambassadorPercentage = finalPosts.length > 0 
        ? ambassadorCount / finalPosts.length 
        : 0;

      const totalQueryTime = performance.now() - startTime;
      const cacheHitRate = totalQueries > 0 ? totalCacheHits / totalQueries : 0;

      console.log('✅ RESTRUCTURED feed cascade complete:', {
        totalPosts: finalPosts.length,
        ambassadorCount,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(totalQueryTime) + 'ms',
        cascadeLevels: metrics.length,
        breakdown: {
          primary: metrics.find(m => m.level === 'primary')?.postCount || 0,
          ambassador: metrics.find(m => m.level === 'ambassador')?.postCount || 0,
          fallback1: metrics.find(m => m.level === 'fallback1')?.postCount || 0,
          fallback2: metrics.find(m => m.level === 'fallback2')?.postCount || 0
        }
      });

      return {
        posts: finalPosts,
        metrics,
        totalPosts: finalPosts.length,
        ambassadorPercentage,
        totalQueryTime,
        cacheHitRate,
        debugData
      };

    } catch (error) {
      console.error('❌ Restructured query cascade failed:', {
        error: error.message,
        stack: error.stack,
        stage: metrics.length > 0 ? metrics[metrics.length - 1].level : 'initialization'
      });
      
      return {
        posts: existingPosts,
        metrics: metrics.map(m => ({ ...m, errorCount: 1 })),
        totalPosts: existingPosts.length,
        ambassadorPercentage: 0,
        totalQueryTime: performance.now() - startTime,
        cacheHitRate: 0,
        debugData: { error: error.message }
      };
    }
  }

  private static async queryPersonalizedFeedWithValidation(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], debugInfo: any }> {
    if (userFollowings.length === 0) {
      return { 
        posts: [], 
        debugInfo: { message: 'No users being followed', followingCount: 0, validatedPosts: 0 } 
      };
    }

    const debugInfo: any = {
      followingCount: userFollowings.length,
      queryUsers: [userId, ...userFollowings],
      validatedPosts: 0,
      filteredOutPosts: 0
    };

    try {
      console.log('🔍 Querying personalized feed with VISIBILITY VALIDATION');
      
      // Query with broader privacy levels but validate accessibility
      const query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends']) // Only get posts user can actually see
        .order('created_at', { ascending: false })
        .range(offset, offset + this.POSTS_PER_PAGE - 1);

      const { data, error } = await this.executeWithTimeout(Promise.resolve(query));

      if (error) {
        console.error('Error in validated personalized feed query:', error);
        debugInfo.error = error.message;
        return { posts: [], debugInfo };
      }

      // Validate post visibility
      const validatedPosts = data?.filter(post => {
        // User can always see their own posts
        if (post.user_id === userId) return true;
        
        // For followed users, check privacy level
        if (userFollowings.includes(post.user_id)) {
          return post.privacy_level === 'public' || post.privacy_level === 'friends';
        }
        
        // For non-followed users, only public posts
        return post.privacy_level === 'public';
      }) || [];

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.validatedPosts = validatedPosts.length;
      debugInfo.filteredOutPosts = (data?.length || 0) - validatedPosts.length;

      const posts = this.formatPosts(validatedPosts);

      console.log('✅ Personalized feed validation complete:', {
        rawPosts: data?.length || 0,
        validatedPosts: validatedPosts.length,
        filteredOut: debugInfo.filteredOutPosts,
        finalPosts: posts.length
      });

      return { posts, debugInfo };

    } catch (error) {
      console.error('Error in queryPersonalizedFeedWithValidation:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static async queryCoreAmbassadorContent(
    userFollowings: string[],
    offset: number,
    targetCount: number
  ): Promise<{ posts: Post[], debugInfo: any }> {
    const debugInfo: any = {
      targetCount,
      followedAmbassadors: [],
      unfollowedAmbassadors: [],
      followedAmbassadorPosts: 0,
      unfollowedAmbassadorPosts: 0,
      distributionStrategy: 'core_content_mixed'
    };

    try {
      // Get all ambassador profiles
      const { data: allAmbassadors, error: allAmbassadorsError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('user_type', 'ambassador');

      if (allAmbassadorsError) {
        console.error('Error fetching ambassadors:', allAmbassadorsError);
        debugInfo.error = allAmbassadorsError.message;
        return { posts: [], debugInfo };
      }

      debugInfo.totalAmbassadors = allAmbassadors?.length || 0;

      if (!allAmbassadors || allAmbassadors.length === 0) {
        console.log('⚠️ No ambassadors found in system');
        return { posts: [], debugInfo };
      }

      // Separate followed vs unfollowed ambassadors
      debugInfo.followedAmbassadors = allAmbassadors.filter(amb => 
        userFollowings.includes(amb.id)
      );
      debugInfo.unfollowedAmbassadors = allAmbassadors.filter(amb => 
        !userFollowings.includes(amb.id)
      );

      const followedAmbassadorIds = debugInfo.followedAmbassadors.map((amb: any) => amb.id);
      const unfollowedAmbassadorIds = debugInfo.unfollowedAmbassadors.map((amb: any) => amb.id);

      console.log('🎯 Ambassador distribution for CORE content:', {
        totalAmbassadors: debugInfo.totalAmbassadors,
        followedCount: debugInfo.followedAmbassadors.length,
        unfollowedCount: debugInfo.unfollowedAmbassadors.length,
        targetCount
      });

      // Strategy: Get mix of followed and unfollowed ambassadors
      let allAmbassadorPosts: any[] = [];

      // Get posts from followed ambassadors (priority)
      if (followedAmbassadorIds.length > 0) {
        const followedLimit = Math.ceil(targetCount * 0.6); // 60% from followed ambassadors
        const { data: followedAmbPosts, error: followedError } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .in('user_id', followedAmbassadorIds)
          .in('privacy_level', ['public', 'friends']) // Only get visible posts
          .order('created_at', { ascending: false })
          .range(0, followedLimit - 1);

        if (!followedError && followedAmbPosts) {
          allAmbassadorPosts.push(...followedAmbPosts);
          debugInfo.followedAmbassadorPosts = followedAmbPosts.length;
        }
      }

      // Get posts from unfollowed ambassadors (fill remaining slots)
      const remainingSlots = targetCount - allAmbassadorPosts.length;
      if (remainingSlots > 0 && unfollowedAmbassadorIds.length > 0) {
        const { data: unfollowedAmbPosts, error: unfollowedError } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .in('user_id', unfollowedAmbassadorIds)
          .eq('privacy_level', 'public') // Only public posts from unfollowed ambassadors
          .order('created_at', { ascending: false })
          .range(0, remainingSlots - 1);

        if (!unfollowedError && unfollowedAmbPosts) {
          allAmbassadorPosts.push(...unfollowedAmbPosts);
          debugInfo.unfollowedAmbassadorPosts = unfollowedAmbPosts.length;
        }
      }

      // Format and distribute posts
      const posts = this.formatPosts(allAmbassadorPosts, true);
      const distributedPosts = this.distributeAmbassadorPosts(posts, debugInfo.followedAmbassadors, debugInfo.unfollowedAmbassadors);
      
      debugInfo.finalCount = distributedPosts.length;
      debugInfo.finalDistribution = this.analyzePostDistribution(distributedPosts);

      console.log('🌟 Core ambassador content complete:', {
        targetCount,
        followedAmbassadorPosts: debugInfo.followedAmbassadorPosts,
        unfollowedAmbassadorPosts: debugInfo.unfollowedAmbassadorPosts,
        finalCount: debugInfo.finalCount
      });

      return { posts: distributedPosts, debugInfo };

    } catch (error) {
      console.error('Error in queryCoreAmbassadorContent:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static async smartMixContent(posts: Post[], userFollowings: string[], currentUserId?: string): Promise<Post[]> {
    console.log('🎭 Applying smart content mixing for balanced feed');
    
    // Use the enhanced smart feed mixing
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
  }

  
  private static async getFollowedUsersDebugInfo(userFollowings: string[]) {
    if (userFollowings.length === 0) return { followedUsers: [], totalPosts: 0 };

    try {
      const { data: postCounts, error } = await supabase
        .from('posts')
        .select('user_id, privacy_level, created_at')
        .in('user_id', userFollowings);

      if (error) {
        console.error('Error getting post counts:', error);
        return { followedUsers: [], totalPosts: 0, error: error.message };
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .in('id', userFollowings);

      if (profileError) {
        console.error('Error getting profiles:', profileError);
      }

      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      const userStats = new Map();
      postCounts?.forEach(post => {
        if (!userStats.has(post.user_id)) {
          userStats.set(post.user_id, {
            userId: post.user_id,
            profile: profileMap.get(post.user_id),
            totalPosts: 0,
            privacyLevels: {},
            latestPost: null
          });
        }
        
        const stats = userStats.get(post.user_id);
        stats.totalPosts++;
        stats.privacyLevels[post.privacy_level] = (stats.privacyLevels[post.privacy_level] || 0) + 1;
        
        if (!stats.latestPost || new Date(post.created_at) > new Date(stats.latestPost)) {
          stats.latestPost = post.created_at;
        }
      });

      return {
        followedUsers: Array.from(userStats.values()),
        totalPosts: postCounts?.length || 0,
        totalFollowing: userFollowings.length
      };
    } catch (error) {
      console.error('Error in getFollowedUsersDebugInfo:', error);
      return { followedUsers: [], totalPosts: 0, error: error.message };
    }
  }

  private static async executeWithTimeout<T>(
    queryPromise: Promise<T>, 
    timeoutMs: number = this.QUERY_TIMEOUT
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
    });

    return Promise.race([queryPromise, timeoutPromise]);
  }

  private static async queryNetworkHighlights(
    userFollowings: string[], 
    offset: number
  ): Promise<Post[]> {
    if (userFollowings.length === 0) return [];

    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, user_id, media_url, media_type,
        privacy_level, template_id, is_auto_generated, engagement_score
      `)
      .in('user_id', userFollowings)
      .eq('privacy_level', 'public')
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + 5 - 1);

    if (error) {
      console.error('Error in network highlights query:', error);
      return [];
    }

    return this.formatPosts(data || []);
  }

  private static async queryPublicHighlights(offset: number): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, user_id, media_url, media_type,
        privacy_level, template_id, is_auto_generated, engagement_score
      `)
      .eq('privacy_level', 'public')
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + 5 - 1);

    if (error) {
      console.error('Error in public highlights query:', error);
      return [];
    }

    return this.formatPosts(data || []);
  }

  private static formatPosts(rawPosts: any[], isAmbassadorContent = false): Post[] {
    return rawPosts.map(post => ({
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
      is_ambassador_content: isAmbassadorContent || post.is_ambassador_content,
      author: null,
      likes_count: 0,
      comments_count: 0
    }));
  }

  private static removeDuplicates(posts: Post[]): Post[] {
    const seen = new Set();
    return posts.filter(post => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }

  private static distributeAmbassadorPosts(
    posts: Post[], 
    followedAmbassadors: any[], 
    unfollowedAmbassadors: any[]
  ): Post[] {
    const postsByAmbassador = new Map<string, Post[]>();
    
    posts.forEach(post => {
      if (!postsByAmbassador.has(post.user_id)) {
        postsByAmbassador.set(post.user_id, []);
      }
      postsByAmbassador.get(post.user_id)!.push(post);
    });

    const result: Post[] = [];
    const followedIds = followedAmbassadors.map(amb => amb.id);
    
    const followedPosts = Array.from(postsByAmbassador.entries())
      .filter(([userId]) => followedIds.includes(userId))
      .flatMap(([, userPosts]) => userPosts);
    
    const unfollowedPosts = Array.from(postsByAmbassador.entries())
      .filter(([userId]) => !followedIds.includes(userId))
      .flatMap(([, userPosts]) => userPosts);

    // Interleave followed and unfollowed ambassador posts
    let followedIndex = 0;
    let unfollowedIndex = 0;
    
    while (followedIndex < followedPosts.length || unfollowedIndex < unfollowedPosts.length) {
      if (followedIndex < followedPosts.length) {
        result.push(followedPosts[followedIndex++]);
      }
      if (unfollowedIndex < unfollowedPosts.length && result.length < this.POSTS_PER_PAGE) {
        result.push(unfollowedPosts[unfollowedIndex++]);
      }
    }

    return result;
  }

  private static analyzePostDistribution(posts: Post[]): any {
    const distribution = new Map<string, number>();
    
    posts.forEach(post => {
      const count = distribution.get(post.user_id) || 0;
      distribution.set(post.user_id, count + 1);
    });

    return Object.fromEntries(distribution);
  }
}
