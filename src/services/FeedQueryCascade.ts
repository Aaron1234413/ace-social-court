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
    userFollowings: string[],
    page: number = 0,
    existingPosts: Post[] = []
  ): Promise<CascadeResult> {
    console.log('🚀 STARTING AMBASSADOR-PRIORITY FEED QUERY CASCADE', { 
      userId, 
      followingCount: userFollowings.length,
      page,
      existingPostCount: existingPosts.length,
      guaranteedAmbassadorPercentage: this.AMBASSADOR_GUARANTEED_PERCENTAGE * 100 + '%'
    });

    const startTime = performance.now();
    const metrics: CascadeMetrics[] = [];
    let allPosts: Post[] = [...existingPosts];
    const offset = page * this.POSTS_PER_PAGE;
    let totalCacheHits = 0;
    let totalQueries = 0;
    const debugData: any = { 
      steps: [],
      errors: [],
      queries: [],
      ambassadorPriority: true
    };
    const errorDetails: string[] = [];

    // Ambassador metrics tracking
    let ambassadorMetrics = {
      totalAmbassadorPosts: 0,
      newAmbassadorPosts: 0,
      rotatedOutPosts: 0,
      guaranteedPercentage: this.AMBASSADOR_GUARANTEED_PERCENTAGE
    };

    try {
      // STEP 1: PRIORITY AMBASSADOR CONTENT (ALWAYS FIRST)
      console.log('👑 STEP 1: Loading PRIORITY ambassador content (35% guaranteed)');
      debugData.steps.push('Starting priority ambassador query - 35% guaranteed');
      
      const ambassadorStart = performance.now();
      const ambassadorResult = await this.queryAmbassadorContentPriority(offset);
      totalQueries++;
      
      const ambassadorMetric = {
        level: 'ambassador_priority' as const,
        postCount: ambassadorResult.posts.length,
        queryTime: performance.now() - ambassadorStart,
        source: 'priority_ambassadors',
        cacheHit: false,
        errorCount: ambassadorResult.errors.length,
        debugInfo: {
          ...ambassadorResult.debugInfo,
          guaranteedPercentage: this.AMBASSADOR_GUARANTEED_PERCENTAGE,
          priorityLoading: true
        }
      };
      
      metrics.push(ambassadorMetric);
      allPosts.push(...ambassadorResult.posts);
      debugData.queries.push(ambassadorResult.debugInfo);
      
      // Update ambassador metrics
      ambassadorMetrics.totalAmbassadorPosts = ambassadorResult.posts.length;
      ambassadorMetrics.newAmbassadorPosts = ambassadorResult.debugInfo?.newPosts || 0;
      ambassadorMetrics.rotatedOutPosts = ambassadorResult.debugInfo?.rotatedOut || 0;
      
      if (ambassadorResult.errors.length > 0) {
        errorDetails.push(...ambassadorResult.errors);
        debugData.errors.push(...ambassadorResult.errors);
      }

      console.log('👑 Priority ambassador content result:', {
        posts: ambassadorResult.posts.length,
        guaranteedPercentage: Math.round((ambassadorResult.posts.length / this.POSTS_PER_PAGE) * 100) + '%',
        newPosts: ambassadorMetrics.newAmbassadorPosts,
        rotatedOut: ambassadorMetrics.rotatedOutPosts,
        errors: ambassadorResult.errors.length,
        time: Math.round(ambassadorMetric.queryTime) + 'ms'
      });

      // STEP 2: FOLLOWED USERS CONTENT (Secondary Priority)
      if (userFollowings.length > 0) {
        console.log('👥 STEP 2: Fetching content from followed users (secondary priority)');
        debugData.steps.push('Starting followed users query - secondary to ambassadors');
        
        const primaryStart = performance.now();
        const primaryResult = await this.queryPersonalizedContentRobust(userId, userFollowings, offset);
        totalQueries++;
        
        const primaryMetric = {
          level: 'primary' as const,
          postCount: primaryResult.posts.length,
          queryTime: performance.now() - primaryStart,
          source: 'followed_users_secondary',
          cacheHit: false,
          errorCount: primaryResult.errors.length,
          debugInfo: primaryResult.debugInfo
        };
        
        metrics.push(primaryMetric);
        allPosts.push(...primaryResult.posts);
        debugData.queries.push(primaryResult.debugInfo);
        
        if (primaryResult.errors.length > 0) {
          errorDetails.push(...primaryResult.errors);
          debugData.errors.push(...primaryResult.errors);
        }

        console.log('👥 Followed users content result:', {
          posts: primaryResult.posts.length,
          errors: primaryResult.errors.length,
          time: Math.round(primaryMetric.queryTime) + 'ms'
        });
      } else {
        console.log('⚠️ No followed users - skipping personalized content');
        debugData.steps.push('Skipped followed users (none found)');
      }

      // STEP 3: HIGH-QUALITY PUBLIC CONTENT (Fill remaining slots)
      const currentAmbassadorCount = allPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const targetTotal = Math.max(this.MIN_POSTS, this.POSTS_PER_PAGE);
      const guaranteedAmbassadorCount = Math.ceil(targetTotal * this.AMBASSADOR_GUARANTEED_PERCENTAGE);
      
      // Only add public content if we need more posts AND we have enough ambassadors
      if (allPosts.length < targetTotal && currentAmbassadorCount >= guaranteedAmbassadorCount) {
        console.log('🌐 STEP 3: Adding high-quality public content (after ambassador guarantee met)');
        debugData.steps.push('Adding public content - ambassador quota satisfied');
        
        const fallbackStart = performance.now();
        const publicResult = await this.queryPublicContentRobust(offset);
        totalQueries++;
        
        const fallbackMetric = {
          level: 'fallback1' as const,
          postCount: publicResult.posts.length,
          queryTime: performance.now() - fallbackStart,
          source: 'public_content_fill',
          cacheHit: false,
          errorCount: publicResult.errors.length,
          debugInfo: publicResult.debugInfo
        };
        
        metrics.push(fallbackMetric);
        allPosts.push(...publicResult.posts);
        debugData.queries.push(publicResult.debugInfo);
        
        if (publicResult.errors.length > 0) {
          errorDetails.push(...publicResult.errors);
          debugData.errors.push(...publicResult.errors);
        }

        console.log('🌐 Public content result:', {
          posts: publicResult.posts.length,
          errors: publicResult.errors.length,
          time: Math.round(fallbackMetric.queryTime) + 'ms'
        });
      } else if (currentAmbassadorCount < guaranteedAmbassadorCount) {
        console.log('⚠️ Ambassador quota not met, skipping public content to prioritize ambassadors');
        debugData.steps.push('Skipped public content - ambassador quota not satisfied');
      }

      // Remove duplicates but preserve ambassador priority order
      const uniquePosts = this.removeDuplicatesPreserveOrder(allPosts);
      console.log('🔧 Removed duplicates (preserving ambassador priority):', {
        before: allPosts.length,
        after: uniquePosts.length,
        removed: allPosts.length - uniquePosts.length
      });

      // Smart mix content with ambassador priority
      let finalPosts = uniquePosts;
      if (uniquePosts.length > 0) {
        try {
          const mixedPosts = await this.smartMixContentWithAmbassadorPriority(uniquePosts, userFollowings, userId);
          if (mixedPosts.length > 0) {
            finalPosts = mixedPosts;
            console.log('🎭 Smart mixing applied with ambassador priority');
          } else {
            console.warn('⚠️ Smart mixing returned empty - using original posts');
            debugData.errors.push('Smart mixing returned empty array');
          }
        } catch (mixError) {
          console.error('❌ Smart mixing failed:', mixError);
          debugData.errors.push(`Smart mixing error: ${mixError.message}`);
          errorDetails.push(`Smart mixing failed: ${mixError.message}`);
        }
      }

      // ABSOLUTE LAST RESORT - Hardcoded content (maintains ambassador priority)
      if (finalPosts.length === 0) {
        console.log('🚨 ABSOLUTE EMERGENCY: Creating hardcoded fallback content (ambassador priority)');
        debugData.steps.push('Using hardcoded fallback content with ambassador priority');
        
        finalPosts = this.createHardcodedFallbackContentWithAmbassadors();
        
        const hardcodedMetric = {
          level: 'fallback2' as const,
          postCount: finalPosts.length,
          queryTime: 0,
          source: 'hardcoded_ambassador_priority',
          cacheHit: false,
          errorCount: 0,
          debugInfo: { source: 'hardcoded', reason: 'all_queries_failed', ambassadorPriority: true }
        };
        metrics.push(hardcodedMetric);
      }

      // Final analysis with ambassador priority focus
      const finalAmbassadorCount = finalPosts.filter(post => 
        post.author?.user_type === 'ambassador' || post.is_ambassador_content
      ).length;
      
      const ambassadorPercentage = finalPosts.length > 0 
        ? finalAmbassadorCount / finalPosts.length 
        : 0;

      // Update final ambassador metrics
      ambassadorMetrics.totalAmbassadorPosts = finalAmbassadorCount;

      const totalQueryTime = performance.now() - startTime;
      const cacheHitRate = totalQueries > 0 ? totalCacheHits / totalQueries : 0;

      console.log('✅ AMBASSADOR-PRIORITY FEED QUERY CASCADE COMPLETE:', {
        totalPosts: finalPosts.length,
        ambassadorCount: finalAmbassadorCount,
        ambassadorPercentage: Math.round(ambassadorPercentage * 100) + '%',
        guaranteedTarget: Math.round(this.AMBASSADOR_GUARANTEED_PERCENTAGE * 100) + '%',
        ambassadorGuarantee: ambassadorPercentage >= this.AMBASSADOR_GUARANTEED_PERCENTAGE ? '✅ MET' : '⚠️ BELOW TARGET',
        totalTime: Math.round(totalQueryTime) + 'ms',
        cascadeLevels: metrics.length,
        totalErrors: errorDetails.length
      });

      return {
        posts: finalPosts,
        metrics,
        totalPosts: finalPosts.length,
        ambassadorPercentage,
        totalQueryTime,
        cacheHitRate,
        debugData,
        hasErrors: errorDetails.length > 0,
        errorDetails,
        ambassadorMetrics
      };

    } catch (error) {
      console.error('💥 CRITICAL AMBASSADOR-PRIORITY FEED CASCADE FAILURE:', error);
      errorDetails.push(`Critical cascade failure: ${error.message}`);
      
      // EMERGENCY PROTOCOL - Always return ambassador-heavy content
      const emergencyPosts = this.createHardcodedFallbackContentWithAmbassadors();
      
      return {
        posts: emergencyPosts,
        metrics: metrics.map(m => ({ ...m, errorCount: (m.errorCount || 0) + 1 })),
        totalPosts: emergencyPosts.length,
        ambassadorPercentage: 0.6, // Emergency content has 60% ambassadors
        totalQueryTime: performance.now() - startTime,
        cacheHitRate: 0,
        debugData: { 
          ...debugData, 
          criticalError: error.message,
          emergencyFallback: true,
          ambassadorPriority: true
        },
        hasErrors: true,
        errorDetails,
        ambassadorMetrics: {
          ...ambassadorMetrics,
          totalAmbassadorPosts: Math.floor(emergencyPosts.length * 0.6)
        }
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

      console.log('✅ Priority ambassador content query complete:', {
        ambassadors: debugInfo.totalAmbassadors,
        rawPosts: debugInfo.rawPostCount,
        rotatedPosts: debugInfo.rotatedPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        newPosts: debugInfo.newPosts,
        errors: errors.length
      });

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

      console.log('✅ Personalized content query complete:', {
        followingCount: debugInfo.followingCount,
        rawPosts: debugInfo.rawPostCount,
        formattedPosts: debugInfo.formattedPostCount,
        errors: errors.length
      });

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
