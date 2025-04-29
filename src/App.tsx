
import { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { useAuth, AuthProvider } from './components/AuthProvider';
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

// Create a separate component for the routes to use the auth hook
function AppRoutes() {
  const { user, session } = useAuth();
  const isLoading = session === null && user === null;

  // Show loading indicator while checking auth status
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
  );
}

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
