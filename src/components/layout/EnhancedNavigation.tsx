
import React, { useEffect, useState } from 'react';
import Navigation from './Navigation';
import { useAuth } from '@/components/AuthProvider';
import { useLocation } from 'react-router-dom';

const EnhancedNavigation: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(false);

  // Check if user is on auth page
  const isAuthPage = location.pathname === '/auth';
  
  // Only show navigation when user is logged in or not on auth page
  const showNav = user !== null || !isAuthPage;

  return showNav ? <Navigation /> : null;
};

export default EnhancedNavigation;
