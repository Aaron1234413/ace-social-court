
import React, { useEffect } from 'react';
import Navigation from './Navigation';
import { Toaster } from '@/components/ui/sonner';
import BottomNav from './navigation/BottomNav';
import { useAuth } from '@/components/AuthProvider';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    console.log("MainLayout: Path changed to:", location.pathname);
  }, [location.pathname]);
  
  console.log("MainLayout rendering, user:", user ? "authenticated" : "unauthenticated", "path:", location.pathname);
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Tennis-themed background pattern */}
        <div className="absolute inset-0 court-pattern opacity-[0.02] pointer-events-none -z-10"></div>
        
        {/* Subtle tennis ball glow effect */}
        <div className="absolute top-20 right-20 w-40 h-40 bg-tennis-highlight/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-tennis-green/10 rounded-full blur-3xl -z-10 animate-pulse-subtle"></div>
        
        {/* Sidebar (desktop only) */}
        {user && <AppSidebar />}
        
        <div className="flex flex-col flex-grow">
          <Navigation />
          
          <main className="flex-grow pb-16 md:pb-0 relative">
            {children}
          </main>
          
          {/* Bottom navigation for mobile */}
          {user && <BottomNav />}
          
          <Toaster />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
