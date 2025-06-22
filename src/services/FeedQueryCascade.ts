import { supabase } from '@/integrations/supabase/client';
import { Post } from "@/types/post";

interface CascadeMetrics {
  level: 'ambassador_priority' | 'primary' | 'fallback1' | 'fallback2';
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
  ambassadorMetrics?: {
    totalAmbassadorPosts: number;
    newAmbassadorPosts: number;
    rotatedOutPosts: number;
    guaranteedPercentage: number;
  };
}

export class FeedQueryCascade {
  private static readonly MIN_POSTS = 8;
  private static readonly AMBASSADOR_GUARANTEED_PERCENTAGE = 0.35; // Fixed 35%
  private static readonly MIN_AMBASSADOR_POSTS = 3;
  private static readonly POSTS_PER_PAGE = 12;
  private static readonly QUERY_TIMEOUT = 5000;

 static async executeQueryCascade(
  userId: string,
  followingUserIds: string[],
  page: number,
  existingPosts: Post[]
): Promise<{
  posts: Post[];
  metrics: any[];
  ambassadorPercentage: number;
  debugData?: any;
  hasErrors: boolean;
  errorDetails?: string[];
}> {
  const PAGE_SIZE = 30;
  const followedUserIdsWithSelf = [...followingUserIds, userId];


  try {
    const lastCreatedAt = existingPosts.length > 0
      ? existingPosts[existingPosts.length - 1].created_at
      : new Date().toISOString();

    // === 1. Fetch posts from followed users
    const { data: userPosts, error: userError } = await supabase
      .from('posts')
      .select('*')
      .in('user_id', followingUserIds)
      .lt('created_at', lastCreatedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (userError) {
      console.warn("❌ Error loading userPosts:", userError.message);
    }

    // === 2. Fetch ambassador posts
    const { data: ambassadorPosts, error: ambassadorError } = await supabase
      .from('posts')
      .select('*')
      .eq('is_ambassador_content', true)
      .lt('created_at', lastCreatedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (ambassadorError) {
      console.warn("❌ Error loading ambassadorPosts:", ambassadorError.message);
    }

    // === 3. Fetch current user's own posts
    const { data: selfPosts, error: selfError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .lt('created_at', lastCreatedAt)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (selfError) {
      console.warn("❌ Error loading selfPosts:", selfError.message);
    }

    const taggedSelfPosts = (selfPosts || []).map(p => ({ ...p, source: 'self' }));
    const taggedFollowedPosts = (userPosts || []).map(p => ({ ...p, source: 'followed' }));

    // === 3. Tag source type
    const taggedAmbassadorPosts = (ambassadorPosts || []).map(p => ({ ...p, source: 'ambassador' }));
    const taggedUserPosts = [...taggedSelfPosts, ...taggedFollowedPosts];

    // // === 4. Merge and sort
    // const combined = [...taggedUserPosts, ...taggedAmbassadorPosts]
    //   .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    //   .slice(0, PAGE_SIZE);

    // === 4. Merge with controlled ratio (3 user : 1 ambassador)
    const maxUserPosts = PAGE_SIZE;
    const maxAmbassadorPosts = Math.floor(PAGE_SIZE / 3);

    // Limit the number of posts taken from each
    const limitedUserPosts = taggedUserPosts.slice(0, maxUserPosts);
    const limitedAmbassadorPosts = taggedAmbassadorPosts.slice(0, maxAmbassadorPosts);

    // Interleave posts: 3 user posts followed by 1 ambassador post
    const combined: Post[] = [];
    let ui = 0;
    let ai = 0;

    while (
      combined.length < PAGE_SIZE &&
      (ui < limitedUserPosts.length || ai < limitedAmbassadorPosts.length)
    ) {
      // Add up to 3 user posts
      for (let i = 0; i < 3 && ui < limitedUserPosts.length && combined.length < PAGE_SIZE; i++) {
        combined.push(limitedUserPosts[ui++]);
      }

      // Add 1 ambassador post
      if (ai < limitedAmbassadorPosts.length && combined.length < PAGE_SIZE) {
        combined.push(limitedAmbassadorPosts[ai++]);
      }
    }

    // Optional: final sort by created_at if you still want recency order
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    
    return {
      posts: combined,
      metrics: [],
      ambassadorPercentage: taggedAmbassadorPosts.length / (combined.length || 1),
      debugData: {
        userPostCount: taggedUserPosts.length,
        ambassadorPostCount: taggedAmbassadorPosts.length,
      },
      hasErrors: false,
      errorDetails: [],
    };
  } catch (error) {
    return {
      posts: [],
      metrics: [],
      ambassadorPercentage: 0,
      hasErrors: true,
      errorDetails: [error.message],
      debugData: {},
    };
  }
}

  private static async queryAmbassadorContentPriority(): Promise<{ posts: Post[], errors: string[], debugInfo: any }> {
    const debugInfo: any = { 
      source: 'priority_ambassadors', 
      steps: [],
      guaranteedPercentage: this.AMBASSADOR_GUARANTEED_PERCENTAGE,
      rotationApplied: true
    };
    const errors: string[] = [];

    try {
      console.log('🔍 Priority ambassador query starting with rotation logic...');
      debugInfo.steps.push('Starting priority ambassador profile query');
      
      // Get ambassador profiles with priority ordering
      const { data: ambassadors, error: ambassadorsError } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, avatar_url')
        .eq('user_type', 'ambassador')
        .limit(25); // Get more ambassadors for better rotation

      if (ambassadorsError) {
        const errorMsg = `Priority ambassador profiles query failed: ${ambassadorsError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.ambassadorError = ambassadorsError.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.totalAmbassadors = ambassadors?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.totalAmbassadors} ambassadors for priority loading`);
      console.log('✅ Found ambassadors for priority loading:', debugInfo.totalAmbassadors);

      if (!ambassadors || ambassadors.length === 0) {
        const errorMsg = 'No ambassadors found for priority loading';
        console.warn('⚠️', errorMsg);
        errors.push(errorMsg);
        return { posts: [], errors, debugInfo };
      }

      const ambassadorIds = ambassadors.map(amb => amb.id);
      debugInfo.steps.push('Querying posts from ambassadors with rotation priority');

      // Get ambassador posts with rotation logic (newer posts first, varied authors)
      const { data: ambassadorPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, media_url, media_type,
          privacy_level, template_id, is_auto_generated, engagement_score,
          is_ambassador_content
        `)
        .in('user_id', ambassadorIds)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false }) // Newest first for rotation
        .limit(20); // Get more for better rotation options

      if (postsError) {
        const errorMsg = `Priority ambassador posts query failed: ${postsError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
        debugInfo.postsError = postsError.message;
        return { posts: [], errors, debugInfo };
      }

      debugInfo.rawPostCount = ambassadorPosts?.length || 0;
      debugInfo.steps.push(`Found ${debugInfo.rawPostCount} ambassador posts for rotation`);
      
      // Apply rotation logic - ensure variety in authors and content freshness
      const rotatedPosts = this.applyAmbassadorRotation(ambassadorPosts || [], ambassadors);
      debugInfo.rotatedPostCount = rotatedPosts.length;
      debugInfo.newPosts = rotatedPosts.filter(post => {
        const postAge = Date.now() - new Date(post.created_at).getTime();
        return postAge < 24 * 60 * 60 * 1000; // Less than 24 hours
      }).length;
      
      // Format posts with ambassador priority indicators
      const posts = this.formatPosts(rotatedPosts, ambassadors, true);
      debugInfo.formattedPostCount = posts.length;
      debugInfo.steps.push(`Formatted ${debugInfo.formattedPostCount} posts with priority indicators`);

      // console.log('✅ Priority ambassador content query complete:', {
      //   ambassadors: debugInfo.totalAmbassadors,
      //   rawPosts: debugInfo.rawPostCount,
      //   rotatedPosts: debugInfo.rotatedPostCount,
      //   formattedPosts: debugInfo.formattedPostCount,
      //   newPosts: debugInfo.newPosts,
      //   errors: errors.length
      // });

      return { posts, errors, debugInfo };

    } catch (error) {
      const errorMsg = `Unexpected priority ambassador query error: ${error.message}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      debugInfo.unexpectedError = error.message;
      return { posts: [], errors, debugInfo };
    }
  }

  private static applyAmbassadorRotation(posts: any[], ambassadors: any[]): any[] {
    // Group posts by author for fair rotation
    const postsByAuthor = new Map();
    posts.forEach(post => {
      if (!postsByAuthor.has(post.user_id)) {
        postsByAuthor.set(post.user_id, []);
      }
      postsByAuthor.get(post.user_id).push(post);
    });

    // Ensure we get variety - max 2 posts per ambassador initially
    const rotatedPosts: any[] = [];
    const maxPostsPerAuthor = 2;
    
    // First pass - get up to 2 posts per ambassador
    postsByAuthor.forEach((authorPosts, authorId) => {
      const sortedPosts = authorPosts.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      rotatedPosts.push(...sortedPosts.slice(0, maxPostsPerAuthor));
    });

    // Sort by engagement and recency for final selection
    return rotatedPosts
      .sort((a, b) => {
        const scoreA = (a.engagement_score || 0) + (new Date(a.created_at).getTime() / 1000000);
        const scoreB = (b.engagement_score || 0) + (new Date(b.created_at).getTime() / 1000000);
        return scoreB - scoreA;
      })
      .slice(0, 12); // Limit to reasonable number for rotation
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

      // console.log('✅ Personalized content query complete:', {
      //   followingCount: debugInfo.followingCount,
      //   rawPosts: debugInfo.rawPostCount,
      //   formattedPosts: debugInfo.formattedPostCount,
      //   errors: errors.length
      // });

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

  private static formatPosts(rawPosts: any[], ambassadorProfiles?: any[], isPriorityAmbassador: boolean = false): Post[] {
    return rawPosts.map(post => {
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
        comments_count: 0,
        // Add priority indicator for UI
        ambassador_priority: isPriorityAmbassador
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

  private static async smartMixContentWithAmbassadorPriority(posts: Post[], userFollowings: string[], currentUserId?: string): Promise<Post[]> {
    console.log('🎭 Applying smart content mixing with AMBASSADOR PRIORITY for balanced feed');
    
    try {
      const { createSmartFeedMix } = await import('@/utils/smartFeedMixing');
      
      const mixedPosts = createSmartFeedMix(posts, {
        followingCount: userFollowings.length,
        userFollowings,
        currentUserId
      });

      console.log('✅ Smart mixing with ambassador priority complete:', {
        originalCount: posts.length,
        mixedCount: mixedPosts.length,
        ambassadorCount: mixedPosts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length,
        ambassadorPercentage: Math.round((mixedPosts.filter(p => p.author?.user_type === 'ambassador' || p.is_ambassador_content).length / mixedPosts.length) * 100) + '%'
      });

      return mixedPosts;
    } catch (error) {
      console.error('❌ Smart mixing with ambassador priority failed:', error);
      return posts; // Return original posts if mixing fails
    }
  }

  private static createHardcodedFallbackContentWithAmbassadors(): Post[] {
    console.log('🚨 Creating hardcoded fallback content with AMBASSADOR PRIORITY');
    
    const fallbackPosts: Post[] = [
      {
        id: 'fallback-ambassador-1',
        content: "Welcome to Rally! 🎾 Start your tennis journey by connecting with players and coaches in your area. Every champion started somewhere!",
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
        comments_count: 5,
        ambassador_priority: true
      },
      {
        id: 'fallback-ambassador-2',
        content: "🏆 Pro tip from the courts: Consistency beats perfection every time! Focus on getting 80% of your serves in rather than trying for aces. Build that foundation first! 💪",
        created_at: new Date(Date.now() - 3600000).toISOString(),
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
        comments_count: 3,
        ambassador_priority: true
      },
      {
        id: 'fallback-ambassador-3',
        content: "Mental game check! 🧠 Remember: the most important point is always the next one. Don't let one bad shot affect your entire game. Stay present, stay focused! ✨",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        user_id: 'system-ambassador-3',
        media_url: null,
        media_type: null,
        privacy_level: 'public',
        template_id: null,
        is_auto_generated: true,
        engagement_score: 92,
        is_ambassador_content: true,
        author: {
          full_name: 'Tennis Mentor Alex',
          user_type: 'ambassador',
          avatar_url: null
        },
        likes_count: 22,
        comments_count: 7,
        ambassador_priority: true
      },
      {
        id: 'fallback-user-1',
        content: "Just finished an amazing practice session! The feeling when you finally nail that backhand you've been working on... pure magic! 🎾✨",
        created_at: new Date(Date.now() - 10800000).toISOString(),
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
        comments_count: 2,
        ambassador_priority: false
      },
      {
        id: 'fallback-user-2',
        content: "Anyone else obsessed with watching slow-motion videos of their favorite pros? The technique details you can pick up are incredible! 📹🎯",
        created_at: new Date(Date.now() - 14400000).toISOString(),
        user_id: 'system-user-2',
        media_url: null,
        media_type: null,
        privacy_level: 'public',
        template_id: null,
        is_auto_generated: true,
        engagement_score: 65,
        is_ambassador_content: false,
        author: {
          full_name: 'Court Analyst',
          user_type: 'player',
          avatar_url: null
        },
        likes_count: 8,
        comments_count: 4,
        ambassador_priority: false
      }
    ];

    // Ensure 60% are ambassadors in emergency fallback
    return fallbackPosts;
  }
}
