
import React, { useState, useEffect } from 'react';
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui/loading';
import { toast } from 'sonner';

const ProfileEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if the user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) {
        // Wait for auth state to load
        return;
      }
      
      if (!user) {
        // Redirect to login if not authenticated
        toast.info('Please login to edit your profile');
        navigate('/auth', { state: { from: location.pathname } });
        return;
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, [user, authLoading, navigate, location.pathname]);
  
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Loading variant="spinner" text="Loading authentication..." />
      </div>
    );
  }
  
  // If we have a user but no profile, we can still proceed with the edit form
  // since ProfileEditContainer handles the case where profile is null
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6 px-4">
        {profile ? 'Edit Your Profile' : 'Complete Your Profile'}
      </h1>
      <ProfileEditContainer isNewUser={!profile} />
    </div>
  );
};

export default ProfileEdit;
