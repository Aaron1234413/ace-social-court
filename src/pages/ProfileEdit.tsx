
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ProfileEdit = () => {
  const location = useLocation();
  const isNewUser = location.state?.newUser;
  
  useEffect(() => {
    // Log whether this is a new user flow or not
    console.log("Profile Edit: New user flow?", isNewUser ? "Yes" : "No");
  }, [isNewUser]);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <ProfileEditContainer isNewUser={Boolean(isNewUser)} />
    </div>
  );
};

export default ProfileEdit;
