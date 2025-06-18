
import { renderHook, waitFor } from '@testing-library/react';
import { useUserFollows } from '@/hooks/useUserFollows';
import { mockSupabase } from '../mocks/supabase';
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

const mockFollows = [
  {
    id: 'follow-1',
    follower_id: 'user-1',
    following_id: 'user-2',
    created_at: new Date().toISOString(),
    following: {
      id: 'user-2',
      username: 'user2',
      full_name: 'User Two',
      avatar_url: null,
    },
  },
];

describe('useUserFollows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches user follows successfully', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: mockFollows,
      error: null,
    });

    const { result } = renderHook(() => useUserFollows(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingFollowing).toBe(false);
    });

    expect(result.current.following).toEqual(expect.any(Array));
    expect(result.current.followers).toEqual(expect.any(Array));
  });

  it('handles empty follows list', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useUserFollows(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingFollowing).toBe(false);
    });

    expect(result.current.following).toEqual([]);
  });

  it('handles fetch error gracefully', async () => {
    mockSupabase.from().select().eq().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { result } = renderHook(() => useUserFollows(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoadingFollowing).toBe(false);
    });

    // Test passes if component handles error gracefully
    expect(result.current.following).toEqual([]);
  });
});
