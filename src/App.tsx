
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import ProfileEdit from './pages/ProfileEdit';
import Profile from './pages/Profile';
import Search from './pages/Search';
import MapExplorer from './pages/MapExplorer';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import Navigation from './components/layout/Navigation';
import { AuthProvider, useAuth } from './components/AuthProvider';
import PostDetail from './pages/PostDetail';
import { Toaster } from '@/components/ui/sonner';
import VideoAnalysis from './pages/VideoAnalysis';

// Redirect component that sends users to their profile
const ProfileRedirect = () => {
  const { user, profile } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  // Redirect to username if available, otherwise use user ID
  return <Navigate to={`/profile/${profile?.username || user.id}`} />;
};

function App() {
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

  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Router>
          <Navigation />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile" element={<ProfileRedirect />} />
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
    </AuthProvider>
  );
}

export default App;
