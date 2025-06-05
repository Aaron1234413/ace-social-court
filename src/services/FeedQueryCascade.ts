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
    const pageSize = 15;
    const offset = page * pageSize;

    try {
      // 1. Get posts from followed users
      const { data: followedPosts, error: followedError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .in('user_id', followingUserIds)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (followedError) {
        console.error('❌ Followed query error:', followedError);
      }

      // 2. Get ambassador content (ensure diversity)
      const { data: ambassadorPosts, error: ambassadorError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('is_ambassador_content', true)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (ambassadorError) {
        console.error('❌ Ambassador query error:', ambassadorError);
      }

      // 3. Get public posts (excluding followed users and ambassadors)
      const { data: publicPosts, error: publicError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .not('user_id', 'in', followingUserIds.length > 0 ? `(${followingUserIds.join(',')})` : '()')
        .eq('is_ambassador_content', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (publicError) {
        console.error('❌ Public query error:', publicError);
      }

      // Format and combine posts
      const formattedFollowedPosts = this.formatPosts(followedPosts || []);
      const formattedAmbassadorPosts = this.formatPosts(ambassadorPosts || []);
      const formattedPublicPosts = this.formatPosts(publicPosts || []);

      const allPosts = [
        ...formattedFollowedPosts,
        ...formattedAmbassadorPosts,
        ...formattedPublicPosts
      ];

      const queryTime = performance.now() - startTime;

      // Apply smart mixing
      const smartMix = createSmartFeedMix([...existingPosts, ...allPosts], {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ ALL query complete:', {
        rawFollowed: followedPosts?.length || 0,
        rawAmbassador: ambassadorPosts?.length || 0,
        rawPublic: publicPosts?.length || 0,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: Math.round((ambassadorCount / smartMix.length) * 100) + '%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'all',
        source: 'followed_ambassador_public',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: ambassadorCount / smartMix.length,
        debugData: {
          followedUsers: {
            totalFollowing: followingUserIds.length,
            totalPosts: formattedFollowedPosts.length,
            followedUsers: this.analyzeFollowedUsers(formattedFollowedPosts, followingUserIds)
          },
          primaryQuery: {
            rawPostCount: (followedPosts?.length || 0) + (ambassadorPosts?.length || 0) + (publicPosts?.length || 0),
            formattedPostCount: allPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(allPosts)
          }
        }
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

      // More lenient approach: Get posts from followed users AND some quality ambassadors
      const { data: followedPosts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .or(`user_id.in.(${followingUserIds.join(',')}),and(is_ambassador_content.eq.true,privacy_level.eq.public)`)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('❌ Following query error:', error);
        return this.createErrorResult('following', error.message, startTime);
      }

      const formattedPosts = this.formatPosts(followedPosts || []);
      const queryTime = performance.now() - startTime;

      // Enhanced smart mixing with more followed user content
      const smartMix = createSmartFeedMix([...existingPosts, ...formattedPosts], {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ LENIENT Following query complete:', {
        rawPosts: followedPosts?.length || 0,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: Math.round((ambassadorCount / smartMix.length) * 100) + '%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'following',
        source: 'followed_users_plus_ambassadors',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: ambassadorCount / smartMix.length,
        debugData: {
          followedUsers: {
            totalFollowing: followingUserIds.length,
            totalPosts: formattedPosts.length,
            followedUsers: this.analyzeFollowedUsers(formattedPosts, followingUserIds)
          }
        }
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
    const pageSize = 15;
    const offset = page * pageSize;

    try {
      // 1. Get public posts (excluding followed users)
      const { data: publicPosts, error: publicError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('privacy_level', 'public')
        .not('user_id', 'in', followingUserIds.length > 0 ? `(${followingUserIds.join(',')})` : '()')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (publicError) {
        console.error('❌ Public query error:', publicError);
      }

      // 2. Get ambassador content (ensure quality)
      const { data: ambassadorPosts, error: ambassadorError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id, full_name, user_type, avatar_url
          )
        `)
        .eq('is_ambassador_content', true)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (ambassadorError) {
        console.error('❌ Ambassador query error:', ambassadorError);
      }

      // Format and combine posts
      const formattedPublicPosts = this.formatPosts(publicPosts || []);
      const formattedAmbassadorPosts = this.formatPosts(ambassadorPosts || []);

      const allPosts = [...formattedPublicPosts, ...formattedAmbassadorPosts];

      const queryTime = performance.now() - startTime;

      // Apply smart mixing
      const smartMix = createSmartFeedMix([...existingPosts, ...allPosts], {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ DISCOVER query complete:', {
        rawPublic: publicPosts?.length || 0,
        rawAmbassador: ambassadorPosts?.length || 0,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: Math.round((ambassadorCount / smartMix.length) * 100) + '%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'discover',
        source: 'public_plus_ambassadors',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: ambassadorCount / smartMix.length,
        debugData: {
          primaryQuery: {
            rawPostCount: (publicPosts?.length || 0) + (ambassadorPosts?.length || 0),
            formattedPostCount: allPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(allPosts)
          }
        }
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
        .eq('is_ambassador_content', true)
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
      const smartMix = createSmartFeedMix([...existingPosts, ...formattedPosts], {
        followingCount: followingUserIds.length,
        userFollowings: followingUserIds,
        currentUserId: userId
      });

      const ambassadorCount = smartMix.filter(post =>
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;

      console.log('✅ AMBASSADOR query complete:', {
        rawPosts: ambassadorPosts?.length || 0,
        finalPosts: smartMix.length,
        ambassadorCount,
        ambassadorPercentage: Math.round((ambassadorCount / smartMix.length) * 100) + '%',
        queryTime: Math.round(queryTime) + 'ms'
      });

      return {
        posts: smartMix,
        level: 'ambassador',
        source: 'ambassador_content',
        postCount: smartMix.length,
        queryTime,
        errorCount: 0,
        ambassadorPercentage: ambassadorCount / smartMix.length,
        debugData: {
          primaryQuery: {
            rawPostCount: ambassadorPosts?.length || 0,
            formattedPostCount: formattedPosts.length,
            followingCount: followingUserIds.length,
            postsByUser: this.analyzePostsByUser(formattedPosts)
          }
        }
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
      }
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
