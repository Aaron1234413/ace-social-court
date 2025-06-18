
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { usePosts } from '@/hooks/use-posts';
import { mockSupabase } from '../mocks/supabase';
import { mockPosts } from '../mocks/data/posts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('usePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches posts successfully', async () => {
    const mockPostsData = [mockPosts.standard(), mockPosts.ambassadorContent()];
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: mockPostsData,
      error: null,
    });

    const { result } = renderHook(() => usePosts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toEqual(mockPostsData);
  });

  it('handles fetch error', async () => {
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { result } = renderHook(() => usePosts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toEqual([]);
  });

  it('returns empty array when no posts found', async () => {
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => usePosts({}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.posts).toEqual([]);
  });
});
