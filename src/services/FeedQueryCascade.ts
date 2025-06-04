
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';

interface CascadeMetrics {
  level: 'primary' | 'fallback1' | 'fallback2' | 'fallback3';
  postCount: number;
  queryTime: number;
  source: string;
}

interface CascadeResult {
  posts: Post[];
  metrics: CascadeMetrics[];
  totalPosts: number;
  ambassadorPercentage: number;
}

export class FeedQueryCascade {
  private static readonly MIN_POSTS = 8;
  private static readonly MAX_AMBASSADOR_PERCENTAGE = 0.3;
  private static readonly POSTS_PER_PAGE = 10;

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

    try {
      // Level 1: Primary personalized feed
      const primaryPosts = await this.queryPersonalizedFeed(userId, userFollowings, offset);
      metrics.push({
        level: 'primary',
        postCount: primaryPosts.length,
        queryTime: performance.now() - startTime,
        source: 'personalized'
      });
      
      allPosts.push(...primaryPosts);
      console.log('📊 Primary query complete', { count: primaryPosts.length });

      // Level 2: Fallback 1 - Public highlights from network
      if (allPosts.length < 3) {
        const networkHighlights = await this.queryNetworkHighlights(userFollowings, offset);
        metrics.push({
          level: 'fallback1',
          postCount: networkHighlights.length,
          queryTime: performance.now() - startTime,
          source: 'network_highlights'
        });
        
        allPosts.push(...networkHighlights);
        console.log('📊 Fallback 1 complete', { count: networkHighlights.length });
      }

      // Level 3: Fallback 2 - Any public highlights
      if (allPosts.length < 5) {
        const publicHighlights = await this.queryPublicHighlights(offset);
        metrics.push({
          level: 'fallback2',
          postCount: publicHighlights.length,
          queryTime: performance.now() - startTime,
          source: 'public_highlights'
        });
        
        allPosts.push(...publicHighlights);
        console.log('📊 Fallback 2 complete', { count: publicHighlights.length });
      }

      // Level 4: Fallback 3 - Ambassador content
      if (allPosts.length < this.MIN_POSTS) {
        const ambassadorContent = await this.queryAmbassadorContent(offset);
        const maxAmbassadorPosts = Math.floor(allPosts.length * this.MAX_AMBASSADOR_PERCENTAGE);
        const limitedAmbassadorPosts = ambassadorContent.slice(0, Math.max(1, maxAmbassadorPosts));
        
        metrics.push({
          level: 'fallback3',
          postCount: limitedAmbassadorPosts.length,
          queryTime: performance.now() - startTime,
          source: 'ambassadors'
        });
        
        allPosts.push(...limitedAmbassadorPosts);
        console.log('📊 Fallback 3 complete', { count: limitedAmbassadorPosts.length });
      }

      // Remove duplicates and enforce ambassador percentage
      const uniquePosts = this.removeDuplicates(allPosts);
      const finalPosts = this.enforceAmbassadorLimit(uniquePosts);

      const ambassadorCount = finalPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const ambassadorPercentage = finalPosts.length > 0 
        ? ambassadorCount / finalPosts.length 
        : 0;

      console.log('✅ Query cascade complete', {
        totalPosts: finalPosts.length,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        totalTime: Math.round(performance.now() - startTime) + 'ms',
        levels: metrics.length
      });

      return {
        posts: finalPosts,
        metrics,
        totalPosts: finalPosts.length,
        ambassadorPercentage
      };

    } catch (error) {
      console.error('❌ Query cascade failed:', error);
      return {
        posts: existingPosts,
        metrics,
        totalPosts: existingPosts.length,
        ambassadorPercentage: 0
      };
    }
  }

  private static async queryPersonalizedFeed(
    userId: string, 
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
      .in('user_id', [userId, ...userFollowings])
      .in('privacy_level', ['public', 'friends', 'public_highlights'])
      .order('created_at', { ascending: false })
      .range(offset, offset + this.POSTS_PER_PAGE - 1);

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
