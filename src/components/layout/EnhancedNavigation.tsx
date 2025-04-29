
import React from 'react';
import Navigation from './Navigation';
import { useLocation } from 'react-router-dom';
import { Map } from 'lucide-react';

interface NavigationProps {
  additionalNavItems?: Array<{
    label: string;
    icon: React.ReactNode;
    href: string;
    active: boolean;
  }>;
}

const EnhancedNavigation: React.FC = () => {
  const location = useLocation();
  
  // Define an additional navigation item for the Map
  const additionalNavItems = [
    {
      label: "Map",
      icon: <Map className="h-4 w-4" />,
      href: "/map",
      active: location.pathname === "/map"
    }
  ];
  
  return <Navigation additionalNavItems={additionalNavItems} />;
};

export default EnhancedNavigation;
