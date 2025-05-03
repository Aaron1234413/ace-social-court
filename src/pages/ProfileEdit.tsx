
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui/loading';

const ProfileEdit = () => {
  const location = useLocation();
  const isNewUser = location.state?.newUser;
  const { user, profile, isLoading } = useAuth();
  
  useEffect(() => {
    // Log whether this is a new user flow or not
    console.log("Profile Edit: New user flow?", isNewUser ? "Yes" : "No");
    console.log("Auth state:", { user, profile, isLoading });
  }, [isNewUser, user, profile, isLoading]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loading variant="spinner" text="Loading profile data..." />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ProfileEditContainer isNewUser={Boolean(isNewUser)} />
    </div>
  );
};

export default ProfileEdit;
