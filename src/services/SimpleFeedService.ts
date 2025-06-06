import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types/post';

interface FeedComposition {
  ambassadorPosts: Post[];
  followedUserPosts: Post[];
  publicPosts: Post[];
  totalPosts: Post[];
}

interface FeedMetrics {
  ambassadorPercentage: number;
  followedUserPercentage: number;
  publicPercentage: number;
  totalPosts: number;
  loadTime: number;
}

// Helper function to transform database privacy levels to our simplified type
const normalizePrivacyLevel = (dbPrivacyLevel: string): 'private' | 'public' | 'public_highlights' => {
  switch (dbPrivacyLevel) {
    case 'public':
      return 'public';
    case 'public_highlights':
      return 'public_highlights';
    case 'private':
    case 'friends':
    case 'coaches':
    default:
      return 'private';
  }
};

export class SimpleFeedService {
  private static instance: SimpleFeedService;

  static getInstance(): SimpleFeedService {
    if (!this.instance) {
      this.instance = new SimpleFeedService();
    }
    return this.instance;
  }

  async generateFeed(
    userId: string,
    followingUserIds: string[],
    page: number = 0,
    pageSize: number = 8
  ): Promise<{ posts: Post[]; metrics: FeedMetrics; hasMore: boolean }> {
    console.log('🎯 SimpleFeedService: Generating feed', {
      userId,
      followingCount: followingUserIds.length,
      page,
      pageSize
    });

    const startTime = performance.now();
    const offset = page * pageSize;

    // Calculate target counts with guaranteed ambassador slots
    const guaranteedAmbassadorCount = Math.max(2, Math.ceil(pageSize * 0.35)); // At least 2 ambassador posts
    const targetFollowedCount = Math.ceil(pageSize * 0.50); // 50%
    const targetPublicCount = pageSize - guaranteedAmbassadorCount - targetFollowedCount;

    console.log('📊 Target distribution (with guaranteed ambassador slots):', {
      ambassador: guaranteedAmbassadorCount,
      followed: targetFollowedCount,
      public: targetPublicCount
    });

    try {
      // Fetch all post types in parallel
      const [ambassadorPosts, followedUserPosts, publicPosts] = await Promise.all([
        this.fetchAmbassadorPosts(guaranteedAmbassadorCount, offset),
        this.fetchFollowedUserPosts(followingUserIds, targetFollowedCount, offset),
        this.fetchPublicPosts(userId, followingUserIds, targetPublicCount, offset)
      ]);

      // Enhanced mixing that preserves ambassador post positions
      const combinedPosts = this.mixPostsWithAmbassadorPriority({
        ambassadorPosts,
        followedUserPosts,
        publicPosts,
        totalPosts: []
      });

      // Fetch author profiles for all posts (including AI users)
      await this.enrichWithAuthorProfiles(combinedPosts);

      // Fetch engagement counts
      await this.enrichWithEngagement(combinedPosts);

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      const metrics: FeedMetrics = {
        ambassadorPercentage: ambassadorPosts.length / combinedPosts.length,
        followedUserPercentage: followedUserPosts.length / combinedPosts.length,
        publicPercentage: publicPosts.length / combinedPosts.length,
        totalPosts: combinedPosts.length,
        loadTime
      };

      console.log('✅ SimpleFeedService: Feed generated with ambassador priority', {
        actualCounts: {
          ambassador: ambassadorPosts.length,
          followed: followedUserPosts.length,
          public: publicPosts.length,
          total: combinedPosts.length
        },
        loadTime: Math.round(loadTime) + 'ms'
      });

      return {
        posts: combinedPosts,
        metrics,
        hasMore: combinedPosts.length >= pageSize && page < 5 // Limit to 5 pages
      };

    } catch (error) {
      console.error('❌ SimpleFeedService: Error generating feed:', error);
      throw error;
    }
  }

  private async fetchAmbassadorPosts(count: number, offset: number): Promise<Post[]> {
    console.log('👑 Fetching ambassador posts (including AI users):', { count, offset });

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .or('is_ambassador_content.eq.true,user_id.in.(select id from profiles where is_ai_user = true)')
      .in('privacy_level', ['public', 'public_highlights'])
      .order('created_at', { ascending: false })
      .range(offset, offset + count - 1);

    if (error) {
      console.error('❌ Error fetching ambassador posts:', error);
      return [];
    }

    const posts = (data || []).map(post => ({
      ...post,
      privacy_level: normalizePrivacyLevel(post.privacy_level),
      author: null // Will be enriched later
    })) as Post[];

    console.log('✅ Ambassador posts fetched:', posts.length);
    return posts;
  }

  private async fetchFollowedUserPosts(
    followingUserIds: string[],
    count: number,
    offset: number
  ): Promise<Post[]> {
    console.log('👥 Fetching followed user posts:', {
      followingCount: followingUserIds.length,
      count,
      offset
    });

    if (followingUserIds.length === 0) {
      console.log('ℹ️ No followed users, skipping followed posts');
      return [];
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', followingUserIds)
      .in('privacy_level', ['public', 'private', 'friends', 'coaches'])
      .order('created_at', { ascending: false })
      .range(offset, offset + count - 1);

    if (error) {
      console.error('❌ Error fetching followed user posts:', error);
      return [];
    }

    const posts = (data || []).map(post => ({
      ...post,
      privacy_level: normalizePrivacyLevel(post.privacy_level),
      author: null // Will be enriched later
    })) as Post[];

    console.log('✅ Followed user posts fetched:', posts.length);
    return posts;
  }

  private async fetchPublicPosts(
    userId: string,
    followingUserIds: string[],
    count: number,
    offset: number
  ): Promise<Post[]> {
    console.log('🌐 Fetching public posts:', { count, offset });

    // Get posts from users not followed and not ambassador content
    const excludeUserIds = [...followingUserIds, userId];

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('privacy_level', 'public')
      .eq('is_ambassador_content', false)
      .not('user_id', 'in', `(${excludeUserIds.join(',')})`)
      .order('engagement_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + count - 1);

    if (error) {
      console.error('❌ Error fetching public posts:', error);
      return [];
    }

    const posts = (data || []).map(post => ({
      ...post,
      privacy_level: normalizePrivacyLevel(post.privacy_level),
      author: null // Will be enriched later
    })) as Post[];

    console.log('✅ Public posts fetched:', posts.length);
    return posts;
  }

  private mixPostsWithAmbassadorPriority(composition: FeedComposition): Post[] {
    console.log('🔀 Mixing posts with ambassador priority preservation');

    const { ambassadorPosts, followedUserPosts, publicPosts } = composition;
    const mixed: Post[] = [];
    
    // Mark ambassador posts with priority to prevent displacement
    ambassadorPosts.forEach(post => {
      post.ambassador_priority = true;
    });

    // Strategy: Interleave posts but ensure ambassador posts get prime positions
    const allOtherPosts = [...followedUserPosts, ...publicPosts];
    let ambassadorIndex = 0;
    let otherIndex = 0;

    // Place posts in a pattern that ensures ambassador visibility
    while (ambassadorIndex < ambassadorPosts.length || otherIndex < allOtherPosts.length) {
      // Every 3rd position gets an ambassador post if available
      if (mixed.length % 3 === 0 && ambassadorIndex < ambassadorPosts.length) {
        mixed.push(ambassadorPosts[ambassadorIndex]);
        ambassadorIndex++;
      }
      // Fill other positions with followed/public posts
      else if (otherIndex < allOtherPosts.length) {
        mixed.push(allOtherPosts[otherIndex]);
        otherIndex++;
      }
      // If no other posts left, add remaining ambassador posts
      else if (ambassadorIndex < ambassadorPosts.length) {
        mixed.push(ambassadorPosts[ambassadorIndex]);
        ambassadorIndex++;
      }
    }

    console.log('✅ Posts mixed with ambassador priority:', {
      total: mixed.length,
      ambassadorPositions: mixed.map((post, index) => 
        post.ambassador_priority ? index : null
      ).filter(pos => pos !== null)
    });
    
    return mixed;
  }

  private async enrichWithAuthorProfiles(posts: Post[]): Promise<void> {
    const userIds = [...new Set(posts.map(post => post.user_id))];
    
    if (userIds.length === 0) return;

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, avatar_url, is_ai_user, ai_personality_type')
        .in('id', userIds);

      if (error) {
        console.error('❌ Error fetching author profiles:', error);
        return;
      }

      const profileMap = new Map();
      (profiles || []).forEach(profile => {
        profileMap.set(profile.id, {
          full_name: profile.full_name,
          user_type: profile.user_type,
          avatar_url: profile.avatar_url,
          is_ai_user: profile.is_ai_user || false,
          ai_personality_type: profile.ai_personality_type
        });
      });

      posts.forEach(post => {
        post.author = profileMap.get(post.user_id) || null;
      });

      console.log('✅ Author profiles enriched (including AI users)');
    } catch (error) {
      console.error('❌ Failed to enrich author profiles:', error);
    }
  }

  private async enrichWithEngagement(posts: Post[]): Promise<void> {
    try {
      const engagementPromises = posts.map(async (post) => {
        try {
          const [{ data: likesData }, { data: commentsData }] = await Promise.all([
            supabase.rpc('get_likes_count', { post_id: post.id }),
            supabase.rpc('get_comments_count', { post_id: post.id })
          ]);
          
          post.likes_count = likesData || 0;
          post.comments_count = commentsData || 0;
        } catch (error) {
          console.warn('Failed to get engagement for post:', post.id);
          post.likes_count = 0;
          post.comments_count = 0;
        }
      });

      await Promise.all(engagementPromises);
      console.log('✅ Engagement data enriched');
    } catch (error) {
      console.error('❌ Failed to enrich engagement data:', error);
    }
  }
}
