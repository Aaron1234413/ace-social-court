
import React from 'react';
import Navigation from './Navigation';
import { Toaster } from '@/components/ui/sonner';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Only show sidebar for logged in users and not on auth page
  const showSidebar = user && location.pathname !== "/auth";

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex flex-col min-h-screen w-full">
        <Navigation />
        
        <div className="flex flex-grow">
          {showSidebar && <AppSidebar />}
          <main className="flex-grow">
            {children}
          </main>
        </div>
        
        <Toaster />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
