import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';

interface CascadeMetrics {
  level: 'primary' | 'fallback1' | 'fallback2' | 'fallback3';
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
  private static readonly MAX_AMBASSADOR_PERCENTAGE = 0.3;
  private static readonly POSTS_PER_PAGE = 10;
  private static readonly QUERY_TIMEOUT = 5000; // 5 seconds

  static async executeQueryCascade(
    userId: string,
    userFollowings: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🔄 Starting query cascade', { 
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

      // Level 1: Enhanced personalized feed
      const primaryStart = performance.now();
      const primaryResult = await this.queryPersonalizedFeedEnhanced(userId, userFollowings, offset);
      totalQueries++;
      
      metrics.push({
        level: 'primary',
        postCount: primaryResult.posts.length,
        queryTime: performance.now() - primaryStart,
        source: 'personalized_enhanced',
        cacheHit: false,
        errorCount: 0,
        debugInfo: primaryResult.debugInfo
      });
      
      allPosts.push(...primaryResult.posts);
      debugData.primaryQuery = primaryResult.debugInfo;
      console.log('📊 Enhanced primary query complete', { 
        count: primaryResult.posts.length, 
        time: Math.round(performance.now() - primaryStart) + 'ms',
        debugInfo: primaryResult.debugInfo
      });

      // Level 2: Fallback 1 - Public highlights from network
      if (allPosts.length < 3) {
        const fallback1Start = performance.now();
        const networkHighlights = await this.queryNetworkHighlights(userFollowings, offset);
        totalQueries++;
        
        metrics.push({
          level: 'fallback1',
          postCount: networkHighlights.length,
          queryTime: performance.now() - fallback1Start,
          source: 'network_highlights',
          cacheHit: false,
          errorCount: 0
        });
        
        allPosts.push(...networkHighlights);
        console.log('📊 Fallback 1 complete', { count: networkHighlights.length, time: Math.round(performance.now() - fallback1Start) + 'ms' });
      }

      // Level 3: Fallback 2 - Any public highlights
      if (allPosts.length < 5) {
        const fallback2Start = performance.now();
        const publicHighlights = await this.queryPublicHighlights(offset);
        totalQueries++;
        
        metrics.push({
          level: 'fallback2',
          postCount: publicHighlights.length,
          queryTime: performance.now() - fallback2Start,
          source: 'public_highlights',
          cacheHit: false,
          errorCount: 0
        });
        
        allPosts.push(...publicHighlights);
        console.log('📊 Fallback 2 complete', { count: publicHighlights.length, time: Math.round(performance.now() - fallback2Start) + 'ms' });
      }

      // Level 4: Enhanced Ambassador content with proper following logic
      if (allPosts.length < this.MIN_POSTS) {
        const fallback3Start = performance.now();
        const ambassadorResult = await this.queryAmbassadorContentWithFollowing(userFollowings, offset);
        const maxAmbassadorPosts = Math.floor(allPosts.length * this.MAX_AMBASSADOR_PERCENTAGE);
        const limitedAmbassadorPosts = ambassadorResult.posts.slice(0, Math.max(3, maxAmbassadorPosts)); // Ensure at least 3 ambassador posts
        totalQueries++;
        
        metrics.push({
          level: 'fallback3',
          postCount: limitedAmbassadorPosts.length,
          queryTime: performance.now() - fallback3Start,
          source: 'ambassadors_following_aware',
          cacheHit: false,
          errorCount: 0,
          debugInfo: ambassadorResult.debugInfo
        });
        
        allPosts.push(...limitedAmbassadorPosts);
        debugData.ambassadorQuery = ambassadorResult.debugInfo;
        console.log('📊 Enhanced fallback 3 complete', { 
          count: limitedAmbassadorPosts.length, 
          time: Math.round(performance.now() - fallback3Start) + 'ms',
          debugInfo: ambassadorResult.debugInfo
        });
      }

      // Remove duplicates and enforce ambassador limit
      const uniquePosts = this.removeDuplicates(allPosts);
      const finalPosts = this.enforceAmbassadorLimit(uniquePosts);

      const ambassadorCount = finalPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const ambassadorPercentage = finalPosts.length > 0 
        ? ambassadorCount / finalPosts.length 
        : 0;

      const totalQueryTime = performance.now() - startTime;
      const cacheHitRate = totalQueries > 0 ? totalCacheHits / totalQueries : 0;

      console.log('✅ Enhanced query cascade complete', {
        totalPosts: finalPosts.length,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(totalQueryTime) + 'ms',
        levels: metrics.length,
        cacheHitRate: Math.round(cacheHitRate * 100) + '%',
        debugData
      });

      // Performance warning if too slow
      if (totalQueryTime > 3000) {
        console.warn('⚠️ Query cascade took longer than 3 seconds:', totalQueryTime + 'ms');
      }

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
      console.error('❌ Query cascade failed:', error);
      
      // Return existing posts with error metrics
      return {
        posts: existingPosts,
        metrics: metrics.map(m => ({ ...m, errorCount: 1 })),
        totalPosts: existingPosts.length,
        ambassadorPercentage: 0,
        totalQueryTime: performance.now() - startTime,
        cacheHitRate: 0,
        debugData
      };
    }
  }

  private static async getFollowedUsersDebugInfo(userFollowings: string[]) {
    if (userFollowings.length === 0) return { followedUsers: [], totalPosts: 0 };

    try {
      // Get post counts per followed user
      const { data: postCounts, error } = await supabase
        .from('posts')
        .select('user_id, privacy_level, created_at')
        .in('user_id', userFollowings);

      if (error) {
        console.error('Error getting post counts:', error);
        return { followedUsers: [], totalPosts: 0, error: error.message };
      }

      // Get user profiles
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

      // Aggregate data per user
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

  private static async queryPersonalizedFeedEnhanced(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], debugInfo: any }> {
    if (userFollowings.length === 0) {
      return { 
        posts: [], 
        debugInfo: { message: 'No users being followed', followingCount: 0 } 
      };
    }

    const debugInfo: any = {
      followingCount: userFollowings.length,
      queryUsers: [userId, ...userFollowings],
      privacyLevels: ['public', 'friends', 'public_highlights']
    };

    try {
      // Enhanced query - removed date restrictions, increased range
      const query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends', 'public_highlights'])
        .order('created_at', { ascending: false })
        .range(offset, offset + (this.POSTS_PER_PAGE * 3) - 1); // Get more posts

      const { data, error } = await this.executeWithTimeout(
        Promise.resolve(query)
      );

      if (error) {
        console.error('Error in enhanced personalized feed query:', error);
        debugInfo.error = error.message;
        return { posts: [], debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      debugInfo.postsByUser = {};
      
      // Analyze posts by user
      data?.forEach(post => {
        if (!debugInfo.postsByUser[post.user_id]) {
          debugInfo.postsByUser[post.user_id] = {
            count: 0,
            privacyLevels: {},
            latestPost: null
          };
        }
        
        const userStats = debugInfo.postsByUser[post.user_id];
        userStats.count++;
        userStats.privacyLevels[post.privacy_level] = (userStats.privacyLevels[post.privacy_level] || 0) + 1;
        
        if (!userStats.latestPost || new Date(post.created_at) > new Date(userStats.latestPost)) {
          userStats.latestPost = post.created_at;
        }
      });

      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;

      return { posts, debugInfo };

    } catch (error) {
      console.error('Error in queryPersonalizedFeedEnhanced:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static async queryAmbassadorContentWithFollowing(
    userFollowings: string[],
    offset: number
  ): Promise<{ posts: Post[], debugInfo: any }> {
    const debugInfo: any = {
      followedAmbassadors: [],
      unfollowedAmbassadors: [],
      followedAmbassadorPosts: 0,
      unfollowedAmbassadorPosts: 0,
      totalAmbassadorPosts: 0,
      distributionStrategy: 'following_prioritized'
    };

    try {
      // First, get all ambassador profiles to understand the landscape
      const { data: allAmbassadors, error: allAmbassadorsError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('user_type', 'ambassador');

      if (allAmbassadorsError) {
        console.error('Error fetching all ambassadors:', allAmbassadorsError);
        debugInfo.error = allAmbassadorsError.message;
        return { posts: [], debugInfo };
      }

      debugInfo.totalAmbassadors = allAmbassadors?.length || 0;

      // Separate followed vs unfollowed ambassadors
      if (allAmbassadors) {
        debugInfo.followedAmbassadors = allAmbassadors.filter(amb => 
          userFollowings.includes(amb.id)
        );
        debugInfo.unfollowedAmbassadors = allAmbassadors.filter(amb => 
          !userFollowings.includes(amb.id)
        );
      }

      const followedAmbassadorIds = debugInfo.followedAmbassadors.map((amb: any) => amb.id);
      const unfollowedAmbassadorIds = debugInfo.unfollowedAmbassadors.map((amb: any) => amb.id);

      console.log('🔍 Ambassador distribution analysis:', {
        totalAmbassadors: debugInfo.totalAmbassadors,
        followedCount: debugInfo.followedAmbassadors.length,
        unfollowedCount: debugInfo.unfollowedAmbassadors.length,
        followedAmbassadorIds,
        unfollowedAmbassadorIds
      });

      // Strategy: Get posts from followed ambassadors first, then fill with unfollowed
      let allAmbassadorPosts: any[] = [];

      // Get posts from followed ambassadors (prioritized)
      if (followedAmbassadorIds.length > 0) {
        const { data: followedAmbPosts, error: followedError } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .or(`user_id.in.(${followedAmbassadorIds.join(',')}),is_ambassador_content.eq.true`)
          .in('user_id', followedAmbassadorIds)
          .order('created_at', { ascending: false })
          .range(0, this.POSTS_PER_PAGE * 2 - 1); // Get more from followed ambassadors

        if (!followedError && followedAmbPosts) {
          allAmbassadorPosts.push(...followedAmbPosts);
          debugInfo.followedAmbassadorPosts = followedAmbPosts.length;
        }
      }

      // If we need more posts, get from unfollowed ambassadors
      const remainingSlots = this.POSTS_PER_PAGE - allAmbassadorPosts.length;
      if (remainingSlots > 0 && unfollowedAmbassadorIds.length > 0) {
        const { data: unfollowedAmbPosts, error: unfollowedError } = await supabase
          .from('posts')
          .select(`
            id, content, created_at, user_id, media_url, media_type,
            privacy_level, template_id, is_auto_generated, engagement_score,
            is_ambassador_content
          `)
          .or(`user_id.in.(${unfollowedAmbassadorIds.join(',')}),is_ambassador_content.eq.true`)
          .in('user_id', unfollowedAmbassadorIds)
          .order('created_at', { ascending: false })
          .range(0, remainingSlots - 1);

        if (!unfollowedError && unfollowedAmbPosts) {
          allAmbassadorPosts.push(...unfollowedAmbPosts);
          debugInfo.unfollowedAmbassadorPosts = unfollowedAmbPosts.length;
        }
      }

      // Format all ambassador posts
      const posts = this.formatPosts(allAmbassadorPosts, true);
      
      // Distribute posts evenly across followed ambassadors first
      const distributedPosts = this.distributeAmbassadorPosts(posts, debugInfo.followedAmbassadors, debugInfo.unfollowedAmbassadors);
      
      debugInfo.totalAmbassadorPosts = distributedPosts.length;
      debugInfo.finalDistribution = this.analyzePostDistribution(distributedPosts);

      console.log('🎯 Ambassador content distribution complete:', {
        followedAmbassadorPosts: debugInfo.followedAmbassadorPosts,
        unfollowedAmbassadorPosts: debugInfo.unfollowedAmbassadorPosts,
        totalPosts: debugInfo.totalAmbassadorPosts,
        finalDistribution: debugInfo.finalDistribution
      });

      return { posts: distributedPosts, debugInfo };

    } catch (error) {
      console.error('Error in queryAmbassadorContentWithFollowing:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static distributeAmbassadorPosts(
    posts: Post[], 
    followedAmbassadors: any[], 
    unfollowedAmbassadors: any[]
  ): Post[] {
    // Group posts by ambassador
    const postsByAmbassador = new Map<string, Post[]>();
    
    posts.forEach(post => {
      if (!postsByAmbassador.has(post.user_id)) {
        postsByAmbassador.set(post.user_id, []);
      }
      postsByAmbassador.get(post.user_id)!.push(post);
    });

    // Distribute posts using round-robin within each category
    const result: Post[] = [];
    const followedIds = followedAmbassadors.map(amb => amb.id);
    
    // First, distribute posts from followed ambassadors
    const followedPosts = Array.from(postsByAmbassador.entries())
      .filter(([userId]) => followedIds.includes(userId))
      .flatMap(([, userPosts]) => userPosts);
    
    const unfollowedPosts = Array.from(postsByAmbassador.entries())
      .filter(([userId]) => !followedIds.includes(userId))
      .flatMap(([, userPosts]) => userPosts);

    // Round-robin distribution for followed ambassadors (priority)
    let followedIndex = 0;
    for (let i = 0; i < followedPosts.length && result.length < this.POSTS_PER_PAGE; i++) {
      result.push(followedPosts[followedIndex]);
      followedIndex = (followedIndex + 1) % followedPosts.length;
    }

    // Fill remaining slots with unfollowed ambassador posts
    let unfollowedIndex = 0;
    for (let i = 0; i < unfollowedPosts.length && result.length < this.POSTS_PER_PAGE; i++) {
      result.push(unfollowedPosts[unfollowedIndex]);
      unfollowedIndex = (unfollowedIndex + 1) % unfollowedPosts.length;
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
      .eq('privacy_level', 'public_highlights')
      .order('created_at', { ascending: false })
      .range(offset, offset + this.POSTS_PER_PAGE - 1);

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
      .eq('privacy_level', 'public_highlights')
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + this.POSTS_PER_PAGE - 1);

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

  private static enforceAmbassadorLimit(posts: Post[]): Post[] {
    const ambassadorPosts = posts.filter(post => 
      post.author?.user_type === 'ambassador' || post.is_ambassador_content
    );
    const regularPosts = posts.filter(post => 
      !(post.author?.user_type === 'ambassador' || post.is_ambassador_content)
    );

    const maxAmbassadorPosts = Math.floor(posts.length * this.MAX_AMBASSADOR_PERCENTAGE);
    const limitedAmbassadorPosts = ambassadorPosts.slice(0, maxAmbassadorPosts);

    return [...regularPosts, ...limitedAmbassadorPosts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
}
