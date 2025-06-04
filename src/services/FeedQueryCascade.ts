import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';

interface CascadeMetrics {
  level: 'primary' | 'fallback1' | 'fallback2' | 'fallback3';
  postCount: number;
  queryTime: number;
  source: string;
  cacheHit?: boolean;
  errorCount?: number;
}

interface CascadeResult {
  posts: Post[];
  metrics: CascadeMetrics[];
  totalPosts: number;
  ambassadorPercentage: number;
  totalQueryTime: number;
  cacheHitRate: number;
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

    try {
      // Level 1: Primary personalized feed
      const primaryStart = performance.now();
      const primaryPosts = await this.queryPersonalizedFeed(userId, userFollowings, offset);
      totalQueries++;
      
      metrics.push({
        level: 'primary',
        postCount: primaryPosts.length,
        queryTime: performance.now() - primaryStart,
        source: 'personalized',
        cacheHit: false,
        errorCount: 0
      });
      
      allPosts.push(...primaryPosts);
      console.log('📊 Primary query complete', { count: primaryPosts.length, time: Math.round(performance.now() - primaryStart) + 'ms' });

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

      // Level 4: Fallback 3 - Ambassador content
      if (allPosts.length < this.MIN_POSTS) {
        const fallback3Start = performance.now();
        const ambassadorContent = await this.queryAmbassadorContent(offset);
        const maxAmbassadorPosts = Math.floor(allPosts.length * this.MAX_AMBASSADOR_PERCENTAGE);
        const limitedAmbassadorPosts = ambassadorContent.slice(0, Math.max(1, maxAmbassadorPosts));
        totalQueries++;
        
        metrics.push({
          level: 'fallback3',
          postCount: limitedAmbassadorPosts.length,
          queryTime: performance.now() - fallback3Start,
          source: 'ambassadors',
          cacheHit: false,
          errorCount: 0
        });
        
        allPosts.push(...limitedAmbassadorPosts);
        console.log('📊 Fallback 3 complete', { count: limitedAmbassadorPosts.length, time: Math.round(performance.now() - fallback3Start) + 'ms' });
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

      console.log('✅ Query cascade complete', {
        totalPosts: finalPosts.length,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(totalQueryTime) + 'ms',
        levels: metrics.length,
        cacheHitRate: Math.round(cacheHitRate * 100) + '%'
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
        cacheHitRate
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
        cacheHitRate: 0
      };
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

  private static async queryPersonalizedFeed(
    userId: string, 
    userFollowings: string[], 
    offset: number
  ): Promise<Post[]> {
    if (userFollowings.length === 0) return [];

    const { data, error } = await this.executeWithTimeout(
      supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score
        `)
        .in('user_id', [userId, ...userFollowings])
        .in('privacy_level', ['public', 'friends', 'public_highlights'])
        .order('created_at', { ascending: false })
        .range(offset, offset + this.POSTS_PER_PAGE - 1)
        .then(res => res)
    );

    if (error) {
      console.error('Error in personalized feed query:', error);
      return [];
    }

    return this.formatPosts(data || []);
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

  private static async queryAmbassadorContent(offset: number): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, user_id, media_url, media_type,
        privacy_level, template_id, is_auto_generated, engagement_score,
        is_ambassador_content
      `)
      .eq('is_ambassador_content', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + this.POSTS_PER_PAGE - 1);

    if (error) {
      console.error('Error in ambassador content query:', error);
      return [];
    }

    return this.formatPosts(data || [], true);
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
