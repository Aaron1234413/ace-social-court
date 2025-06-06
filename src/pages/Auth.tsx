
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import Login from '@/components/auth/Login';
import SignUp from '@/components/auth/SignUp';
import { Loading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract redirect path from query parameter if it exists
  const query = new URLSearchParams(location.search);
  const fromPath = query.get('from');
  
  // State to track which tab is active
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    // Set initial tab from URL if provided
    const tabParam = query.get('tab');
    if (tabParam === 'signup') {
      setActiveTab('signup');
    }
  }, [query]);
  
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
  
  const handleSuccess = () => {
    // This will be called if login/signup is successful but no auto-redirect happens
    console.log('Auth: Authentication successful, checking for redirect needs');
    if (fromPath) {
      navigate(fromPath, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };
  
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
    <div className="flex items-center justify-center min-h-screen bg-background py-8">
      <div className="container flex flex-col items-center justify-center px-4 max-w-md w-full">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>Welcome to RallyPointX</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Login onSuccess={handleSuccess} />
              </TabsContent>
              
              <TabsContent value="signup">
                <SignUp onSuccess={handleSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
