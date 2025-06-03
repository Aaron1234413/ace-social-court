
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
import LogSession from '@/pages/LogSession';
import Dashboard from '@/pages/Dashboard';
import MainLayout from '@/components/layout/MainLayout';
import { LoginPromptModal } from '@/components/logging/LoginPromptModal';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import MapExplorer from '@/pages/MapExplorer';
import Search from '@/pages/Search';
import { ErrorBoundary } from 'react-error-boundary';
import AppErrorFallback from '@/components/AppErrorFallback';
import NotFound from '@/pages/NotFound';
import { AdminRoute } from '@/components/admin/AdminRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminContent from '@/pages/admin/AdminContent';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminCourts from '@/pages/admin/AdminCourts';
import MatchLogger from '@/components/logging/match/MatchLogger';

function App() {
  // Initialize storage buckets when app loads (non-blocking)
  useEffect(() => {
    // Run storage initialization in the background without blocking app startup
    import('./integrations/supabase/storage')
      .then(({ initializeStorage }) => {
        initializeStorage()
          .then((success) => {
            console.log('Background storage initialization result:', success);
          })
          .catch((err) => {
            console.warn('Background storage initialization failed:', err);
          });
      })
      .catch((err) => {
        console.warn('Error importing storage module:', err);
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
              {/* Root route - wrapped in MainLayout */}
              <Route path="/" element={
                <MainLayout>
                  <Index />
                </MainLayout>
              } />
              
              <Route path="/auth" element={<Auth />} />
              
              {/* Admin Routes - Protected by AdminRoute */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="courts" element={<AdminCourts />} />
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
              {/* Log routes - MOVED BEFORE 404 route to fix routing issue */}
              <Route path="/log/match" element={
                <MainLayout>
                  <MatchLogger />
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
