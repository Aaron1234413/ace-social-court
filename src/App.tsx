import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import Messages from '@/pages/Messages';
import TennisAI from '@/pages/TennisAI';

function App() {
  // Initialize storage buckets when app loads
  useEffect(() => {
    import('./integrations/supabase/storage')
      .then(({ initializeStorage }) => {
        initializeStorage()
          .then((success) => {
            if (success) {
              console.log('Storage initialization successful');
            } else {
              console.error('Storage initialization failed');
            }
          })
          .catch((err) => {
            console.error('Error during storage initialization:', err);
          });
      })
      .catch((err) => {
        console.error('Error importing storage module:', err);
      });
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:chatId" element={<Messages />} />
           <Route path="/tennis-ai" element={<TennisAI />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

