
import { renderHook, act } from '@testing-library/react';
import { useRealtimeConnection } from '@/hooks/use-realtime-connection';
import { mockSupabase } from '../mocks/supabase';

describe('useRealtimeConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with connecting status', () => {
    const { result } = renderHook(() => useRealtimeConnection());

    expect(result.current.connectionStatus).toBe('connecting');
  });

  it('can set connection status', () => {
    const { result } = renderHook(() => useRealtimeConnection());

    act(() => {
      result.current.setConnectionStatus('connected');
    });

    expect(result.current.connectionStatus).toBe('connected');
  });

  it('can check and configure realtime', async () => {
    const { result } = renderHook(() => useRealtimeConnection());

    await act(async () => {
      await result.current.checkAndConfigureRealtime();
    });

    // Test passes if no errors are thrown
    expect(result.current.checkAndConfigureRealtime).toBeDefined();
  });
});
