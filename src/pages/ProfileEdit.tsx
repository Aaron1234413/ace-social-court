
import { ProfileEditContainer } from '@/components/profile/edit/ProfileEditContainer';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { Loading } from '@/components/ui/loading';
import { showInfoToast } from '@/hooks/use-toast';

const ProfileEdit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isNewUser = location.state?.newUser;
  const { user, profile, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Show welcome message for new users
    if (isNewUser) {
      showInfoToast(
        "Welcome to Tennis Connect!", 
        "Please complete your profile to get started"
      );
    }
    
    // Log whether this is a new user flow or not
    console.log("Profile Edit: New user flow?", isNewUser ? "Yes" : "No");
    console.log("Auth state:", { user, profile, isLoading });
  }, [isNewUser, user, profile, isLoading]);
  
  // Handle case when authentication fails
  useEffect(() => {
    if (!isLoading && !user) {
      setError("Authentication required");
    } else {
      setError(null);
    }
  }, [user, isLoading]);
  
  const handleRetry = () => {
    // Refresh the page to try loading again
    window.location.reload();
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loading variant="spinner" text="Loading profile data..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Loading 
          variant="error"
          error={{
            message: "Unable to access profile editor",
            guidance: "You must be logged in to edit your profile. Please log in and try again.",
            onRetry: () => navigate('/auth', { replace: true })
          }}
        />
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
