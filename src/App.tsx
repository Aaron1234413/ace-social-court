
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';

// Layout
import EnhancedNavigation from '@/components/layout/EnhancedNavigation';
import Navigation from '@/components/layout/Navigation';

// Pages
import Index from '@/pages/Index';
import Feed from '@/pages/Feed';
import MapExplorer from '@/pages/MapExplorer';
import Profile from '@/pages/Profile';
import ProfileEdit from '@/pages/ProfileEdit';
import Auth from '@/pages/Auth';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import Search from '@/pages/Search';
import PostDetail from '@/pages/PostDetail';
import NotFound from '@/pages/NotFound';
import AdminTools from '@/pages/AdminTools';

// Components
import { Toaster } from "@/components/ui/sonner";

// Create a layout component that handles authentication-based rendering
const AppLayout = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Use the Navigation component which already handles auth state */}
      <Navigation />
      
      {/* Only show EnhancedNavigation when logged in */}
      <div className="flex flex-1">
        {user && <div className="hidden md:block w-64 p-4 border-r bg-background">
          <EnhancedNavigation />
        </div>}
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/admin" element={<AdminTools />} />
            <Route path="/profile/:id?" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:conversationId" element={<Messages />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/search" element={<Search />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      
      <footer className="w-full border-t bg-background">
        <div className="container py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ by TennisAI
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  const [queryClient] = React.useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }
  
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
          <QueryClientProvider client={queryClient}>
            <AppLayout />
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
