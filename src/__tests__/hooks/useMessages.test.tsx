
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useMessages } from '@/hooks/useMessages';
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

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello there!',
    sender_id: 'user-1',
    recipient_id: 'user-2',
    created_at: new Date().toISOString(),
    read: false,
  },
  {
    id: 'msg-2',
    content: 'How are you?',
    sender_id: 'user-2',
    recipient_id: 'user-1',
    created_at: new Date().toISOString(),
    read: true,
  },
];

describe('useMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches messages successfully', async () => {
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: mockMessages,
      error: null,
    });

    const { result } = renderHook(() => useMessages('conversation-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toEqual(mockMessages);
  });

  it('handles empty conversation', async () => {
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: [],
      error: null,
    });

    const { result } = renderHook(() => useMessages('empty-conversation'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toEqual([]);
  });

  it('handles fetch error', async () => {
    mockSupabase.from().select().eq().order().mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch messages' },
    });

    const { result } = renderHook(() => useMessages('conversation-123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
