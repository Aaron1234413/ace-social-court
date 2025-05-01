
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

export const ProfileEditContainer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNewUser = location.state?.newUser === true;
  
  const [isLoading, setIsLoading] = useState(false);

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

  return <ProfileEditForm isNewUser={isNewUser} />;
};

export default ProfileEditContainer;
