
import { renderHook, act } from '@testing-library/react';
import { useOptimisticPosts } from '@/hooks/useOptimisticPosts';
import { mockPosts } from '../mocks/data/posts';

describe('useOptimisticPosts', () => {
  it('initializes with empty optimistic posts', () => {
    const { result } = renderHook(() => useOptimisticPosts());

    expect(result.current.optimisticPosts).toEqual([]);
  });

  it('adds optimistic post', () => {
    const { result } = renderHook(() => useOptimisticPosts());

    const newPost = mockPosts.standard();

    act(() => {
      result.current.addOptimisticPost(newPost);
    });

    expect(result.current.optimisticPosts).toHaveLength(1);
    expect(result.current.optimisticPosts[0]).toMatchObject({
      ...newPost,
      isOptimistic: true
    });
  });

  it('removes optimistic post', () => {
    const { result } = renderHook(() => useOptimisticPosts());

    const newPost = mockPosts.standard();

    act(() => {
      result.current.addOptimisticPost(newPost);
    });

    expect(result.current.optimisticPosts).toHaveLength(1);

    act(() => {
      result.current.removeOptimisticPost(newPost.id);
    });

    expect(result.current.optimisticPosts).toHaveLength(0);
  });

  it('clears all optimistic posts', () => {
    const { result } = renderHook(() => useOptimisticPosts());

    const post1 = mockPosts.standard();
    const post2 = mockPosts.ambassadorContent();

    act(() => {
      result.current.addOptimisticPost(post1);
      result.current.addOptimisticPost(post2);
    });

    expect(result.current.optimisticPosts).toHaveLength(2);

    act(() => {
      result.current.clearAllOptimistic();
    });

    expect(result.current.optimisticPosts).toHaveLength(0);
  });

  it('automatically removes posts after timeout', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useOptimisticPosts());

    const newPost = mockPosts.standard();

    act(() => {
      result.current.addOptimisticPost(newPost);
    });

    expect(result.current.optimisticPosts).toHaveLength(1);

    // Fast forward time by 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(result.current.optimisticPosts).toHaveLength(0);

    jest.useRealTimers();
  });
});
