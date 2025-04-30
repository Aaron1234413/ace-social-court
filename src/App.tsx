
import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
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
import { useAuth } from './components/AuthProvider';
import { Toaster } from 'sonner';

// Create a separate component for the routes to use the auth hook
function AppRoutes() {
  const { user, isLoading } = useAuth();
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
        <Route path="/feed" element={<Feed />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/profile/:id?" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages/:chatId?" element={<Messages />} />
        <Route path="/search" element={<Search />} />
        <Route path="/map" element={<MapExplorer />} />
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
