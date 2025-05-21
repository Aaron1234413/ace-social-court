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
    console.log('Auth: User detected, redirecting to feed');
    console.log('Auth: Current location path:', location.pathname);
    console.log('Auth: fromPath parameter detected:', fromPath);
    
    // If user is already authenticated, redirect them
    if (user && !isLoading) {
      if (fromPath) {
        console.log('Auth: Redirecting to:', fromPath);
        navigate(fromPath);
      } else {
        console.log('Auth: No specific redirect path, going to feed');
        console.log('Auth: About to navigate to /feed');
        navigate('/feed');
      }
    }
  }, [user, isLoading, navigate, fromPath, location.pathname]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loading text="Authenticating..." />
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="container flex flex-col items-center justify-center">
        <AuthForm />
      </div>
    </div>
  );
};

export default Auth;
