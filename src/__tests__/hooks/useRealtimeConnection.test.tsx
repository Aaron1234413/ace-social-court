
import { renderHook, act } from '@testing-library/react';
import { useRealtimeConnection } from '@/hooks/use-realtime-connection';
import { mockSupabase } from '../mocks/supabase';

describe('useRealtimeConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes connection', () => {
    const { result } = renderHook(() => useRealtimeConnection());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('establishes connection', () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    mockSupabase.channel.mockReturnValue(mockChannel);

    const { result } = renderHook(() => useRealtimeConnection());

    act(() => {
      result.current.connect('test-channel');
    });

    expect(mockSupabase.channel).toHaveBeenCalledWith('test-channel');
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('disconnects from channel', () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    mockSupabase.channel.mockReturnValue(mockChannel);

    const { result } = renderHook(() => useRealtimeConnection());

    act(() => {
      result.current.connect('test-channel');
    });

    act(() => {
      result.current.disconnect();
    });

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });

  it('handles connection error', () => {
    mockSupabase.channel.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const { result } = renderHook(() => useRealtimeConnection());

    act(() => {
      result.current.connect('test-channel');
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isConnected).toBe(false);
  });

  it('cleans up on unmount', () => {
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    mockSupabase.channel.mockReturnValue(mockChannel);

    const { result, unmount } = renderHook(() => useRealtimeConnection());

    act(() => {
      result.current.connect('test-channel');
    });

    unmount();

    expect(mockChannel.unsubscribe).toHaveBeenCalled();
  });
});
