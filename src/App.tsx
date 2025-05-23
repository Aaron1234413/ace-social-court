import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import ProfileEdit from '@/pages/ProfileEdit';
import Messages from '@/pages/Messages';
import TennisAI from '@/pages/TennisAI';
import Feed from '@/pages/Feed';
import LogMatch from '@/pages/LogMatch';
import LogSession from '@/pages/LogSession';
import Dashboard from '@/pages/Dashboard';
import MainLayout from '@/components/layout/MainLayout';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import MapExplorer from '@/pages/MapExplorer';
import Search from '@/pages/Search';
import UserTest from '@/pages/UserTest';
import { ErrorBoundary } from 'react-error-boundary';
import AppErrorFallback from '@/components/AppErrorFallback';
import NotFound from '@/pages/NotFound';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';

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
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <AuthProvider>
        <HelmetProvider>
          <Router>
            {/* Make sure LoginPromptModal is not inside any route so it can show regardless of current page */}
            <LoginPromptModal />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Admin Routes - Protected by AdminRoute */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
                {/* Future admin routes will be added here in subsequent phases */}
              </Route>
              
              <Route path="/feed" element={
                <MainLayout>
                  <Feed />
                </MainLayout>
              } />
              
              {/* IMPORTANT: The edit route must come before the :id route to avoid conflicts */}
              <Route path="/profile/edit" element={
                <MainLayout>
                  <ProfileEdit />
                </MainLayout>
              } />
              
              <Route path="/profile/:id" element={
                <MainLayout>
                  <Profile />
                </MainLayout>
              } />
              
              <Route path="/profile" element={
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
              <Route path="/explore" element={
                <MainLayout>
                  <MapExplorer />
                </MainLayout>
              } />
              <Route path="/search" element={
                <MainLayout>
                  <Search />
                </MainLayout>
              } />
              <Route path="/notifications" element={
                <MainLayout>
                  <Notifications />
                </MainLayout>
              } />
              <Route path="/settings" element={
                <MainLayout>
                  <Settings />
                </MainLayout>
              } />
              {/* User Testing Route */}
              <Route path="/user-testing" element={
                <MainLayout>
                  <UserTest />
                </MainLayout>
              } />
              {/* Log routes */}
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
              {/* Dashboard route */}
              <Route path="/dashboard" element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              } />
              {/* 404 route - must be last */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </HelmetProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
