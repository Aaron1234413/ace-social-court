
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { SocialGraphOnboarding } from '@/components/onboarding/SocialGraphOnboarding';

const SocialOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleOnboardingComplete = () => {
    // Navigate to feed after onboarding completion
    navigate('/feed');
  };

  // Redirect unauthenticated users to auth page
  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SocialGraphOnboarding onComplete={handleOnboardingComplete} />
    </div>
  );
};

export default SocialOnboarding;
