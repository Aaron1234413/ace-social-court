
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { useAdminRole } from '@/hooks/use-admin-role';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldX } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, error } = useAdminRole();

  // Show loading while checking authentication and admin status
  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text="Verifying admin access..." />
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth?from=/admin" replace />;
  }

  // Show error if there was an issue checking admin status
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Error verifying admin access: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show access denied if not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen p-4">
        <Alert className="max-w-md">
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Access denied. You do not have administrator privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render admin content if user is admin
  return <>{children}</>;
}
