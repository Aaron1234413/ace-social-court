
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MatchLogger from '@/components/logging/match/MatchLogger';
import LoginPromptModal from '@/components/logging/LoginPromptModal';
import { useAuth } from '@/components/AuthProvider';

export default function LogMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Navigate to login page or show login modal
    navigate('/');
  };

  if (!user) {
    return <LoginPromptModal onLogin={handleLogin} />;
  }

  return <MatchLogger />;
}
