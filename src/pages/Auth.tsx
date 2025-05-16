
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Handle redirection when user is already logged in
  useEffect(() => {
    if (user) {
      console.log("Auth: User detected, redirecting to feed");
      
      // If we came from tennis-ai, go back there instead of feed
      const fromPath = new URLSearchParams(location.search).get('from');
      console.log("Auth: fromPath parameter detected:", fromPath);
      
      if (fromPath === '/tennis-ai') {
        console.log("Auth: Redirecting back to tennis-ai");
        navigate('/tennis-ai');
      } else {
        console.log("Auth: No specific redirect path, going to feed");
        navigate("/feed");
      }
    }
  }, [user, navigate, location.search]);

  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/feed'
          }
        });
        
        if (error) throw error;
        
        if (data.user) {
          toast.success("Account created successfully!");
          console.log("Sign up successful, user:", data.user);
          
          // Let the auth state listener handle navigation
        } else {
          // This might be because email confirmation is required
          toast.info("Please check your email to confirm your account!");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          toast.success("Signed in successfully!");
          console.log("Sign in successful, user:", data.user);
          
          // Let the auth state listener handle navigation
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error.message || "Authentication failed");
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Tennis-themed background elements */}
      <div className="absolute inset-0 court-pattern opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-60 h-60 bg-tennis-green/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-20 left-20 w-60 h-60 bg-tennis-accent/10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="tennis-gradient-text">{isSignUp ? "Create Account" : "Welcome Back"}</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? "Sign up to get started with rallypointx" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="my-4 border-2 border-destructive/20">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleAuth} className="space-y-4 tennis-glass-card p-6 rounded-xl">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={isLoading}
              className="w-full tennis-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={isLoading}
              className="w-full tennis-input"
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-tennis-green to-tennis-darkGreen hover:from-tennis-darkGreen hover:to-tennis-green transition-all duration-300" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </>
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-sm text-muted-foreground hover:underline hover:text-primary transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
