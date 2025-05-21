
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import Messages from '@/pages/Messages';
import TennisAI from '@/pages/TennisAI';
import Feed from '@/pages/Feed';
import LogMatch from '@/pages/LogMatch';
import LogSession from '@/pages/LogSession';
import MainLayout from '@/components/layout/MainLayout';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';

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
        <LoginPromptModal />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/feed" element={
            <MainLayout>
              <Feed />
            </MainLayout>
          } />
          <Route path="/profile/:id" element={
            <MainLayout>
              <Profile />
            </MainLayout>
          } />
          <Route path="/messages" element={
            <MainLayout>
              <Messages />
            </MainLayout>
          } />
          <Route path="/messages/:chatId" element={
            <MainLayout>
              <Messages />
            </MainLayout>
          } />
          <Route path="/tennis-ai" element={
            <MainLayout>
              <TennisAI />
            </MainLayout>
          } />
          {/* Add new routes for match and session logging */}
          <Route path="/log/match" element={
            <MainLayout>
              <LogMatch />
            </MainLayout>
          } />
          <Route path="/log/session" element={
            <MainLayout>
              <LogSession />
            </MainLayout>
          } />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
