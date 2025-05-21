
import React, { useState, useEffect } from 'react';
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

const ProfileEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        // Redirect to login if not authenticated
        toast.info('Please login to edit your profile');
        navigate('/auth', { state: { from: location.pathname } });
      } else {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [user, navigate, location.pathname]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }
  
  // Always pass the current user's ID to the ProfileEditContainer
  return <ProfileEditContainer isNewUser={false} />;
};

export default ProfileEdit;
