
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import AuthForm from '@/components/AuthForm';
import { Loading } from '@/components/ui/loading';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract redirect path from query parameter if it exists
  const query = new URLSearchParams(location.search);
  const fromPath = query.get('from');
  
  useEffect(() => {
    // If user is already authenticated, redirect them
    if (user && !isLoading) {
      console.log('Auth: User detected, redirecting...');
      
      if (fromPath) {
        console.log('Auth: Redirecting to:', fromPath);
        navigate(fromPath, { replace: true });
      } else {
        console.log('Auth: No specific redirect path, going to dashboard');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, isLoading, navigate, fromPath]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text="Authenticating..." />
      </div>
    );
  }
  
  // Don't render auth form if user is already logged in
  if (user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text="Redirecting..." />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="container flex flex-col items-center justify-center px-4">
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
