
import React, { useState, useEffect } from 'react';
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

const ProfileEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
  
  // Check if the profile exists yet
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loading />
        <p className="mt-4 text-muted-foreground">Loading profile data...</p>
      </div>
    );
  }
  
  // Pass the current user's profile data to the ProfileEditContainer
  return <ProfileEditContainer isNewUser={false} />;
};

export default ProfileEdit;
