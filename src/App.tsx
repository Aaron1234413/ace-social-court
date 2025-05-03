
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
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
import { AuthProvider, useAuth } from './components/AuthProvider';
import PostDetail from './pages/PostDetail';
import VideoAnalysis from './pages/VideoAnalysis';
import MainLayout from './components/layout/MainLayout';

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
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Helmet>
            <title>rallypointx</title>
            <meta name="description" content="tennis. together." />
            <meta property="og:title" content="rallypointx" />
            <meta property="og:description" content="tennis. together." />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://rallypointx.app" />
            <meta name="twitter:card" content="summary" />
            <meta name="twitter:title" content="rallypointx" />
            <meta name="twitter:description" content="tennis. together." />
          </Helmet>
          
          <MainLayout>
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
          </MainLayout>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
