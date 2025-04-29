import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import EnhancedNavigation from '@/components/layout/EnhancedNavigation';

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
import AdminTools from '@/pages/AdminTools'; // Add this import

// Components
import { Toaster } from "@/components/ui/sonner";

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
            <EnhancedNavigation />
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
            <footer className="w-full border-t bg-background">
              <div className="container py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Built with ❤️ by TennisAI
                </p>
              </div>
            </footer>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
