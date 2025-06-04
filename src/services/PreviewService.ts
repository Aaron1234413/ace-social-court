
import { Post } from '@/types/post';
import { PrivacyLevel } from '@/components/social/EnhancedPrivacySelector';
import { sanitizePostsForUser, PrivacyContext, canUserViewPost } from '@/utils/privacySanitization';

interface PreviewCacheEntry {
  preview: PostPreview;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

interface PostPreview {
  id: string;
  content: string;
  privacyLevel: PrivacyLevel;
  visibleTo: string[];
  audience: string;
  authorName: string;
  timestamp: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  hitRate: number;
  avgResponseTime: number;
  lastCleanup: number;
}

class PreviewService {
  private cache = new Map<string, PreviewCacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    hitRate: 0,
    avgResponseTime: 0,
    lastCleanup: Date.now()
  };
  
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute
  private readonly MAX_CACHE_SIZE = 1000;
  
  constructor() {
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  /**
   * Generate preview for a post with specific privacy level
   */
  async generatePreview(
    post: Partial<Post>,
    privacyLevel: PrivacyLevel,
    context: PrivacyContext
  ): Promise<PostPreview> {
    const startTime = performance.now();
    
    try {
      const cacheKey = this.generateCacheKey(post, privacyLevel, context);
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.recordHit(startTime);
        return cached;
      }
      
      // Generate preview
      const preview = await this.createPreview(post, privacyLevel, context);
      
      // Cache the result
      this.setCache(cacheKey, preview);
      
      this.recordMiss(startTime);
      return preview;
      
    } catch (error) {
      console.error('Preview generation failed:', error);
      this.recordMiss(startTime);
      throw error;
    }
  }

  /**
   * Generate multiple previews for different privacy levels
   */
  async generateMultiplePreviews(
    post: Partial<Post>,
    privacyLevels: PrivacyLevel[],
    context: PrivacyContext
  ): Promise<Record<PrivacyLevel, PostPreview>> {
    const previews = await Promise.all(
      privacyLevels.map(async (level) => ({
        level,
        preview: await this.generatePreview(post, level, context)
      }))
    );

    return previews.reduce((acc, { level, preview }) => {
      acc[level] = preview;
      return acc;
    }, {} as Record<PrivacyLevel, PostPreview>);
  }

  /**
   * Invalidate cache for specific post or user
   */
  invalidateCache(postId?: string, userId?: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (postId && key.includes(`post:${postId}`)) {
        keysToDelete.push(key);
      } else if (userId && key.includes(`user:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`Cache invalidated: ${keysToDelete.length} entries removed`);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Cache completely cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      hitRate: this.stats.totalRequests > 0 
        ? (this.stats.hits / this.stats.totalRequests) * 100 
        : 0
    };
  }

  private async createPreview(
    post: Partial<Post>,
    privacyLevel: PrivacyLevel,
    context: PrivacyContext
  ): Promise<PostPreview> {
    const fullPost: Post = {
      id: post.id || 'preview',
      content: post.content || '',
      created_at: post.created_at || new Date().toISOString(),
      user_id: post.user_id || context.currentUserId || 'unknown',
      media_url: post.media_url,
      media_type: post.media_type,
      privacy_level: privacyLevel,
      template_id: post.template_id,
      is_auto_generated: post.is_auto_generated || false,
      engagement_score: post.engagement_score || 0,
      author: post.author || {
        full_name: 'Preview User',
        user_type: 'player',
        avatar_url: null
      },
      likes_count: 0,
      comments_count: 0
    };

    // Determine audience based on privacy level
    const audience = this.getAudienceDescription(privacyLevel, context);
    
    // Get visible users (simplified for preview)
    const visibleTo = this.getVisibleUsers(privacyLevel, context);

    return {
      id: fullPost.id,
      content: fullPost.content,
      privacyLevel,
      visibleTo,
      audience,
      authorName: fullPost.author?.full_name || 'Unknown User',
      timestamp: Date.now()
    };
  }

  private getAudienceDescription(
    privacyLevel: PrivacyLevel,
    context: PrivacyContext
  ): string {
    const followingCount = context.userFollowings?.length || 0;
    
    switch (privacyLevel) {
      case 'private':
        return 'Just you';
      case 'friends':
        return followingCount > 0 
          ? `${followingCount} people you follow`
          : 'People you follow (none yet)';
      case 'public':
        return 'Everyone on the platform';
      case 'coaches':
        return 'Verified coaches only';
      default:
        return 'Unknown audience';
    }
  }

  private getVisibleUsers(
    privacyLevel: PrivacyLevel,
    context: PrivacyContext
  ): string[] {
    switch (privacyLevel) {
      case 'private':
        return [context.currentUserId || 'self'];
      case 'friends':
        return context.userFollowings || [];
      case 'public':
        return ['everyone'];
      case 'coaches':
        return ['coaches'];
      default:
        return [];
    }
  }

  private generateCacheKey(
    post: Partial<Post>,
    privacyLevel: PrivacyLevel,
    context: PrivacyContext
  ): string {
    const contentHash = this.simpleHash(post.content || '');
    const userHash = this.simpleHash(context.currentUserId || '');
    const followingHash = this.simpleHash((context.userFollowings || []).join(','));
    
    return `preview:${post.id || 'new'}:${privacyLevel}:${contentHash}:${userHash}:${followingHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache(key: string): PostPreview | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.preview;
  }

  private setCache(key: string, preview: PostPreview, ttl = this.DEFAULT_TTL): void {
    // Cleanup if cache is too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup(true);
    }
    
    this.cache.set(key, {
      preview,
      timestamp: Date.now(),
      ttl
    });
  }

  private recordHit(startTime: number): void {
    this.stats.hits++;
    this.stats.totalRequests++;
    this.updateAvgResponseTime(startTime);
  }

  private recordMiss(startTime: number): void {
    this.stats.misses++;
    this.stats.totalRequests++;
    this.updateAvgResponseTime(startTime);
  }

  private updateAvgResponseTime(startTime: number): void {
    const responseTime = performance.now() - startTime;
    this.stats.avgResponseTime = (
      (this.stats.avgResponseTime * (this.stats.totalRequests - 1)) + responseTime
    ) / this.stats.totalRequests;
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanup(force = false): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache) {
      if (force || (now - entry.timestamp > entry.ttl)) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    this.stats.lastCleanup = now;
    
    if (removed > 0) {
      console.log(`Cache cleanup: removed ${removed} expired entries`);
    }
  }
}

// Export singleton instance
export const previewService = new PreviewService();

// Export hook for React components
export function usePreviewService() {
  return {
    generatePreview: previewService.generatePreview.bind(previewService),
    generateMultiplePreviews: previewService.generateMultiplePreviews.bind(previewService),
    invalidateCache: previewService.invalidateCache.bind(previewService),
    clearCache: previewService.clearCache.bind(previewService),
    getStats: previewService.getStats.bind(previewService)
  };
}
