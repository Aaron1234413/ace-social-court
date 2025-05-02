
import React from 'react';
import Navigation from './Navigation';
import { Toaster } from '@/components/ui/sonner';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navigation />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Toaster />
    </div>
  );
};

export default MainLayout;
