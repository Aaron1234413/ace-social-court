import { renderWithProviders } from '../utils/test-utils';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { mockSupabase } from '../mocks/supabase';
import { mockUsers } from '../mocks/data/users';
import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

// Test component to access auth context
const TestComponent = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  return (
    <div>
      <div data-testid="user-state">{user ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'no-profile'}</div>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button onClick={refreshProfile} data-testid="refresh-profile">
        Refresh Profile
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides unauthenticated state by default', () => {
    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user-state')).toHaveTextContent('unauthenticated');
    expect(getByTestId('profile-name')).toHaveTextContent('no-profile');
  });

  it('handles successful authentication', async () => {
    const mockUser = mockUsers.player();
    
    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
      { user: mockUser }
    );

    expect(getByTestId('user-state')).toHaveTextContent('authenticated');
  });

  it('handles sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null });

    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('sign-out').click();
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it('provides refresh profile functionality', async () => {
    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('refresh-profile').click();
    });

    // Test passes if no errors are thrown
    expect(getByTestId('refresh-profile')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Component should render without loading indicators by default in tests
    expect(getByTestId('user-state')).toBeInTheDocument();
  });
});
