import { renderHook, act } from '@testing-library/react';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { mockPosts } from '../mocks/data/posts';

describe('useOptimisticPosts', () => {
  const initialPosts = [mockPosts.standard(), mockPosts.ambassadorContent()];

  it('initializes with provided posts', () => {
    const { result } = renderHook(() => useOptimisticPosts(initialPosts));

    expect(result.current.posts).toEqual(initialPosts);
  });

  it('adds optimistic post', () => {
    const { result } = renderHook(() => useOptimisticPosts(initialPosts));

    const newPost = {
      id: 'optimistic-123',
      content: 'New optimistic post',
      author_id: 'user-123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      privacy_level: 'public' as const,
      is_ambassador_content: false,
      is_fallback_content: false,
      media_urls: [],
      author: {
        id: 'user-123',
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: null,
        user_type: 'player' as const,
      },
    };

    act(() => {
      result.current.addOptimisticPost(newPost);
    });

    expect(result.current.posts).toHaveLength(initialPosts.length + 1);
    expect(result.current.posts[0]).toEqual(newPost);
  });

  it('removes optimistic post', () => {
    const { result } = renderHook(() => useOptimisticPosts(initialPosts));

    const postToRemove = initialPosts[0];

    act(() => {
      result.current.removeOptimisticPost(postToRemove.id);
    });

    expect(result.current.posts).toHaveLength(initialPosts.length - 1);
    expect(result.current.posts.find(p => p.id === postToRemove.id)).toBeUndefined();
  });

  it('updates optimistic post', () => {
    const { result } = renderHook(() => useOptimisticPosts(initialPosts));

    const postToUpdate = initialPosts[0];
    const updatedContent = 'Updated content';

    act(() => {
      result.current.updateOptimisticPost(postToUpdate.id, {
        content: updatedContent,
      });
    });

    const updatedPost = result.current.posts.find(p => p.id === postToUpdate.id);
    expect(updatedPost?.content).toBe(updatedContent);
  });

  it('handles post not found during update', () => {
    const { result } = renderHook(() => useOptimisticPosts(initialPosts));

    act(() => {
      result.current.updateOptimisticPost('non-existent-id', {
        content: 'Updated content',
      });
    });

    // Should not throw error and posts should remain unchanged
    expect(result.current.posts).toEqual(initialPosts);
  });
});
