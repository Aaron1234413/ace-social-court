
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof authSchema>;

const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const validateForm = (): { valid: boolean; errors?: Record<string, string> } => {
    try {
      authSchema.parse({ email, password });
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, curr) => {
          const field = curr.path[0] as string;
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        return { valid: false, errors };
      }
      return { valid: false, errors: { form: 'Invalid form data' } };
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    
    if (!validation.valid) {
      Object.values(validation.errors || {}).forEach((error) => {
        toast.error(error);
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Attempting login with email:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
      } else {
        console.log('Login successful');
        toast.success('Logged in successfully');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm();
    
    if (!validation.valid) {
      Object.values(validation.errors || {}).forEach((error) => {
        toast.error(error);
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting signup with email:', email);
      console.log('Password length:', password.length);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth',
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error details:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please try logging in instead.');
        } else if (error.message.includes('Password should be at least')) {
          toast.error('Password must be at least 6 characters long.');
        } else if (error.message.includes('Invalid email')) {
          toast.error('Please enter a valid email address.');
        } else {
          toast.error(`Signup failed: ${error.message}`);
        }
      } else {
        console.log('Signup successful, user data:', data.user);
        if (data.user && !data.user.email_confirmed_at) {
          toast.success('Account created! Please check your email for verification.');
        } else {
          toast.success('Account created successfully!');
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(`Failed to create account: ${error.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">welcome to rallypointx</CardTitle>
        <CardDescription className="text-center">
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        
        <TabsContent value="signup">
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default AuthForm;
