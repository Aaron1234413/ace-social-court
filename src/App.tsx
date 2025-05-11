
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Loading } from '@/components/ui/loading';
import { AuthProvider, useAuth } from './components/AuthProvider';
import MainLayout from './components/layout/MainLayout';
import ErrorBoundary from './components/tennis-ai/ErrorBoundary';
import AppErrorFallback from './components/AppErrorFallback';
import { toast } from 'sonner';

// Lazy load pages to improve initial load time
const Index = React.lazy(() => import('./pages/Index'));
const Auth = React.lazy(() => import('./pages/Auth'));
const Feed = React.lazy(() => import('./pages/Feed'));
const ProfileEdit = React.lazy(() => import('./pages/ProfileEdit'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Search = React.lazy(() => import('./pages/Search'));
const MapExplorer = React.lazy(() => import('./pages/MapExplorer'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const PostDetail = React.lazy(() => import('./pages/PostDetail'));
const VideoAnalysis = React.lazy(() => import('./pages/VideoAnalysis'));
const TennisAI = React.lazy(() => import('./pages/TennisAI'));

// Redirect component that sends users to their profile
const ProfileRedirect = () => {
  const { user, profile } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  // Redirect to username if available, otherwise use user ID
  return <Navigate to={`/profile/${profile?.username || user.id}`} />;
};

// Loading fallback component
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center">
    <Loading variant="spinner" text="Loading page..." />
  </div>
);

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("You're back online!");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You're offline. Some features may be unavailable.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Mark as loaded after initial render
    const timer = setTimeout(() => setHasLoaded(true), 500);

    // Output to console for debugging
    console.log('App mounting, online status:', isOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  // Handle any uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      toast.error("An error occurred", {
        description: event.error?.message || "Something went wrong"
      });
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Output to console for debugging
  console.log('App rendering, online status:', isOnline, 'hasLoaded:', hasLoaded);

  if (!hasLoaded) {
    return <PageLoader />;
  }

  return (
    <HelmetProvider>
      <ErrorBoundary 
        fallback={({ error, resetErrorBoundary }) => (
          <AppErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
        )}
      >
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
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/tennis-ai" element={<TennisAI />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MainLayout>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
