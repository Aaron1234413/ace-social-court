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
  private static readonly AMBASSADOR_TARGET_PERCENTAGE = 0.4;
  private static readonly MIN_AMBASSADOR_POSTS = 3;
  private static readonly POSTS_PER_PAGE = 12;
  private static readonly QUERY_TIMEOUT = 5000;

  static async executeQueryCascade(
    userId: string,
    userFollowings: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🎯 Starting FIXED feed cascade with guaranteed content', { 
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
      // STEP 1: Get ALL ambassador content first (guaranteed content)
      const ambassadorStart = performance.now();
      console.log('🌟 Fetching ALL ambassador content (guaranteed)');
      const ambassadorResult = await this.queryAllAmbassadorContent(offset);
      totalQueries++;
      
      const ambassadorMetric = {
        level: 'ambassador' as const,
        postCount: ambassadorResult.posts.length,
        queryTime: performance.now() - ambassadorStart,
        source: 'all_ambassadors',
        cacheHit: false,
        errorCount: 0,
        debugInfo: ambassadorResult.debugInfo
      };
      
      metrics.push(ambassadorMetric);
      allPosts.push(...ambassadorResult.posts);
      debugData.ambassadorQuery = ambassadorResult.debugInfo;

      console.log('🌟 Ambassador content loaded:', {
        posts: ambassadorResult.posts.length,
        time: Math.round(ambassadorMetric.queryTime) + 'ms'
      });

      // STEP 2: Get personalized content from followed users
      if (userFollowings.length > 0) {
        const primaryStart = performance.now();
        const primaryResult = await this.queryPersonalizedContent(userId, userFollowings, offset);
        totalQueries++;
        
        const primaryMetric = {
          level: 'primary' as const,
          postCount: primaryResult.posts.length,
          queryTime: performance.now() - primaryStart,
          source: 'followed_users',
          cacheHit: false,
          errorCount: 0,
          debugInfo: primaryResult.debugInfo
        };
        
        metrics.push(primaryMetric);
        allPosts.push(...primaryResult.posts);
        debugData.primaryQuery = primaryResult.debugInfo;

        console.log('📊 Followed users content loaded:', {
          posts: primaryResult.posts.length,
          time: Math.round(primaryMetric.queryTime) + 'ms'
        });
      }

      // STEP 3: Fallback - Get more public content if still needed
      if (allPosts.length < this.MIN_POSTS) {
        console.log('🔄 Need more content, adding public highlights');
        const fallbackStart = performance.now();
        const publicHighlights = await this.queryPublicHighlights(offset);
        totalQueries++;
        
        const fallbackMetric = {
          level: 'fallback1' as const,
          postCount: publicHighlights.length,
          queryTime: performance.now() - fallbackStart,
          source: 'public_highlights',
          cacheHit: false,
          errorCount: 0
        };
        
        metrics.push(fallbackMetric);
        allPosts.push(...publicHighlights);
      }

      // Remove duplicates and smart mix content
      const uniquePosts = this.removeDuplicates(allPosts);
      const finalPosts = await this.smartMixContent(uniquePosts, userFollowings, userId);

      // Ensure we always have some content (emergency fallback)
      if (finalPosts.length === 0) {
        console.log('⚠️ No posts found, using emergency fallback');
        const emergencyPosts = await this.getEmergencyFallbackContent();
        finalPosts.push(...emergencyPosts);
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

      console.log('✅ FIXED feed cascade complete with guaranteed content:', {
        totalPosts: finalPosts.length,
        ambassadorCount,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(totalQueryTime) + 'ms',
        cascadeLevels: metrics.length
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
      console.error('❌ Feed cascade failed, using emergency fallback:', error);
      
      // Emergency fallback - get ANY content
      try {
        const emergencyPosts = await this.getEmergencyFallbackContent();
        return {
          posts: emergencyPosts,
          metrics: metrics.map(m => ({ ...m, errorCount: 1 })),
          totalPosts: emergencyPosts.length,
          ambassadorPercentage: 0,
          totalQueryTime: performance.now() - startTime,
          cacheHitRate: 0,
          debugData: { error: error.message, emergencyFallback: true }
        };
      } catch (emergencyError) {
        console.error('❌ Even emergency fallback failed:', emergencyError);
        return {
          posts: existingPosts,
          metrics: [],
          totalPosts: existingPosts.length,
          ambassadorPercentage: 0,
          totalQueryTime: performance.now() - startTime,
          cacheHitRate: 0,
          debugData: { error: error.message, emergencyError: emergencyError.message }
        };
      }
    }
  }

  private static async queryAllAmbassadorContent(offset: number): Promise<{ posts: Post[], debugInfo: any }> {
    const debugInfo: any = { source: 'all_ambassadors' };

    try {
      console.log('🔍 Querying ALL ambassador content');
      
      // First, get all ambassador profiles
      const { data: ambassadors, error: ambassadorsError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .eq('user_type', 'ambassador');

      if (ambassadorsError) {
        console.error('Error fetching ambassadors:', ambassadorsError);
        debugInfo.error = ambassadorsError.message;
        return { posts: [], debugInfo };
      }

      debugInfo.totalAmbassadors = ambassadors?.length || 0;
      console.log('Found ambassadors:', debugInfo.totalAmbassadors);

      if (!ambassadors || ambassadors.length === 0) {
        console.log('⚠️ No ambassadors found in system');
        return { posts: [], debugInfo };
      }

      const ambassadorIds = ambassadors.map(amb => amb.id);

      // Get posts from ALL ambassadors
      const { data: ambassadorPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score,
          is_ambassador_content
        `)
        .in('user_id', ambassadorIds)
        .eq('privacy_level', 'public') // Only public posts
        .order('created_at', { ascending: false })
        .range(0, 20); // Get more ambassador posts

      if (postsError) {
        console.error('Error fetching ambassador posts:', postsError);
        debugInfo.error = postsError.message;
        return { posts: [], debugInfo };
      }

      debugInfo.rawPostCount = ambassadorPosts?.length || 0;
      const posts = this.formatPosts(ambassadorPosts || [], true);
      debugInfo.formattedPostCount = posts.length;

      console.log('✅ Ambassador content query complete:', {
        ambassadors: debugInfo.totalAmbassadors,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount
      });

      return { posts, debugInfo };

    } catch (error) {
      console.error('Error in queryAllAmbassadorContent:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static async queryPersonalizedContent(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<{ posts: Post[], debugInfo: any }> {
    const debugInfo: any = {
      followingCount: userFollowings.length,
      queryUsers: [userId, ...userFollowings]
    };

    try {
      console.log('🔍 Querying personalized content from followed users');
      
      const query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends'])
        .order('created_at', { ascending: false })
        .range(offset, offset + this.POSTS_PER_PAGE - 1);

      const { data, error } = await this.executeWithTimeout(Promise.resolve(query));

      if (error) {
        console.error('Error in personalized content query:', error);
        debugInfo.error = error.message;
        return { posts: [], debugInfo };
      }

      debugInfo.rawPostCount = data?.length || 0;
      const posts = this.formatPosts(data || []);
      debugInfo.formattedPostCount = posts.length;

      console.log('✅ Personalized content query complete:', {
        followingCount: debugInfo.followingCount,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount
      });

      return { posts, debugInfo };

    } catch (error) {
      console.error('Error in queryPersonalizedContent:', error);
      debugInfo.error = error.message;
      return { posts: [], debugInfo };
    }
  }

  private static async getEmergencyFallbackContent(): Promise<Post[]> {
    console.log('🚨 Using emergency fallback content');
    
    try {
      // Get ANY public posts as emergency fallback
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Emergency fallback failed:', error);
        return [];
      }

      const posts = this.formatPosts(data || []);
      console.log('🚨 Emergency fallback content loaded:', posts.length);
      return posts;

    } catch (error) {
      console.error('Emergency fallback error:', error);
      return [];
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
      .range(offset, offset + 10 - 1);

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
}
