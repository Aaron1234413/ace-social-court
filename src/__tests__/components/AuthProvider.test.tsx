
import { renderWithProviders } from '../utils/test-utils';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { mockSupabase } from '../mocks/supabase';
import { mockUsers } from '../mocks/data/users';
import { act, waitFor } from '@testing-library/react';

// Test component to access auth context
const TestComponent = () => {
  const { user, profile, signIn, signOut, signUp } = useAuth();
  return (
    <div>
      <div data-testid="user-state">{user ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'no-profile'}</div>
      <button onClick={() => signIn('test@example.com', 'password')} data-testid="sign-in">
        Sign In
      </button>
      <button onClick={signOut} data-testid="sign-out">
        Sign Out
      </button>
      <button 
        onClick={() => signUp('new@example.com', 'password', { full_name: 'New User' })} 
        data-testid="sign-up"
      >
        Sign Up
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

  it('handles successful sign in', async () => {
    const mockUser = mockUsers.player();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: { access_token: 'token' } },
      error: null
    });

    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('sign-in').click();
    });

    await waitFor(() => {
      expect(getByTestId('user-state')).toHaveTextContent('authenticated');
    });

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password'
    });
  });

  it('handles sign in errors', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('sign-in').click();
    });

    expect(getByTestId('user-state')).toHaveTextContent('unauthenticated');
  });

  it('handles successful sign up', async () => {
    const mockUser = mockUsers.player();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser, session: null },
      error: null
    });

    const { getByTestId } = renderWithProviders(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('sign-up').click();
    });

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password',
      options: {
        data: { full_name: 'New User' }
      }
    });
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
});
