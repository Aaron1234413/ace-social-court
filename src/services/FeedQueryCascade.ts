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
    console.log('🚀 [DEBUG] Executing Query Cascade START', {
      userId,
      followingCount: followingUserIds.length,
      followingUserIds,
      page,
      existingPosts: existingPosts.length,
      filter,
      timestamp: new Date().toISOString()
    });

    try {
      let result: CascadeResult;

      switch (filter) {
        case 'following':
          console.log('🎯 [DEBUG] Executing FOLLOWING filter');
          result = await this.executeFollowingQuery(userId, followingUserIds, page, existingPosts);
          break;
        case 'discover':
          console.log('🎯 [DEBUG] Executing DISCOVER filter');
          result = await this.executeDiscoverQuery(userId, followingUserIds, page, existingPosts);
          break;
        case 'all':
        default:
          console.log('🎯 [DEBUG] Executing ALL filter');
          result = await this.executeAllQuery(userId, followingUserIds, page, existingPosts);
          break;
      }

      console.log('✅ [DEBUG] Query Cascade COMPLETE', {
        filter,
        finalPostCount: result.posts.length,
        level: result.level,
        source: result.source,
        hasErrors: result.hasErrors,
        errorCount: result.errorCount,
        queryTime: result.queryTime
      });

      return result;
    } catch (error) {
      console.error('💥 [DEBUG] Query Cascade FAILED', {
        error: error.message,
        stack: error.stack,
        filter,
        userId,
        followingCount: followingUserIds.length
      });
      throw error;
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
    console.log('🌎 [DEBUG] ALL Query START', {
      userId,
      followingCount: followingUserIds.length,
      followingUserIds,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      console.log('📡 [DEBUG] Executing Supabase query for ALL posts', {
        pageSize,
        offset,
        rangeStart: offset,
        rangeEnd: offset + (pageSize * 3) - 1
      });

      // Fixed query - use simple profiles() syntax since FK exists
      const { data: allPostsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(
            id, 
            full_name, 
            user_type, 
            avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + (pageSize * 3) - 1);

      console.log('📊 [DEBUG] Supabase query result for ALL', {
        success: !postsError,
        error: postsError,
        dataLength: allPostsData?.length || 0,
        rawData: allPostsData?.slice(0, 2) // Show first 2 posts for debugging
      });

      if (postsError) {
        console.error('❌ [DEBUG] Posts query error:', postsError);
        return this.createErrorResult('all', postsError.message, startTime);
      }

      const formattedPosts = this.formatPosts(allPostsData || []);
      console.log('🔄 [DEBUG] Formatted posts', {
        originalCount: allPostsData?.length || 0,
        formattedCount: formattedPosts.length,
        sampleFormatted: formattedPosts.slice(0, 2)
      });

      const queryTime = performance.now() - startTime;

      console.log('🎯 [DEBUG] Calling smart mixing for ALL', {
        postsToMix: formattedPosts.length,
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      console.log('✨ [DEBUG] Smart mixing result for ALL', {
        inputPosts: formattedPosts.length,
        outputPosts: smartMix.length,
        sampleOutput: smartMix.slice(0, 2)
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ [DEBUG] ALL query COMPLETE', {
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
      console.error('💥 [DEBUG] ALL query FAILED', {
        error: error.message,
        stack: error.stack,
        userId,
        followingCount: followingUserIds.length
      });
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
    console.log('👥 [DEBUG] FOLLOWING Query START', {
      userId,
      followingCount: followingUserIds.length,
      followingUserIds,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      if (followingUserIds.length === 0) {
        console.log('⚠️ [DEBUG] No followed users, falling back to ambassador content');
        return await this.executeAmbassadorQuery(userId, [], page, existingPosts);
      }

      console.log('📡 [DEBUG] Executing Supabase query for FOLLOWING posts', {
        pageSize,
        offset,
        rangeStart: offset,
        rangeEnd: offset + pageSize - 1,
        followingUserIds
      });

      // Fixed query syntax
      const { data: followedPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(
            id, 
            full_name, 
            user_type, 
            avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      console.log('📊 [DEBUG] Supabase query result for FOLLOWING', {
        success: !error,
        error: error,
        dataLength: followedPosts?.length || 0,
        rawData: followedPosts?.slice(0, 2)
      });

      if (error) {
        console.error('❌ [DEBUG] Following query error:', error);
        return this.createErrorResult('following', error.message, startTime);
      }

      const allPosts = this.formatPosts(followedPosts || []);
      console.log('🔄 [DEBUG] Formatted following posts', {
        originalCount: followedPosts?.length || 0,
        formattedCount: allPosts.length
      });
      
      // Filter for followed users but keep some ambassador content
      const filteredPosts = allPosts.filter(post => {
        const isFromFollowed = followingUserIds.includes(post.user_id);
        const isAmbassador = post.author?.user_type === 'ambassador' || post.is_ambassador_content;
        const shouldInclude = isFromFollowed || isAmbassador;
        
        console.log('🔍 [DEBUG] Post filtering decision', {
          postId: post.id,
          userId: post.user_id,
          isFromFollowed,
          isAmbassador,
          shouldInclude,
          authorType: post.author?.user_type
        });
        
        return shouldInclude;
      });

      console.log('🎯 [DEBUG] Post filtering complete for FOLLOWING', {
        totalPosts: allPosts.length,
        filteredPosts: filteredPosts.length,
        followedUserPosts: filteredPosts.filter(p => followingUserIds.includes(p.user_id)).length,
        ambassadorPosts: filteredPosts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length
      });

      const queryTime = performance.now() - startTime;

      console.log('🎯 [DEBUG] Calling smart mixing for FOLLOWING', {
        postsToMix: filteredPosts.length,
        followingCount: followingUserIds.length
      });

      // Enhanced smart mixing with more followed user content
      const smartMix = createSmartFeedMix(filteredPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      console.log('✨ [DEBUG] Smart mixing result for FOLLOWING', {
        inputPosts: filteredPosts.length,
        outputPosts: smartMix.length
      });

      const ambassadorCount = smartMix.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ [DEBUG] FOLLOWING query COMPLETE', {
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
      console.error('💥 [DEBUG] Following query FAILED', {
        error: error.message,
        stack: error.stack,
        userId,
        followingCount: followingUserIds.length
      });
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
    console.log('🧭 [DEBUG] DISCOVER Query START', {
      userId,
      followingCount: followingUserIds.length,
      followingUserIds,
      page
    });

    const startTime = performance.now();
    const pageSize = 20;
    const offset = page * pageSize;

    try {
      console.log('📡 [DEBUG] Executing Supabase query for DISCOVER posts', {
        pageSize,
        offset,
        rangeStart: offset,
        rangeEnd: offset + pageSize - 1,
        excludingFollowedUsers: followingUserIds.length > 0
      });

      // Fixed query syntax
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles(
            id, 
            full_name, 
            user_type, 
            avatar_url
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

      console.log('📊 [DEBUG] Supabase query result for DISCOVER', {
        success: !publicError,
        error: publicError,
        dataLength: publicPosts?.length || 0,
        rawData: publicPosts?.slice(0, 2)
      });

      if (publicError) {
        console.error('❌ [DEBUG] Discover query error:', publicError);
        return this.createErrorResult('discover', publicError.message, startTime);
      }

      const formattedPosts = this.formatPosts(publicPosts || []);
      console.log('🔄 [DEBUG] Formatted discover posts', {
        originalCount: publicPosts?.length || 0,
        formattedCount: formattedPosts.length
      });

      const queryTime = performance.now() - startTime;

      console.log('🎯 [DEBUG] Calling smart mixing for DISCOVER', {
        postsToMix: formattedPosts.length,
        followingCount: followingUserIds.length
      });

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      console.log('✨ [DEBUG] Smart mixing result for DISCOVER', {
        inputPosts: formattedPosts.length,
        outputPosts: smartMix.length
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ [DEBUG] DISCOVER query COMPLETE', {
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
      console.error('💥 [DEBUG] DISCOVER query FAILED', {
        error: error.message,
        stack: error.stack,
        userId,
        followingCount: followingUserIds.length
      });
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
    console.log('👑 [DEBUG] AMBASSADOR Query START (fallback)', {
      userId,
      followingCount: followingUserIds.length,
      followingUserIds,
      page
    });

    const startTime = performance.now();
    const pageSize = 15;
    const offset = page * pageSize;

    try {
      console.log('📡 [DEBUG] Executing Supabase query for AMBASSADOR posts', {
        pageSize,
        offset,
        rangeStart: offset,
        rangeEnd: offset + pageSize - 1
      });

      // Fixed query syntax
      const { data: ambassadorPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(
            id, 
            full_name, 
            user_type, 
            avatar_url
          )
        `)
        .or('is_ambassador_content.eq.true,profiles.user_type.eq.ambassador')
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      console.log('📊 [DEBUG] Supabase query result for AMBASSADOR', {
        success: !error,
        error: error,
        dataLength: ambassadorPosts?.length || 0,
        rawData: ambassadorPosts?.slice(0, 2)
      });

      if (error) {
        console.error('❌ [DEBUG] Ambassador query error:', error);
        return this.createErrorResult('ambassador', error.message, startTime);
      }

      const formattedPosts = this.formatPosts(ambassadorPosts || []);
      console.log('🔄 [DEBUG] Formatted ambassador posts', {
        originalCount: ambassadorPosts?.length || 0,
        formattedCount: formattedPosts.length
      });

      const queryTime = performance.now() - startTime;

      console.log('🎯 [DEBUG] Calling smart mixing for AMBASSADOR', {
        postsToMix: formattedPosts.length,
        followingCount: followingUserIds.length
      });

      // Apply smart mixing
      const smartMix = createSmartFeedMix(formattedPosts, {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      console.log('✨ [DEBUG] Smart mixing result for AMBASSADOR', {
        inputPosts: formattedPosts.length,
        outputPosts: smartMix.length
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ [DEBUG] AMBASSADOR query COMPLETE', {
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
      console.error('💥 [DEBUG] AMBASSADOR query FAILED', {
        error: error.message,
        stack: error.stack,
        userId,
        followingCount: followingUserIds.length
      });
      return this.createErrorResult('ambassador', error.message, startTime);
    }
  }

  private static formatPosts(posts: any[]): Post[] {
    return posts.map(post => ({
      ...post,
      created_at: new Date(post.created_at).toISOString(),
      author: post.profiles || null
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
