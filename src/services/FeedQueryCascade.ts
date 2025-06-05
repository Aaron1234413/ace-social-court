import { Post } from "@/types/post";
import { supabase } from "@/integrations/supabase/client";
import { createSmartFeedMix } from "@/utils/smartFeedMixing";

export type FeedFilter = 'all' | 'following' | 'discover';

interface CascadeResult {
  posts: Post[];
  level: string;
  source: string;
  postCount: number;
  queryTime: number;
  errorCount: number;
  errorDetails?: string[];
  ambassadorPercentage: number;
  debugData?: any;
  metrics?: any[];
  hasErrors?: boolean;
}

export class FeedQueryCascade {
  private static readonly PAGE_SIZE = 15;
  private static readonly MAX_AMBASSADOR_PAGE = 3;

  /**
   * Executes the cascade of queries to build the feed
   */
  static async executeQueryCascade(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    existingPosts: Post[] = [],
    filter: FeedFilter = 'all'
  ): Promise<CascadeResult> {
    console.log('🚀 Executing Query Cascade', {
      userId,
      followingCount: followingUserIds.length,
      page,
      existingPosts: existingPosts.length,
      filter
    });

    switch (filter) {
      case 'following':
        return this.executeFollowingQuery(userId, followingUserIds, page, existingPosts);
      case 'discover':
        return this.executeDiscoverQuery(userId, followingUserIds, page, existingPosts);
      case 'all':
      default:
        return this.executeAllQuery(userId, followingUserIds, page, existingPosts);
    }
  }

  /**
   * Executes the 'all' query, combining followed, ambassador, and public content
   */
  static async executeAllQuery(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🌎 Executing ALL query', {
      userId,
      followingCount: followingUserIds.length,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      // Get all posts with a simpler query approach
      const { data: allPostsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + (pageSize * 3) - 1); // Get more posts to ensure good mix

      if (postsError) {
        console.error('❌ Posts query error:', postsError);
        return this.createErrorResult('all', postsError.message, startTime);
      }

      const formattedPosts = this.formatPosts(allPostsData || []);
      console.log('📊 Raw posts retrieved:', formattedPosts.length);

      const queryTime = performance.now() - startTime;

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ ALL query complete:', {
        rawPosts: formattedPosts.length,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: smartMix.length > 0 ? Math.round((ambassadorCount / smartMix.length) * 100) + '%' : '0%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'all',
        source: 'mixed_content',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: smartMix.length > 0 ? ambassadorCount / smartMix.length : 0,
        debugData: {
          primaryQuery: {
            rawPostCount: formattedPosts.length,
            formattedPostCount: formattedPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(formattedPosts)
          }
        },
        metrics: [],
        hasErrors: false
      };

    } catch (error) {
      console.error('💥 ALL query failed:', error);
      return this.createErrorResult('all', error.message, startTime);
    }
  }

  /**
   * Enhanced following query with more lenient ambassador mixing
   */
  static async executeFollowingQuery(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('👥 ENHANCED Following query - LENIENT ambassador mixing', {
      userId,
      followingCount: followingUserIds.length,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      if (followingUserIds.length === 0) {
        console.log('⚠️ No followed users, falling back to ambassador content');
        return await this.executeAmbassadorQuery(userId, [], page, existingPosts);
      }

      // Get posts from followed users with some ambassador content mixed in
      const { data: followedPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Following query error:', error);
        return this.createErrorResult('following', error.message, startTime);
      }

      const allPosts = this.formatPosts(followedPosts || []);
      
      // Filter for followed users but keep some ambassador content
      const filteredPosts = allPosts.filter(post => 
        followingUserIds.includes(post.user_id) || 
        post.author?.user_type === 'ambassador' || 
        post.is_ambassador_content
      );

      const queryTime = performance.now() - startTime;

      // Enhanced smart mixing with more followed user content
      const smartMix = createSmartFeedMix(filteredPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ LENIENT Following query complete:', {
        rawPosts: allPosts.length,
        filteredPosts: filteredPosts.length,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: smartMix.length > 0 ? Math.round((ambassadorCount / smartMix.length) * 100) + '%' : '0%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'following',
        source: 'followed_users_plus_ambassadors',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: smartMix.length > 0 ? ambassadorCount / smartMix.length : 0,
        debugData: {
          followedUsers: {
            totalFollowing: followingUserIds.length,
            totalPosts: filteredPosts.length,
            followedUsers: this.analyzeFollowedUsers(filteredPosts, followingUserIds)
          }
        },
        metrics: [],
        hasErrors: false
      };

    } catch (error) {
      console.error('💥 Following query failed:', error);
      return this.createErrorResult('following', error.message, startTime);
    }
  }

  /**
   * Executes the 'discover' query, prioritizing public content and ambassador content
   */
  static async executeDiscoverQuery(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🧭 Executing DISCOVER query', {
      userId,
      followingCount: followingUserIds.length,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      // Get public posts excluding followed users
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Exclude followed users if there are any
      if (followingUserIds.length > 0) {
        query = query.not('user_id', 'in', `(${followingUserIds.join(',')})`);
      }

      const { data: publicPosts, error: publicError } = await query;

      if (publicError) {
        console.error('❌ Discover query error:', publicError);
        return this.createErrorResult('discover', publicError.message, startTime);
      }

      const formattedPosts = this.formatPosts(publicPosts || []);
      const queryTime = performance.now() - startTime;

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ DISCOVER query complete:', {
        rawPosts: formattedPosts.length,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: smartMix.length > 0 ? Math.round((ambassadorCount / smartMix.length) * 100) + '%' : '0%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'discover',
        source: 'public_content',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: smartMix.length > 0 ? ambassadorCount / smartMix.length : 0,
        debugData: {
          primaryQuery: {
            rawPostCount: formattedPosts.length,
            formattedPostCount: formattedPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(formattedPosts)
          }
        },
        metrics: [],
        hasErrors: false
      };

    } catch (error) {
      console.error('💥 DISCOVER query failed:', error);
      return this.createErrorResult('discover', error.message, startTime);
    }
  }

  /**
   * Executes the ambassador-only query (used as fallback)
   */
  static async executeAmbassadorQuery(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('👑 Executing AMBASSADOR query (fallback)', {
      userId,
      followingCount: followingUserIds.length,
      page
    });

    const startTime = performance.now();
    const pageSize = 15;
    const offset = page * pageSize;

    try {
      const { data: ambassadorPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .or('is_ambassador_content.eq.true,profiles.user_type.eq.ambassador')
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Ambassador query error:', error);
        return this.createErrorResult('ambassador', error.message, startTime);
      }

      const formattedPosts = this.formatPosts(ambassadorPosts || []);
      const queryTime = performance.now() - startTime;

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ AMBASSADOR query complete:', {
        rawPosts: formattedPosts.length,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: smartMix.length > 0 ? Math.round((ambassadorCount / smartMix.length) * 100) + '%' : '0%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'ambassador',
        source: 'ambassador_content',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: smartMix.length > 0 ? ambassadorCount / smartMix.length : 0,
        debugData: {
          primaryQuery: {
            rawPostCount: formattedPosts.length,
            formattedPostCount: formattedPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(formattedPosts)
          }
        },
        metrics: [],
        hasErrors: false
      };

    } catch (error) {
      console.error('💥 AMBASSADOR query failed:', error);
      return this.createErrorResult('ambassador', error.message, startTime);
    }
  }

  private static formatPosts(posts: any[]): Post[] {
    return posts.map(post => ({
      ...post,
      created_at: new Date(post.created_at).toISOString(),
    }));
  }

  private static createErrorResult(level: string, errorMessage: string, startTime: number): CascadeResult {
    const queryTime = performance.now() - startTime;
    return {
      posts: [],
      level: level,
      source: 'error',
      postCount: 0,
      queryTime,
      errorCount: 1,
      errorDetails: [errorMessage],
      ambassadorPercentage: 0,
      debugData: {
        errorMessage: errorMessage
      },
      metrics: [],
      hasErrors: true
    };
  }

  private static analyzeFollowedUsers(posts: Post[], followingUserIds: string[]): any {
    const userStats: any = {};

    followingUserIds.forEach(userId => {
      userStats[userId] = {
        totalPosts: 0,
        latestPost: null
      };
    });

    posts.forEach(post => {
      if (followingUserIds.includes(post.user_id)) {
        userStats[post.user_id].totalPosts++;
        if (!userStats[post.user_id].latestPost || new Date(post.created_at) > new Date(userStats[post.user_id].latestPost)) {
          userStats[post.user_id].latestPost = post.created_at;
        }
      }
    });

    const followedUsers = followingUserIds.map(userId => ({
      userId: userId,
      totalPosts: userStats[userId].totalPosts,
      latestPost: userStats[userId].latestPost,
      profile: posts.find(p => p.user_id === userId)?.author
    }));

    return {
      totalFollowing: followingUserIds.length,
      totalPosts: posts.length,
      followedUsers: followedUsers
    };
  }

  private static analyzePostsByUser(posts: Post[]): Record<string, any> {
    const postsByUser: Record<string, any> = {};

    posts.forEach(post => {
      if (!postsByUser[post.user_id]) {
        postsByUser[post.user_id] = {
          count: 0,
          privacyLevels: {}
        };
      }
      postsByUser[post.user_id].count++;
      postsByUser[post.user_id].privacyLevels[post.privacy_level] = true;
    });

    return postsByUser;
  }
}
