
import { renderHook, act } from '@testing-library/react';
import { useMobile } from '@/hooks/use-mobile';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('useMobile', () => {
  it('returns true for mobile viewport', () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(true);
  });

  it('returns false for desktop viewport', () => {
    mockMatchMedia(false);

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(false);
  });

  it('updates when viewport changes', () => {
    let matchMediaCallback: ((e: MediaQueryListEvent) => void) | null = null;
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            matchMediaCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useMobile());

    expect(result.current).toBe(false);

    // Simulate viewport change to mobile
    if (matchMediaCallback) {
      act(() => {
        matchMediaCallback({ matches: true } as MediaQueryListEvent);
      });
    }

    expect(result.current).toBe(true);
  });
});
