
import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthProvider';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Search from './pages/Search';
import NotFound from './pages/NotFound';
import MapExplorer from './pages/MapExplorer';
import { Loader2 } from 'lucide-react';
import Navigation from './components/layout/Navigation';
import { initializeStorage } from './integrations/supabase/storage';
import EnhancedNavigation from './components/layout/EnhancedNavigation';
import { Toaster } from 'sonner';

// A component that handles auth-protected routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user && location.pathname !== '/auth') {
      console.log('User not authenticated, redirecting to auth page');
      navigate('/auth');
      return;
    }

    // If user is authenticated but profile is incomplete, redirect to profile edit
    // Only redirect if they're not already on the profile edit page
    if (!isLoading && user && !isProfileComplete && location.pathname !== '/profile/edit') {
      console.log('Profile incomplete, redirecting to profile edit');
      navigate('/profile/edit', { state: { newUser: true } });
    }
  }, [user, isLoading, isProfileComplete, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

// Create a separate component for the routes to use the auth hook
function AppRoutes() {
  const { user, isLoading, isProfileComplete } = useAuth();
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize storage buckets when app loads
  useEffect(() => {
    if (user) {
      initializeStorage().catch(console.error);
    }
  }, [user]);

  // Handle initialization after checking auth status
  useEffect(() => {
    // Mark as initialized once we've checked auth status
    // even if user is null (logged out), we still want to initialize
    setIsInitialized(true);
  }, []);

  // Log auth and profile state for debugging
  useEffect(() => {
    console.log('App Routes - Auth State:', { 
      user: user ? `${user.id} (${user.email})` : 'No user', 
      isLoading, 
      isProfileComplete,
      currentPath: location.pathname
    });
  }, [user, isLoading, isProfileComplete, location.pathname]);

  // Show loading indicator only during initial app load
  if (!isInitialized || isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Use Enhanced Navigation which handles auth state */}
      <EnhancedNavigation />
      
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/feed" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/post/:id" element={
          <ProtectedRoute>
            <PostDetail />
          </ProtectedRoute>
        } />
        <Route path="/profile/:id?" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/messages/:chatId?" element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } />
        <Route path="/map" element={
          <ProtectedRoute>
            <MapExplorer />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <div className="app min-h-screen bg-background">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-center" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
