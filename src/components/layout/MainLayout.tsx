
import React from 'react';
import Navigation from './Navigation';
import { Toaster } from '@/components/ui/sonner';
import BottomNav from './navigation/BottomNav';
import { useAuth } from '@/components/AuthProvider';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  console.log("MainLayout rendering, user:", user ? "authenticated" : "unauthenticated");
  
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        {/* Sidebar (desktop only) */}
        {user && <AppSidebar />}
        
        <div className="flex flex-col flex-grow">
          <Navigation />
          
          <main className="flex-grow pb-16 md:pb-0">
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
