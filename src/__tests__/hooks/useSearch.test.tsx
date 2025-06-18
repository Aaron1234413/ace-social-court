
import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useSearch } from '@/hooks/useSearch';
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

const mockSearchResults = [
  {
    id: 'user-1',
    username: 'john_doe',
    full_name: 'John Doe',
    avatar_url: null,
    user_type: 'player',
  },
  {
    id: 'user-2',
    username: 'jane_smith',
    full_name: 'Jane Smith',
    avatar_url: 'https://example.com/avatar.jpg',
    user_type: 'coach',
  },
];

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('performs search successfully', async () => {
    mockSupabase.from().select().or().limit().mockResolvedValue({
      data: mockSearchResults,
      error: null,
    });

    const { result } = renderHook(() => useSearch(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSearchQuery('john');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toEqual(expect.any(Array));
    expect(result.current.error).toBeFalsy();
  });

  it('handles empty search results', async () => {
    mockSupabase.from().select().or().limit().mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useSearch(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSearchQuery('nonexistent');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toEqual([]);
  });

  it('handles search error', async () => {
    mockSupabase.from().select().or().limit().mockResolvedValue({
      data: null,
      error: { message: 'Search failed' },
    });

    const { result } = renderHook(() => useSearch(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSearchQuery('test');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('clears search query', () => {
    const { result } = renderHook(() => useSearch(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSearchQuery('');
    });

    expect(result.current.searchQuery).toBe('');
  });
});
