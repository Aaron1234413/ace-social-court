
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  user_type: 'player' | 'coach' | 'ambassador';
  roles: string[];
  current_active_role: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional' | null;
  bio: string | null;
  location_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  avatar_url?: string | null;
  assigned_coach_id?: string | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [isProfileChecked, setIsProfileChecked] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const PROFILE_COMPLETE_KEY = 'user_profile_complete';

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Error signing out: ${error.message}`);
    } else {
      setProfile(null);
      setIsProfileComplete(false);
      setIsProfileChecked(false);
      localStorage.removeItem(PROFILE_COMPLETE_KEY);
      toast.success("Signed out successfully");
    }
  };

  const refreshProfile = async () => {
    if (!user) {
      console.log("AuthProvider: No user, skipping profile refresh");
      setIsProfileChecked(true);
      return;
    }
    
    try {
      console.log('AuthProvider: Refreshing profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('AuthProvider: Error fetching profile:', error);
        setIsProfileChecked(true);
        return;
      }
      
      console.log('AuthProvider: Fetched profile data:', data);
      
      // Handle legacy profiles that don't have the new role fields
      const profileData = {
        ...data,
        roles: data.roles || [data.user_type || 'player'],
        current_active_role: data.current_active_role || data.user_type || 'player'
      };
      
      setProfile(profileData);
      
      // Check if profile is complete enough to use the app
      const hasUsername = !!profileData.username && profileData.username.trim() !== '';
      const hasFullName = !!profileData.full_name && profileData.full_name.trim() !== '';
      const hasUserType = !!profileData.user_type;
      const hasExperienceLevel = !!profileData.experience_level;
      
      const profileIsComplete = hasUsername && hasFullName && hasUserType && hasExperienceLevel;
      
      console.log('AuthProvider: Profile completion check:', {
        hasUsername,
        hasFullName,
        hasUserType,
        hasExperienceLevel,
        isComplete: profileIsComplete
      });
      
      if (profileIsComplete) {
        localStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
        console.log('AuthProvider: Profile is complete, saved to localStorage');
      }
      
      const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
      setIsProfileComplete(profileIsComplete || storedProfileComplete);
      setIsProfileChecked(true);
      
      console.log('AuthProvider: Profile loaded:', profileData);
      console.log('AuthProvider: Profile complete status:', profileIsComplete || storedProfileComplete, 
                  '(current:', profileIsComplete, ', stored:', storedProfileComplete, ')');
      
    } catch (err) {
      console.error('AuthProvider: Failed to fetch profile:', err);
      setIsProfileChecked(true);
    } finally {
      setIsProfileChecked(true);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Initializing");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth state changed:", event, session ? "session exists" : "no session");
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          toast.success("Signed in successfully!");
          
          // Check if we have stored profile completion status
          const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
          if (storedProfileComplete) {
            console.log('AuthProvider: Found stored profile completion status: complete');
            setIsProfileComplete(true);
          }
          
          // Still refresh profile to get latest data
          setTimeout(() => {
            refreshProfile();
          }, 0);
          
          // ⚠️ IMPORTANT DEBUGGING: Log if this is redirecting anywhere
          console.log('AuthProvider: SIGNED_IN event - CHECKING FOR ANY CODE THAT MIGHT REDIRECT');
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsProfileComplete(false);
          setIsProfileChecked(false);
          localStorage.removeItem(PROFILE_COMPLETE_KEY);
          toast.info("Signed out successfully");
          
          // ⚠️ IMPORTANT DEBUGGING: Log if this is redirecting anywhere  
          console.log('AuthProvider: SIGNED_OUT event - CHECKING FOR ANY CODE THAT MIGHT REDIRECT');
        } else if (event === 'USER_UPDATED') {
          toast.info("User profile updated");
          // Defer profile fetching to avoid Supabase deadlock
          setTimeout(() => {
            refreshProfile();
          }, 0);
          
          // ⚠️ IMPORTANT DEBUGGING: Log if this is redirecting anywhere
          console.log('AuthProvider: USER_UPDATED event - CHECKING FOR ANY CODE THAT MIGHT REDIRECT');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check:", session ? "session exists" : "no session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if we have stored profile completion status
        const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
        if (storedProfileComplete) {
          console.log('AuthProvider: Found stored profile completion status: complete');
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
      console.log("AuthProvider: Unsubscribing from auth state changes");
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
