
import React from 'react';
import Navigation from './Navigation';
import { useLocation } from 'react-router-dom';
import { Map } from 'lucide-react';

const EnhancedNavigation: React.FC = () => {
  const location = useLocation();
  
  // Since Navigation.tsx doesn't accept additionalNavItems directly,
  // we'll need to modify how we pass this information
  // For now, we'll not pass any props since Navigation handles its own links
  
  return <Navigation />;
};

export default EnhancedNavigation;
