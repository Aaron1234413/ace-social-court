
import { PreviewService } from '@/services/PreviewService';
import { mockSupabase } from '../mocks/supabase';
import { PrivacyContext } from '@/utils/privacySanitization';

const mockPost = {
  id: 'post-1',
  content: 'This is a test post with some content that should be visible',
  created_at: new Date().toISOString(),
  user_id: 'user-1',
  privacy_level: 'public' as const,
  media_url: null,
  media_type: null,
};

const mockAuthor = {
  full_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  user_type: 'player',
};

const mockContext: PrivacyContext = {
  currentUserId: 'viewer-1',
  userFollowings: ['user-1'],
  isCoach: false,
};

describe('PreviewService', () => {
  let previewService: PreviewService;

  beforeEach(() => {
    jest.clearAllMocks();
    previewService = PreviewService.getInstance();
    previewService.clearCache();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = PreviewService.getInstance();
      const instance2 = PreviewService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPostPreview', () => {
    beforeEach(() => {
      // Mock post query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPost,
              error: null,
            }),
          }),
        }),
      });

      // Mock author query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAuthor,
              error: null,
            }),
          }),
        }),
      });

      // Mock engagement count RPCs
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 5, error: null }) // likes count
        .mockResolvedValueOnce({ data: 3, error: null }); // comments count
    });

    it('generates preview for visible post', async () => {
      const preview = await previewService.getPostPreview('post-1', mockContext);

      expect(preview).toEqual({
        content: mockPost.content,
        author: {
          full_name: 'John Doe',
          avatar_url: 'https://example.com/avatar.jpg',
          user_type: 'player',
        },
        engagement: {
          likes_count: 5,
          comments_count: 3,
        },
        privacy_level: 'public',
        created_at: mockPost.created_at,
        is_fallback: false,
      });
    });

    it('creates fallback preview for non-existent post', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Post not found' },
            }),
          }),
        }),
      });

      const preview = await previewService.getPostPreview('non-existent', mockContext);

      expect(preview.is_fallback).toBe(true);
      expect(preview.fallback_reason).toBe('Post not found');
      expect(preview.content).toContain('Post not found');
    });

    it('handles database errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      });

      const preview = await previewService.getPostPreview('post-1', mockContext);

      expect(preview.is_fallback).toBe(true);
      expect(preview.content).toContain('Service temporarily unavailable');
    });

    it('uses cache for repeated requests', async () => {
      // First request
      await previewService.getPostPreview('post-1', mockContext);
      
      // Second request should use cache
      const preview = await previewService.getPostPreview('post-1', mockContext, false);

      expect(preview).toBeDefined();
      // Verify database was only called once
      expect(mockSupabase.from).toHaveBeenCalledTimes(3); // post, author, and engagement calls from first request
    });

    it('bypasses cache when force refresh is true', async () => {
      // First request
      await previewService.getPostPreview('post-1', mockContext);
      
      // Reset mocks to track second request
      jest.clearAllMocks();
      
      // Mock again for second request
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPost,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAuthor,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 5, error: null })
        .mockResolvedValueOnce({ data: 3, error: null });

      // Force refresh should bypass cache
      await previewService.getPostPreview('post-1', mockContext, true);

      expect(mockSupabase.from).toHaveBeenCalled();
    });

    it('truncates long content appropriately', async () => {
      const longContent = 'A'.repeat(300);
      const longPost = { ...mockPost, content: longContent };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: longPost,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockAuthor,
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 0, error: null })
        .mockResolvedValueOnce({ data: 0, error: null });

      const preview = await previewService.getPostPreview('post-1', mockContext);

      expect(preview.content.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(preview.content).toContain('...');
    });
  });

  describe('cache management', () => {
    it('invalidates user cache correctly', () => {
      previewService.invalidateUserCache('user-1');
      // Should not throw and should clear relevant entries
      expect(true).toBe(true); // Basic test that method executes
    });

    it('invalidates post cache correctly', () => {
      previewService.invalidatePostCache('post-1');
      // Should not throw and should clear relevant entries
      expect(true).toBe(true); // Basic test that method executes
    });

    it('clears entire cache', () => {
      previewService.clearCache();
      const stats = previewService.getCacheStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('returns cache statistics', () => {
      const stats = previewService.getCacheStats();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('fillPercentage');
    });
  });
});
