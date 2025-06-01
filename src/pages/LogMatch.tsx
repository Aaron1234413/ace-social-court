
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MatchLogger from '@/components/logging/match/MatchLogger';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';
import { useAuth } from '@/components/AuthProvider';

export default function LogMatch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <LoginPromptModal />;
  }

  return <MatchLogger />;
}
