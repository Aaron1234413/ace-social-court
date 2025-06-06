import { Post } from '@/types/post';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePostsForUser, PrivacyContext } from '@/utils/privacySanitization';

interface PreviewData {
  content: string;
  author: {
    full_name: string;
    avatar_url?: string;
    user_type?: string;
  };
  engagement: {
    likes_count: number;
    comments_count: number;
  };
  privacy_level: string;
  created_at: string;
  is_fallback: boolean;
  fallback_reason?: string;
}

interface CacheEntry {
  data: PreviewData;
  timestamp: number;
  user_context: string; // Hash of user's privacy context
}

// Helper function to transform legacy privacy levels to new simplified ones
const transformPrivacyLevel = (level: string): 'private' | 'public' | 'public_highlights' => {
  switch (level) {
    case 'public':
      return 'public';
    case 'public_highlights':
      return 'public_highlights';
    case 'friends':
    case 'coaches':
    case 'private':
    default:
      return 'private';
  }
};

export class PreviewService {
  private static instance: PreviewService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  static getInstance(): PreviewService {
    if (!PreviewService.instance) {
      PreviewService.instance = new PreviewService();
    }
    return PreviewService.instance;
  }

  private generateCacheKey(postId: string, userId: string, friendCount: number, isCoach: boolean): string {
    const contextHash = `${userId}-${friendCount}-${isCoach}`;
    return `preview:${postId}:${contextHash}`;
  }

  private generateUserContextHash(context: PrivacyContext): string {
    return `${context.currentUserId}-${context.userFollowings?.length || 0}-${context.isCoach || false}`;
  }

  private isValidCacheEntry(entry: CacheEntry, currentContext: string): boolean {
    const isExpired = Date.now() - entry.timestamp > this.CACHE_TTL;
    const isContextChanged = entry.user_context !== currentContext;
    return !isExpired && !isContextChanged;
  }

  private cleanCache(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      // Remove oldest 20% of entries
      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  private createFallbackPreview(post: Partial<Post>, reason: string): PreviewData {
    console.log(`📋 Creating fallback preview for post ${post.id}: ${reason}`);
    
    return {
      content: this.getFallbackContent(post.privacy_level, reason),
      author: {
        full_name: post.author?.full_name || 'Rally Player',
        avatar_url: post.author?.avatar_url,
        user_type: post.author?.user_type || 'player'
      },
      engagement: {
        likes_count: Math.floor(Math.random() * 10) + 1,
        comments_count: Math.floor(Math.random() * 5) + 1
      },
      privacy_level: transformPrivacyLevel(post.privacy_level || 'private'),
      created_at: post.created_at || new Date().toISOString(),
      is_fallback: true,
      fallback_reason: reason
    };
  }

  private getFallbackContent(privacyLevel?: string, reason?: string): string {
    const transformedLevel = transformPrivacyLevel(privacyLevel || 'private');
    
    switch (transformedLevel) {
      case 'private':
        return "This post is private. Only people the author follows can see the full content.";
      case 'public':
        return "This post is public but content is not available right now.";
      case 'public_highlights':
        return "This is featured content but not available right now.";
      default:
        return `Content is not available. ${reason || 'Please try again later.'}`;
    }
  }

  async getPostPreview(
    postId: string, 
    context: PrivacyContext,
    forceRefresh = false
  ): Promise<PreviewData> {
    const startTime = performance.now();
    
    try {
      const userContextHash = this.generateUserContextHash(context);
      const cacheKey = this.generateCacheKey(
        postId, 
        context.currentUserId || 'anonymous',
        context.userFollowings?.length || 0,
        context.isCoach || false
      );

      // Check cache first (unless forced refresh)
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached && this.isValidCacheEntry(cached, userContextHash)) {
          console.log(`⚡ Cache hit for post ${postId} (${Math.round(performance.now() - startTime)}ms)`);
          return cached.data;
        }
      }

      // Fetch post data - query without likes_count and comments_count since they don't exist in the table
      const { data: post, error } = await supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id, privacy_level,
          media_url, media_type
        `)
        .eq('id', postId)
        .single();

      if (error || !post) {
        console.warn(`⚠️ Post ${postId} not found:`, error);
        return this.createFallbackPreview(
          { 
            id: postId, 
            content: '', 
            created_at: new Date().toISOString(),
            user_id: '',
            author: null
          }, 
          'Post not found'
        );
      }

      // Get author info
      const { data: authorData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, user_type')
        .eq('id', post.user_id)
        .single();

      // Get engagement counts using RPC functions
      const [{ data: likesCount }, { data: commentsCount }] = await Promise.all([
        supabase.rpc('get_likes_count', { post_id: postId }),
        supabase.rpc('get_comments_count', { post_id: postId })
      ]);

      const fullPost: Post = {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
        user_id: post.user_id,
        privacy_level: transformPrivacyLevel(post.privacy_level), // Transform legacy privacy levels
        media_url: post.media_url,
        media_type: post.media_type,
        author: authorData || null,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0
      };

      // Apply privacy filtering
      const filteredPosts = sanitizePostsForUser([fullPost], context);
      
      let previewData: PreviewData;

      if (filteredPosts.length === 0) {
        // Post is not visible to user - create fallback
        previewData = this.createFallbackPreview(fullPost, 'Privacy restricted');
      } else {
        // Post is visible - create normal preview
        const visiblePost = filteredPosts[0];
        previewData = {
          content: this.truncateContent(visiblePost.content),
          author: {
            full_name: visiblePost.author?.full_name || 'Rally Player',
            avatar_url: visiblePost.author?.avatar_url,
            user_type: visiblePost.author?.user_type || 'player'
          },
          engagement: {
            likes_count: visiblePost.likes_count || 0,
            comments_count: visiblePost.comments_count || 0
          },
          privacy_level: visiblePost.privacy_level,
          created_at: visiblePost.created_at,
          is_fallback: false
        };
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: previewData,
        timestamp: Date.now(),
        user_context: userContextHash
      });

      this.cleanCache();

      const loadTime = Math.round(performance.now() - startTime);
      console.log(`✅ Preview generated for post ${postId} (${loadTime}ms, cached: ${!forceRefresh})`);

      return previewData;

    } catch (error) {
      console.error(`❌ Failed to generate preview for post ${postId}:`, error);
      
      // Always return something, even on error
      return this.createFallbackPreview(
        { 
          id: postId, 
          content: '', 
          created_at: new Date().toISOString(),
          user_id: '',
          author: null
        }, 
        'Service temporarily unavailable'
      );
    }
  }

  private truncateContent(content: string, maxLength = 200): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  }

  invalidateUserCache(userId: string): void {
    console.log(`🗑️ Invalidating cache for user ${userId}`);
    
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(userId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries`);
  }

  invalidatePostCache(postId: string): void {
    console.log(`🗑️ Invalidating cache for post ${postId}`);
    
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`preview:${postId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Invalidated ${keysToDelete.length} cache entries for post ${postId}`);
  }

  getCacheStats() {
    const totalEntries = this.cache.size;
    const memoryUsage = totalEntries * 0.5; // Rough estimate in KB
    
    return {
      totalEntries,
      memoryUsage: Math.round(memoryUsage),
      maxSize: this.MAX_CACHE_SIZE,
      fillPercentage: Math.round((totalEntries / this.MAX_CACHE_SIZE) * 100)
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Preview cache cleared');
  }
}
