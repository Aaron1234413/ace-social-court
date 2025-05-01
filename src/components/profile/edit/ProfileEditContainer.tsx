
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ProfileEditForm from './ProfileEditForm';
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
}

export const ProfileEditContainer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = location.state?.newUser === true;
  
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) {
      toast.error('You must be logged in to edit your profile');
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {  // Not found is ok for new users
          console.error('Error fetching profile:', error);
          throw error;
        }

        console.log('Fetched profile data:', data);
        setProfileData(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <ProfileEditForm isNewUser={isNewUser} profileData={profileData} />;
};

export default ProfileEditContainer;
