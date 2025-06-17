
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/AuthProvider';

// Mock user for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: any;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ children, user = null, queryClient }: { children: React.ReactNode; user?: any; queryClient?: QueryClient }) => {
  const client = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  // Mock AuthProvider for testing
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const mockAuthValue = {
      user: user,
      session: user ? { access_token: 'mock-token', user } : null,
      profile: user ? {
        id: user.id,
        username: 'testuser',
        full_name: 'Test User',
        user_type: 'player' as const,
        roles: ['player'],
        current_active_role: 'player',
        experience_level: 'intermediate' as const,
        bio: 'Test bio',
      } : null,
      isLoading: false,
      isProfileComplete: true,
      signOut: jest.fn(),
      refreshProfile: jest.fn(),
    };

    return React.createElement(React.Fragment, null, children);
  };

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <MockAuthProvider>
          {children}
        </MockAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { user, queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} user={user} queryClient={queryClient} />,
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };
export { customRender as renderWithProviders };
