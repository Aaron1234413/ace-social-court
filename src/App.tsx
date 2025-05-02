import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import ProfileEdit from './pages/ProfileEdit';
import Profile from './pages/Profile';
import Search from './pages/Search';
import MapExplorer from './pages/MapExplorer';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import EnhancedNavigation from './components/layout/Navigation';
import { useAuth } from './components/AuthProvider';
import PostDetail from './pages/PostDetail';
import { Toaster } from '@/components/ui/sonner';
import VideoAnalysis from './pages/VideoAnalysis';

function App() {
  const { isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner text-primary"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      
      <Router>
        <EnhancedNavigation />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:recipientId" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/analysis" element={<VideoAnalysis />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Toaster />
      </Router>
    </div>
  );
}

export default App;
