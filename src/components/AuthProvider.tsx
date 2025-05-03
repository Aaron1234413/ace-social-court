
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  user_type: 'player' | 'coach';
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null;
  bio: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  session: null,
  profile: null,
  isLoading: true,
  isProfileComplete: false,
  signOut: async () => {},
  refreshProfile: async () => {}
});

// Make sure this is a functional component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isProfileChecked, setIsProfileChecked] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  // Add local storage key for tracking profile completion
  const PROFILE_COMPLETE_KEY = 'user_profile_complete';

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Error signing out: ${error.message}`);
    } else {
      setProfile(null);
      setIsProfileComplete(false);
      setIsProfileChecked(false);
      // Clear profile completion status from localStorage
      localStorage.removeItem(PROFILE_COMPLETE_KEY);
      toast.success("Signed out successfully");
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      setIsProfileChecked(true);
      return;
    }
    
    try {
      console.log('Refreshing profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setIsProfileChecked(true);
        return;
      }
      
      console.log('Fetched profile data:', data);
      setProfile(data);
      
      // Check if profile is complete enough to use the app
      // Explicitly check each required field and log the result
      const hasUsername = !!data.username && data.username.trim() !== '';
      const hasFullName = !!data.full_name && data.full_name.trim() !== '';
      const hasUserType = !!data.user_type;
      const hasExperienceLevel = !!data.experience_level;
      
      const profileIsComplete = hasUsername && hasFullName && hasUserType && hasExperienceLevel;
      
      console.log('Profile completion check:', {
        hasUsername,
        hasFullName,
        hasUserType,
        hasExperienceLevel,
        isComplete: profileIsComplete
      });
      
      // If profile is complete, store this information in localStorage for future sessions
      if (profileIsComplete) {
        localStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
        console.log('Profile is complete, saved to localStorage');
      }
      
      // Set profile complete status - check both current completion and stored completion
      const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
      setIsProfileComplete(profileIsComplete || storedProfileComplete);
      setIsProfileChecked(true);
      
      console.log('Profile loaded:', data);
      console.log('Profile complete status:', profileIsComplete || storedProfileComplete, 
                  '(current:', profileIsComplete, ', stored:', storedProfileComplete, ')');
      
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setIsProfileChecked(true);
    } finally {
      // Always mark profile as checked, even on error
      setIsProfileChecked(true);
    }
  };

  useEffect(() => {
    console.log("AuthProvider initializing");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? "session exists" : "no session");
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          toast.success("Signed in successfully!");
          
          // Check if we have stored profile completion status
          const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
          if (storedProfileComplete) {
            console.log('Found stored profile completion status: complete');
            setIsProfileComplete(true);
          }
          
          // Still refresh profile to get latest data
          setTimeout(() => {
            refreshProfile();
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsProfileComplete(false);
          setIsProfileChecked(false);
          localStorage.removeItem(PROFILE_COMPLETE_KEY);
          toast.info("Signed out successfully");
        } else if (event === 'USER_UPDATED') {
          toast.info("User profile updated");
          // Defer profile fetching to avoid Supabase deadlock
          setTimeout(() => {
            refreshProfile();
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "session exists" : "no session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if we have stored profile completion status
        const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
        if (storedProfileComplete) {
          console.log('Found stored profile completion status: complete');
          setIsProfileComplete(true);
        }
        
        // Defer profile fetching to avoid Supabase deadlock
        setTimeout(() => {
          refreshProfile();
        }, 0);
      } else {
        // No session, mark as not loading and profile checked
        setIsProfileChecked(true);
      }
      
      // Mark auth as checked regardless of session
      setAuthChecked(true);
      setIsLoading(false);
    });

    return () => {
      console.log("Unsubscribing from auth state changes");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        profile,
        isLoading: isLoading || (!!user && !isProfileChecked), 
        isProfileComplete,
        signOut,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
