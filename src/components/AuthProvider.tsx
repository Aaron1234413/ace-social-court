
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

  const PROFILE_COMPLETE_KEY = 'user_profile_complete';

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error(`Error signing out: ${error.message}`);
      } else {
        setProfile(null);
        setIsProfileComplete(false);
        setIsProfileChecked(false);
        localStorage.removeItem(PROFILE_COMPLETE_KEY);
        toast.success("Signed out successfully");
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      toast.error('Failed to sign out');
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
      }
      
      const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
      setIsProfileComplete(profileIsComplete || storedProfileComplete);
      setIsProfileChecked(true);
      
    } catch (err) {
      console.error('AuthProvider: Failed to fetch profile:', err);
      setIsProfileChecked(true);
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Initializing with enhanced debugging");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AuthProvider: Auth state changed:", event, session ? "session exists" : "no session");
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session) {
          console.log("AuthProvider: User signed in:", session.user.email);
          toast.success("Signed in successfully!");
          
          // Check stored profile completion status
          const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
          if (storedProfileComplete) {
            setIsProfileComplete(true);
          }
          
          // Refresh profile data
          setTimeout(() => {
            refreshProfile();
          }, 100);
          
        } else if (event === 'SIGNED_OUT') {
          console.log("AuthProvider: User signed out");
          setProfile(null);
          setIsProfileComplete(false);
          setIsProfileChecked(false);
          localStorage.removeItem(PROFILE_COMPLETE_KEY);
          
        } else if (event === 'USER_UPDATED') {
          console.log("AuthProvider: User updated");
          // Refresh profile on user update
          setTimeout(() => {
            refreshProfile();
          }, 100);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthProvider: Initial session check:", session ? "session exists" : "no session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log("AuthProvider: Found existing session for user:", session.user.email);
        const storedProfileComplete = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';
        if (storedProfileComplete) {
          setIsProfileComplete(true);
        }
        
        setTimeout(() => {
          refreshProfile();
        }, 100);
      } else {
        console.log("AuthProvider: No existing session found");
        setIsProfileChecked(true);
      }
      
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
