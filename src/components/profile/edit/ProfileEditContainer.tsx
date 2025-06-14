
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ProfileEditWizard from './ProfileEditWizard';
import { Database } from '@/integrations/supabase/types';

type UserType = Database['public']['Enums']['user_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

export interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  user_type: UserType;
  playing_style: string | null;
  experience_level: ExperienceLevel | null;
  bio: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
}

interface ProfileEditContainerProps {
  isNewUser: boolean;
}

export const ProfileEditContainer = ({ isNewUser }: ProfileEditContainerProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) {
      console.log("No user found, redirecting to auth");
      toast.error('You must be logged in to edit your profile');
      navigate('/auth');
      return;
    }

    console.log("Profile edit container mounted, fetching profile for user:", user.id);
    console.log("Current auth profile data:", profile);

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // If we already have profile data from the auth context, use it
        if (profile) {
          console.log("Using profile data from auth context");
          setProfileData(profile as unknown as ProfileData);
          setIsLoading(false);
          return;
        }
        
        console.log("Fetching profile data from Supabase for user:", user.id);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          if (error.code !== 'PGRST116') { // Not found is ok for new users
            setError(`Failed to fetch profile: ${error.message}`);
            throw error;
          }
        }

        console.log('Fetched profile data:', data);
        setProfileData(data);
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        setError(`Error: ${error.message || 'Unknown error'}`);
        toast.error('Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate, profile]);

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 bg-primary text-white px-4 py-2 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-lg">Loading profile data...</span>
      </div>
    );
  }

  return <ProfileEditWizard isNewUser={isNewUser} profileData={profileData} />;
};

export default ProfileEditContainer;
